import * as fallback from './fallback';

export interface Tokenizer {
  normalize(text: string): string;
  tokenize(text: string): string;
  prepareQuery(query: string): string;
}

let cached: Tokenizer | null = null;

type WasmCompileOptions = {
  builtins?: string[];
};

type WasmInstantiateOptions = {
  builtins?: string[];
  importedStringConstants?: string;
};

async function loadWasmTokenizer(): Promise<Tokenizer | null> {
  try {
    const wasmUrl = new URL('../wasm/tokenizer.wasm', import.meta.url);
    const response = await fetch(wasmUrl);
    if (!response.ok) return null;

    const bytes = await response.arrayBuffer();
    const wasm = WebAssembly as typeof WebAssembly & {
      compile: (bytes: BufferSource, options?: WasmCompileOptions) => Promise<WebAssembly.Module>;
      instantiate: (
        module: WebAssembly.Module,
        imports?: WebAssembly.Imports,
        options?: WasmInstantiateOptions,
      ) => Promise<WebAssembly.Instance>;
    };

    const module = await wasm.compile(bytes, { builtins: ['js-string'] });
    const instance = await wasm.instantiate(module, {}, {
      builtins: ['js-string'],
      importedStringConstants: '_',
    });

    const exports = instance.exports as Record<string, (input: string) => string>;
    if (
      typeof exports.normalize !== 'function' ||
      typeof exports.tokenize !== 'function' ||
      typeof exports.prepare_query !== 'function'
    ) {
      return null;
    }

    return {
      normalize: exports.normalize,
      tokenize: exports.tokenize,
      prepareQuery: exports.prepare_query,
    };
  } catch {
    return null;
  }
}

export async function getTokenizer(): Promise<Tokenizer> {
  if (cached) return cached;

  const wasm = await loadWasmTokenizer();
  cached =
    wasm ??
    ({
      normalize: fallback.normalize,
      tokenize: fallback.tokenize,
      prepareQuery: fallback.prepareQuery,
    } satisfies Tokenizer);

  return cached;
}
