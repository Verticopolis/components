/**
 * Cuts a components release from the `## Unreleased` lines of `CHANGELOG.md`
 * (README "Releasing"). The Cut release workflow runs it on main; it also
 * runs by hand on a clean checkout:
 *
 *   node scripts/cut-release.ts                   the level the entries ask for
 *   node scripts/cut-release.ts --version 1.0.0   a named version, at or past it
 *
 * It raises the version in `package.json` and `package-lock.json` with
 * `npm version` and renames `## Unreleased` to `## <version> (<date>)`. The
 * rules are in `scripts/releaseCut.ts`. It prints the new version on its last
 * line.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { nextVersion, renameUnreleased, unreleasedTier } from "./releaseCut.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel: string) => readFileSync(join(root, rel), "utf8");
const write = (rel: string, text: string) => writeFileSync(join(root, rel), text);

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

try {
  const changelog = read("CHANGELOG.md");
  const tier = unreleasedTier(changelog);
  const was = (JSON.parse(read("package.json")) as { version: string }).version;
  const version = nextVersion(was, tier, arg("--version"));
  const date = new Date().toISOString().slice(0, 10);

  write("CHANGELOG.md", renameUnreleased(changelog, version, date));
  const win = process.platform === "win32";
  execFileSync(win ? "npm.cmd" : "npm", ["version", version, "--no-git-tag-version", "--ignore-scripts"], {
    cwd: root,
    stdio: ["ignore", "ignore", "inherit"],
    shell: win,
  });

  console.log(`cut-release: components ${was} -> ${version} (${arg("--version") ? "named" : tier}), changelog section dated ${date}`);
  console.log(version);
} catch (e) {
  console.error(`cut-release: ${e instanceof Error ? e.message : String(e)}`);
  process.exit(1);
}
