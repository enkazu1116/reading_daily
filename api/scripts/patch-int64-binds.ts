#!/usr/bin/env node
// Post-`sqlc generate` patch: wrap every `@core.any(params.<int64_field>)`
// site in each domain's `sqlc_queries.mbt` with `int64_bind_safe(...)` so the
// underlying BigInt is coerced to Number before `.bind()`.
//
// Root cause: docs/regression/worker-deploy.md §Int64-bind hang. `@core.any(Int64)` passes BigInt to D1 bind, which
// causes `.all()` / `.run()` to never resolve and the Worker hangs.
//
// This patch reads the Params struct definitions from each domain's
// `sqlc_types.mbt` to learn which fields are `Int64` / `Int64?`, then rewrites
// the bind list in `sqlc_queries.mbt`. Re-run after every `sqlc generate`.
// Wire into `package.json` `db:generate` so it always runs.
//
// Two modes:
//   --apply  (default): rewrite the file in place. Used by db:generate.
//   --verify          : exit non-zero if any Int64 bind site is still
//                        unwrapped, without touching the file. Used as
//                        a build / CI gate to catch a regression where
//                        someone hand-edited the gen file or the patch
//                        step was skipped.
//
// Upstream fix would be: have sqlc-gen-moonbit emit the Number conversion
// itself. Filed as a follow-up issue.

import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const mode = process.argv.includes("--verify") ? "verify" : "apply";

const root = resolve(import.meta.dirname, "..");
const genRoot = resolve(root, "src/db/gen");

function discoverGenDirs(): string[] {
  if (!existsSync(genRoot)) return [];
  const dirs: string[] = [];
  for (const entry of readdirSync(genRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    dirs.push(resolve(genRoot, entry.name));
  }
  return dirs.sort();
}

function patchDomain(genDir: string): { edits: number; int64Fields: number; problems: string[] } {
  const typesPath = resolve(genDir, "sqlc_types.mbt");
  const queriesPath = resolve(genDir, "sqlc_queries.mbt");
  const domain = genDir.split("/").slice(-1)[0] ?? genDir;

  if (!existsSync(typesPath) || !existsSync(queriesPath)) {
    return { edits: 0, int64Fields: 0, problems: [] };
  }

  const typesSource = readFileSync(typesPath, "utf8");
  const queriesSource = readFileSync(queriesPath, "utf8");

  const int64Fields = new Map<string, "required" | "optional">();
  for (const m of typesSource.matchAll(/pub struct (\w+Params) \{([^}]*)\}/g)) {
    const structName = m[1];
    const body = m[2];
    for (const fm of body.matchAll(/(\w+)\s*:\s*Int64(\?)?\s*\n/g)) {
      int64Fields.set(`${structName}::${fm[1]}`, fm[2] ? "optional" : "required");
    }
  }

  if (int64Fields.size === 0) {
    return { edits: 0, int64Fields: 0, problems: [] };
  }

  let patched = queriesSource;
  let edits = 0;
  const unwrappedSites: string[] = [];

  const blocks = patched.split(/^(?=pub async fn )/m);
  const rewrittenBlocks = blocks.map((block) => {
    const sigMatch = block.match(
      /^pub async fn (\w+)\(db : @cloudflare\.D1Database, params : (\w+Params)\)/,
    );
    if (!sigMatch) return block;
    const fnName = sigMatch[1];
    const paramsType = sigMatch[2];

    let updated = block;
    for (const bindMatch of [...block.matchAll(/@core\.any\(params\.(\w+)\)/g)]) {
      const field = bindMatch[1];
      if (int64Fields.get(`${paramsType}::${field}`) === "required") {
        const before = `@core.any(params.${field})`;
        const after = `@core.any(int64_bind_safe(params.${field}))`;
        if (updated.includes(before)) {
          unwrappedSites.push(`${domain} :: ${fnName} :: ${paramsType}.${field}`);
          updated = updated.replaceAll(before, after);
          edits += 1;
        }
      }
    }
    for (
      const optMatch of [
        ...block.matchAll(
          /\(match params\.(\w+) \{ Some\(v\) => @core\.any\(v\); None => @core\.null\(\) \}\)/g,
        ),
      ]
    ) {
      const field = optMatch[1];
      if (int64Fields.get(`${paramsType}::${field}`) === "optional") {
        const before = optMatch[0];
        const after =
          `(match params.${field} { Some(v) => @core.any(int64_bind_safe(v)); None => @core.null() })`;
        if (updated.includes(before)) {
          unwrappedSites.push(`${domain} :: ${fnName} :: ${paramsType}.${field}?`);
          updated = updated.replaceAll(before, after);
          edits += 1;
        }
      }
    }
    return updated;
  });
  patched = rewrittenBlocks.join("");

  const helperPresent = patched.includes('extern "js" fn int64_bind_safe(');
  const problems: string[] = [];

  if (mode === "verify") {
    if (edits > 0) {
      problems.push(
        `${domain}: ${edits} unwrapped Int64 bind site(s):\n` +
          unwrappedSites.map((s) => `    - ${s}`).join("\n"),
      );
    }
    if (!helperPresent) {
      problems.push(
        `${domain}: int64_bind_safe helper extern is missing from sqlc_queries.mbt.`,
      );
    }
    return { edits, int64Fields: int64Fields.size, problems };
  }

  if (edits === 0 && helperPresent) {
    return { edits: 0, int64Fields: int64Fields.size, problems: [] };
  }

  const helperBlock =
    `///|\n` +
    `/// Patched in by scripts/patch-int64-binds.ts after every \`sqlc generate\`.\n` +
    `/// Wraps Int64 values as JS Number before passing them to D1.bind() so\n` +
    `/// the BigInt → bind hang (docs/regression/worker-deploy.md §Int64-bind hang) doesn't recur.\n` +
    `extern "js" fn int64_bind_safe(value : Int64) -> @core.Any =\n` +
    `  #| (n) => Number(n)\n\n`;

  if (!helperPresent) {
    const insertPoint = patched.indexOf("///| Read a required");
    if (insertPoint < 0) {
      problems.push(
        `${domain}: could not find insertion point in sqlc_queries.mbt.`,
      );
      return { edits, int64Fields: int64Fields.size, problems };
    }
    patched = patched.slice(0, insertPoint) + helperBlock + patched.slice(insertPoint);
  }

  writeFileSync(queriesPath, patched);
  console.log(
    `patch-int64-binds: ${domain} — wrapped ${edits} Int64 bind site(s) ` +
      `(${int64Fields.size} Int64 fields scanned).`,
  );
  return { edits, int64Fields: int64Fields.size, problems: [] };
}

const genDirs = discoverGenDirs();
if (genDirs.length === 0) {
  console.log(
    `patch-int64-binds${mode === "verify" ? " --verify" : ""}: skipped (no codegen yet — run \`npm run db:generate\`).`,
  );
  process.exit(0);
}

let totalEdits = 0;
let totalFields = 0;
const allProblems: string[] = [];

for (const genDir of genDirs) {
  const result = patchDomain(genDir);
  totalEdits += result.edits;
  totalFields += result.int64Fields;
  allProblems.push(...result.problems);
}

if (mode === "verify") {
  if (allProblems.length > 0) {
    console.error(
      "patch-int64-binds --verify FAILED:\n  " +
        allProblems.join("\n  ") +
        "\n\nRun `npm run db:generate` and commit the result.",
    );
    process.exit(1);
  }
  console.log(
    `patch-int64-binds --verify: OK (${genDirs.length} domain(s), ` +
      `${totalFields} Int64 fields scanned, no unwrapped bind sites).`,
  );
  process.exit(0);
}

if (totalEdits === 0) {
  console.log(
    `patch-int64-binds: no Int64 bind sites needed patching across ${genDirs.length} domain(s).`,
  );
}
