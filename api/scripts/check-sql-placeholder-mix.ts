#!/usr/bin/env node
// Reject query.sql statements that mix anonymous `?` with `sqlc.arg(...)`
// in the same SQL body.
//
// sqlc-gen-moonbit emits `?` (auto-numbered by SQLite spec: "max used +
// 1") alongside `sqlc.arg(name)` (compiled to a fixed `?N`). When both
// appear in the same statement, a trailing anonymous `?` can land on a
// number higher than the bind-array length, and D1 returns a parameter
// count mismatch (surfaces as 500 on the public memory handler).
//
// Rule: within a single -- name: ... statement, use either pure
// anonymous `?` or pure `sqlc.arg(...)`.

import { existsSync, readdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const sqliteRoot = resolve(import.meta.dirname, "..", "db", "sqlite");

function splitStatements(text: string) {
  const statements: { name: string; lines: string[] }[] = [];
  let current: { name: string; lines: string[] } | null = null;
  for (const rawLine of text.split("\n")) {
    const nameMatch = rawLine.match(/^--\s*name:\s*(\S+)/);
    if (nameMatch) {
      if (current) statements.push(current);
      current = { name: nameMatch[1], lines: [] };
      continue;
    }
    if (current) current.lines.push(rawLine);
  }
  if (current) statements.push(current);
  return statements;
}

function stripStringsAndComments(body: string) {
  let out = "";
  let i = 0;
  while (i < body.length) {
    const ch = body[i];
    if (ch === "'") {
      i += 1;
      while (i < body.length) {
        if (body[i] === "'" && body[i + 1] === "'") {
          i += 2;
          continue;
        }
        if (body[i] === "'") {
          i += 1;
          break;
        }
        i += 1;
      }
      continue;
    }
    if (ch === "-" && body[i + 1] === "-") {
      while (i < body.length && body[i] !== "\n") i += 1;
      continue;
    }
    out += ch;
    i += 1;
  }
  return out;
}

function findOffenders(statements: { name: string; lines: string[] }[]) {
  const offenders: string[] = [];
  for (const stmt of statements) {
    const body = stripStringsAndComments(stmt.lines.join("\n"));
    const hasAnonymous = /\?(?!\d)/.test(body);
    const hasSqlcArg = /\bsqlc\.arg\s*\(/.test(body);
    if (hasAnonymous && hasSqlcArg) {
      offenders.push(stmt.name);
    }
  }
  return offenders;
}

async function discoverQueryFiles(): Promise<string[]> {
  if (!existsSync(sqliteRoot)) return [];
  const files: string[] = [];
  for (const entry of readdirSync(sqliteRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const queryPath = resolve(sqliteRoot, entry.name, "query.sql");
    if (existsSync(queryPath)) files.push(queryPath);
  }
  return files.sort();
}

async function main() {
  const queryFiles = await discoverQueryFiles();
  if (queryFiles.length === 0) {
    console.log("check-sql-placeholder-mix: skipped (no domain query.sql files found).");
    return;
  }

  let totalStatements = 0;
  const allOffenders: { file: string; names: string[] }[] = [];

  for (const file of queryFiles) {
    const text = await readFile(file, "utf8");
    const statements = splitStatements(text);
    totalStatements += statements.length;
    const offenders = findOffenders(statements);
    if (offenders.length > 0) {
      allOffenders.push({ file, names: offenders });
    }
  }

  if (allOffenders.length === 0) {
    console.log(
      `check-sql-placeholder-mix: OK (${queryFiles.length} file(s), ${totalStatements} statements scanned, no anonymous-vs-named mixes).`,
    );
    return;
  }

  console.error(
    `check-sql-placeholder-mix: ${allOffenders.length} file(s) with placeholder mixes:`,
  );
  for (const { file, names } of allOffenders) {
    for (const name of names) {
      console.error(`  - ${file}: ${name}`);
    }
  }
  console.error(
    "Convert remaining `?` to sqlc.arg('<n>') so the generator emits consecutive ?1..?N.",
  );
  process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(2);
});
