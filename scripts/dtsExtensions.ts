/**
 * Gives every relative import in emitted declarations a `.js` extension, so a
 * project that resolves modules the way Node does (`module` or
 * `moduleResolution` `nodenext`) can follow them. The sources import without
 * an extension (or with `.ts`), which `tsc` copies into the `.d.ts` files as
 * written; the JavaScript that Vite emits already carries `.js`.
 * scripts/dts-extensions.ts runs it on lib/.
 *
 * It also drops a module's import of its own stylesheet (`import
 * "../styles/window.css";`), which `tsc` copies into the declaration too: the
 * types need nothing from it, and a project that checks side-effect imports
 * (`noUncheckedSideEffectImports`) would fail on a CSS file it has no
 * declaration for.
 */
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import ts from "typescript";

/** The specifier with its `.js` (or `/index.js`) added, or `null` when it
 *  names no declaration. JSON and CSS imports stay as they are. */
export function withExtension(fromFile: string, spec: string): string | null {
  if (/\.(js|json|css)$/.test(spec)) return spec;
  const base = spec.replace(/\.ts$/, "");
  const target = resolve(dirname(fromFile), base);
  if (existsSync(`${target}.d.ts`)) return `${base}.js`;
  if (existsSync(join(target, "index.d.ts"))) return `${base}/index.js`;
  return null;
}

/** Rewrite one file's text; the specifiers that could not be resolved go to
 *  `missing`. TypeScript's own scanner finds the imports, exports and
 *  `import("…")` types, so an import written in a comment is left alone. */
export function rewrite(file: string, text: string, missing: string[]): string {
  const found = ts.preProcessFile(text, true, true).importedFiles.filter((f) => /^\.{1,2}(\/|$)/.test(f.fileName));
  let out = text;
  for (const f of [...found].sort((a, b) => b.pos - a.pos)) {
    const next = withExtension(file, f.fileName);
    if (next === null) missing.push(`${file}: ${f.fileName}`);
    else if (next !== f.fileName) {
      // The scanner's position may be the opening quote's or the text's.
      const start = text[f.pos] === '"' || text[f.pos] === "'" ? f.pos + 1 : f.pos;
      if (text.slice(start, start + f.fileName.length) !== f.fileName)
        throw new Error(`${file}: cannot find ${f.fileName} at ${f.pos}`);
      out = out.slice(0, start) + next + out.slice(start + f.fileName.length);
    }
  }
  return out.replace(/^import ["'][^"']+\.css["'];\n?/gm, "");
}

function declarations(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return declarations(path);
    return name.endsWith(".d.ts") ? [path] : [];
  });
}

/** Rewrite every declaration under `root` in place. Returns how many files
 *  changed and the specifiers that name no declaration. */
export function addExtensions(root: string): { changed: number; missing: string[] } {
  const missing: string[] = [];
  let changed = 0;
  for (const file of declarations(resolve(root))) {
    const text = readFileSync(file, "utf8");
    const next = rewrite(file, text, missing);
    if (next !== text) {
      writeFileSync(file, next);
      changed++;
    }
  }
  return { changed, missing };
}
