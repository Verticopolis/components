// The Node half of scripts/node-consumer.sh: run in the consumer project, with
// the components and their peers installed. It lists every module the exports
// map serves, imports each one (with happy-dom standing in for the browser),
// and writes consumer.ts, which imports each one's declarations for the type
// check that follows.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { register } from "node:module";
import { join, posix } from "node:path";
import { Window } from "happy-dom";

const PKG = "@verticopolis/components";
const dir = join("node_modules", PKG);
const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));

/** lib/ folder → the subpath that serves it (`./render/*` → render). */
const served = new Map();
for (const [key, target] of Object.entries(pkg.exports)) {
  const to = typeof target === "string" ? target : target.default;
  const m = /^\.\/lib\/([^*]+)\/\*\.js$/.exec(to ?? "");
  if (m && key.endsWith("/*") && !served.has(m[1])) served.set(m[1], key.slice(2, -2));
}

function walk(sub) {
  return readdirSync(join(dir, "lib", sub), { withFileTypes: true }).flatMap((e) => {
    const path = posix.join(sub, e.name);
    if (e.isDirectory()) return walk(path);
    return e.name.endsWith(".js") ? [path.slice(0, -3)] : [];
  });
}

const entries = [...served].flatMap(([folder, subpath]) =>
  walk(folder).map((path) => `${PKG}/${subpath}/${path.slice(folder.length + 1)}`),
);
if (entries.length < 100) throw new Error(`only ${entries.length} entries found under ${dir}`);

// A window module imports its stylesheet, which a bundler handles; Node has no
// loader for .css, so each one loads here as an empty module.
register(
  "data:text/javascript," +
    encodeURIComponent(
      'export async function load(url, context, next) { return url.endsWith(".css") ? { format: "module", source: "", shortCircuit: true } : next(url, context); }',
    ),
);

// The browser the modules expect at load time.
const window = new Window({ url: "https://localhost/" });
for (const key of Object.getOwnPropertyNames(window)) {
  if (!(key in globalThis)) globalThis[key] = window[key];
}
globalThis.window = globalThis;
globalThis.document = window.document;

let failed = 0;
for (const spec of entries) {
  try {
    await import(spec);
  } catch (e) {
    failed++;
    console.error(`::error::${spec} does not load: ${e instanceof Error ? e.message : e}`);
  }
}
writeFileSync(
  "consumer.ts",
  entries.map((spec, i) => `import type * as m${i} from "${spec}";\nexport type T${i} = typeof m${i};\n`).join(""),
);
if (failed > 0) process.exit(1);
console.log(`${entries.length} modules load.`);
