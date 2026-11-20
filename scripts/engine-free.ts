/**
 * Checks the built package (`lib/`, from `npm run build`) for the engine:
 *
 *   node scripts/engine-free.ts [lib]
 *
 * Outside the deprecated shims (`scripts/engineShims.mjs`), no emitted
 * JavaScript module or declaration may import `@verticopolis/engine`, by
 * name or by a relative path into a shim, so a game that installs the
 * components without the engine can load every other module. Lint checks
 * the sources; this checks what ships. It exits 1 and names each import it
 * refuses.
 */
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, posix, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { SHIM_FOLDERS, SHIM_MODELS } from "./engineShims.mjs";

/** Whether `path` (relative to lib/, posix, without its extension) is a shim. */
export function isShim(path: string): boolean {
  const [top, ...rest] = path.split("/");
  if (SHIM_FOLDERS.includes(top)) return true;
  return top === "model" && rest.length === 1 && SHIM_MODELS.includes(rest[0]);
}

/** The module specifiers a JavaScript module or declaration names. */
export function specifiers(code: string): string[] {
  const out: string[] = [];
  const re = /\b(?:from|import)\s*\(?\s*["']([^"']+)["']/g;
  for (let m = re.exec(code); m; m = re.exec(code)) out.push(m[1]);
  return out;
}

/** Strip a module file's extension: `.d.ts`, `.js` and `.ts`. */
const bare = (p: string): string => p.replace(/(\.d)?\.ts$|\.js$/, "");

/** What `code`, the module at `file` (relative to lib/), imports that reaches
 *  the engine. Empty for a shim, which may. */
export function engineImports(file: string, code: string): string[] {
  if (isShim(bare(file))) return [];
  return specifiers(code).filter((spec) => {
    if (spec === "@verticopolis/engine" || spec.startsWith("@verticopolis/engine/")) return true;
    if (!spec.startsWith(".")) return false;
    return isShim(bare(posix.normalize(posix.join(posix.dirname(file), spec))));
  });
}

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const path = join(dir, e.name);
    if (e.isDirectory()) return walk(path);
    return /\.(js|d\.ts)$/.test(e.name) ? [path] : [];
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const lib = resolve(root, process.argv[2] ?? "lib");
  const files = walk(lib);
  if (files.length === 0) throw new Error(`no modules in ${lib}: run npm run build first`);
  let bad = 0;
  for (const path of files) {
    const file = relative(lib, path).split("\\").join("/");
    for (const spec of engineImports(file, readFileSync(path, "utf8"))) {
      console.error(`::error file=lib/${file}::lib/${file} imports ${spec}, which reaches the engine`);
      bad++;
    }
  }
  if (bad > 0) process.exit(1);
  console.log(`Engine-free: ${files.length} modules in lib/, no engine import outside the shims.`);
}
