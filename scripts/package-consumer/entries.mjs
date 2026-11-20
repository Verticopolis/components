// Writes entries.ts in the current directory: one type-only import of every
// declaration the installed @verticopolis/components exports, found by
// walking its lib/ through the package's own exports map. Run by
// scripts/package-consumer.sh inside the temporary project.
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const root = "node_modules/@verticopolis/components";
const { exports } = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const walk = (dir) =>
  readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
const files = walk(join(root, "lib"))
  .filter((f) => f.endsWith(".d.ts"))
  .map((f) => relative(root, f).split("\\").join("/"));

const specifiers = new Set();
for (const [key, target] of Object.entries(exports)) {
  const types = typeof target === "object" && target !== null ? target.types : undefined;
  if (!key.includes("*") || typeof types !== "string") continue;
  const [pre, post] = types.slice(2).split("*");
  for (const f of files) {
    if (!f.startsWith(pre) || !f.endsWith(post)) continue;
    const middle = f.slice(pre.length, f.length - post.length);
    // `shared/*` is the alias of `model/*`: one name per file is enough.
    if (key === "./shared/*") continue;
    specifiers.add(`@verticopolis/components/${key.slice(2).replace("*", middle)}`);
  }
}
if (specifiers.size === 0) throw new Error("the package exports no declarations");
const lines = [...specifiers].sort().map((s, i) => `import type * as m${i} from "${s}";\nexport type { m${i} };`);
writeFileSync("entries.ts", lines.join("\n") + "\n");
console.log(`${specifiers.size} entries`);
