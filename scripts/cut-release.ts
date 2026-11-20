/**
 * Cuts a components release from the change notes in `.changes/` (README
 * "Releasing", `.changes/README.md`). The Cut release workflow runs it on main; it also
 * runs by hand on a clean checkout:
 *
 *   node scripts/cut-release.ts                   the level the notes ask for
 *   node scripts/cut-release.ts --version 1.0.0   a named version, at or past it
 *
 * It raises the version in `package.json` and `package-lock.json` with
 * `npm version`, writes the notes' entries into a new `## <version> (<date>)`
 * section of `CHANGELOG.md` and deletes the notes. The rules are in
 * `scripts/releaseCut.ts` and `scripts/changeNotes.ts`. It prints the new version on its last
 * line.
 */
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { highestTier, isNoteFile, parseNote, sectionBody } from "./changeNotes.ts";
import { addSection, nextVersion } from "./releaseCut.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel: string) => readFileSync(join(root, rel), "utf8");
const write = (rel: string, text: string) => writeFileSync(join(root, rel), text);

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

try {
  const files = readdirSync(join(root, ".changes")).filter(isNoteFile).sort();
  const notes = files.map((f) => parseNote(f, read(join(".changes", f))));
  const tier = highestTier(notes);
  if (tier === undefined)
    throw new Error("no note in .changes/ names a level above none, so there is nothing to release");
  const was = (JSON.parse(read("package.json")) as { version: string }).version;
  const version = nextVersion(was, tier, arg("--version"));
  const date = new Date().toISOString().slice(0, 10);

  write("CHANGELOG.md", addSection(read("CHANGELOG.md"), version, date, sectionBody(notes)));
  for (const f of files) rmSync(join(root, ".changes", f));
  const win = process.platform === "win32";
  execFileSync(win ? "npm.cmd" : "npm", ["version", version, "--no-git-tag-version", "--ignore-scripts"], {
    cwd: root,
    stdio: ["ignore", "ignore", "inherit"],
    shell: win,
  });

  console.log(
    `cut-release: components ${was} -> ${version} (${arg("--version") ? "named" : tier}), ${files.length} note(s) into the changelog section dated ${date}`,
  );
  console.log(version);
} catch (e) {
  console.error(`cut-release: ${e instanceof Error ? e.message : String(e)}`);
  process.exit(1);
}
