/**
 * The rules behind the Cut release workflow (`.github/workflows/cut-release.yml`,
 * README "Releasing"): the next version and the changelog edit a release
 * makes. The change notes it reads are in `changeNotes.ts`.
 * `scripts/cut-release.ts` applies them. It sits in scripts/, outside src/,
 * because everything under src/ ships in the package.
 *
 * Node only, and ERASABLE so plain `node` runs the script that imports it.
 */

export type Tier = "major" | "minor" | "patch";

const SEMVER = /^(\d+)\.(\d+)\.(\d+)$/;

function parse(version: string): [number, number, number] {
  const m = SEMVER.exec(version);
  if (!m) throw new Error(`"${version}" is not a version like 1.2.3`);
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

/**
 * The next version for a tier. While the package is 0.x, a **major** entry
 * raises the minor version, as semver allows before 1.0; 1.0.0 comes only when
 * a maintainer names it.
 */
export function bumpVersion(version: string, tier: Tier): string {
  const [major, minor, patch] = parse(version);
  if (tier === "major" && major === 0) return `0.${minor + 1}.0`;
  if (tier === "major") return `${major + 1}.0.0`;
  if (tier === "minor") return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

/** True when `b` is a later version than `a`. */
export function isLater(a: string, b: string): boolean {
  const x = parse(a);
  const y = parse(b);
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return y[i] > x[i];
  return false;
}

/**
 * The version to release: the tier's bump of `current`, or `named` when the
 * maintainer names one, which must be that bump or later.
 */
export function nextVersion(current: string, tier: Tier, named?: string): string {
  const bumped = bumpVersion(current, tier);
  if (named === undefined || named === "") return bumped;
  parse(named);
  if (named !== bumped && !isLater(bumped, named))
    throw new Error(`${named} is not ${bumped} or later (the ${tier} release after ${current})`);
  return named;
}

/**
 * Adds the `## <version> (<date>)` section with `body` above the newest
 * version's section, under the changelog's introduction.
 */
export function addSection(changelog: string, version: string, date: string, body: string): string {
  const lines = changelog.split("\n");
  if (lines.some((l) => l.startsWith(`## ${version} `) || l.trimEnd() === `## ${version}`))
    throw new Error(`the changelog already has a ${version} section`);
  if (lines.some((l) => l.trimEnd() === "## Unreleased"))
    throw new Error(`the changelog still has a "## Unreleased" section; move its entries to .changes/ notes`);
  const first = lines.findIndex((l) => l.startsWith("## "));
  const section = [`## ${version} (${date})`, "", ...body.trimEnd().split("\n"), ""];
  if (first < 0) return [...lines, ...(lines.at(-1) === "" ? [] : [""]), ...section].join("\n");
  return [...lines.slice(0, first), ...section, ...lines.slice(first)].join("\n");
}
