/**
 * The Modern render catalog the atlas bake draws from. By default it is the
 * components' own hand-written one (`src/tests/catalogFixture.ts`), at the
 * sizes the art is drawn for. A game that wants an atlas cut to its own
 * catalog passes `--catalog <file>`, a JSON render catalog
 * (`render/renderModel.ts` `RenderCatalog`). The bake binds the view to it in
 * Node (`ArchiveInfo.catalog`) and in the page (`__vcAtlas.bind`).
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { RenderCatalog } from "../src/render/renderModel";
import { catalogFor } from "../src/tests/catalogFixture";

export function atlasCatalog(root: string, file?: string): RenderCatalog {
  if (!file) return catalogFor("modern");
  const catalog = JSON.parse(readFileSync(resolve(root, file), "utf8")) as RenderCatalog;
  if (catalog.mode !== "modern") throw new Error(`the atlas draws the Modern catalog, and ${file} is ${catalog.mode}`);
  return catalog;
}
