/**
 * The Modern catalog the atlas bake draws from, read from the installed
 * `@verticopolis/engine` package's web build (`node_modules/@verticopolis/engine/web/`):
 * the Rust engine's catalog, the only one the game reads. The bake binds the
 * view to it in Node (`ArchiveInfo.catalog`) and in the page (`__vcAtlas.bind`), so
 * every size and kind fact in the atlas is the one the game draws with.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { readCatalog, type Catalog } from "../src/engineBinding/catalog";
import type { WasmModule } from "../src/engineBinding/binding";

export async function atlasCatalog(root: string): Promise<Catalog> {
  const dir = resolve(root, "node_modules/@verticopolis/engine/web");
  const glue = resolve(dir, "verticopolis_engine.js");
  const bytes = resolve(dir, "verticopolis_engine_bg.wasm");
  if (!existsSync(glue) || !existsSync(bytes)) {
    throw new Error(`the atlas reads its catalog from the engine package, and ${dir} has no web build; run npm ci`);
  }
  const mod = (await import(/* @vite-ignore */ pathToFileURL(glue).href)) as Pick<WasmModule, "catalog"> & {
    initSync(arg: { module: BufferSource }): unknown;
  };
  mod.initSync({ module: readFileSync(bytes) });
  return readCatalog(mod, "modern");
}
