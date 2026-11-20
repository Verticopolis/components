/**
 * Adds `.js` to every relative import in the declarations under a folder
 * (scripts/dtsExtensions.ts). scripts/build-lib.sh runs it on lib/, after the
 * declarations are emitted and the hand-written ones are copied in, and
 * scripts/package-consumer.sh on excalibur's declarations for its nodenext
 * check:
 *
 *   node scripts/dts-extensions.ts lib
 *
 * A relative import that names no declaration file fails it, so a typo
 * cannot ship as a silent `any`.
 */
import { addExtensions } from "./dtsExtensions.ts";

const root = process.argv[2];
if (!root) {
  console.error("usage: dts-extensions.ts <dir>");
  process.exit(2);
}
const { changed, missing } = addExtensions(root);
if (missing.length) {
  console.error(`relative imports that name no declaration:\n${missing.join("\n")}`);
  process.exit(1);
}
console.log(`Added .js to the relative imports of ${changed} declaration files.`);
