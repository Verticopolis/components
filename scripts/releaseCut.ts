/**
 * The rules behind the Cut release workflow (`.github/workflows/cut-release.yml`,
 * README "Releasing"): which version the `## Unreleased` lines of
 * `CHANGELOG.md` ask for, and the changelog edit a release makes.
 * `scripts/cut-release.ts` applies them. It sits in scripts/, outside src/,
 * because everything under src/ ships in the package.
 *
 * Node only, and ERASABLE so plain `node` runs the script that imports it.
 */

export type Tier = "major" | "minor" | "patch";

const TIER_ORDER: readonly Tier[] = ["patch", "minor", "major"];
const UNRELEASED = "## Unreleased";
const SEMVER = /^(\d+)\.(\d+)\.(\d+)$/;
const TIERED_LINE = /^- \*\*(major|minor|patch)\*\*:/;

/** The lines under `## Unreleased`, up to the next `## ` heading. */
export function unreleasedLines(changelog: string): string[] {
  const lines = changelog.split("\n");
  const start = lines.findIndex((l) => l.trimEnd() === UNRELEASED);
  if (start < 0) throw new Error(`the changelog has no "${UNRELEASED}" section, so there is nothing to release`);
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((l) => l.startsWith("## "));
  return end < 0 ? rest : rest.slice(0, end);
}

/**
 * The highest tier the Unreleased entries name. Every entry (a line starting
 * with `- `) must lead with its tier, so a release never guesses one.
 */
export function unreleasedTier(changelog: string): Tier {
  const entries = unreleasedLines(changelog).filter((l) => l.startsWith("- "));
  if (entries.length === 0) throw new Error(`"${UNRELEASED}" has no entries, so there is nothing to release`);
  let best = -1;
  for (const entry of entries) {
    const m = TIERED_LINE.exec(entry);
    if (!m) throw new Error(`this Unreleased entry names no tier (**major**, **minor** or **patch**): ${entry}`);
    best = Math.max(best, TIER_ORDER.indexOf(m[1] as Tier));
  }
  return TIER_ORDER[best];
}

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
  if (named !== bumped && !isLater(bumped, named)) throw new Error(`${named} is not ${bumped} or later (the ${tier} release after ${current})`);
  return named;
}

/** Renames `## Unreleased` to `## <version> (<date>)`. */
export function renameUnreleased(changelog: string, version: string, date: string): string {
  const lines = changelog.split("\n");
  const i = lines.findIndex((l) => l.trimEnd() === UNRELEASED);
  if (i < 0) throw new Error(`the changelog has no "${UNRELEASED}" section`);
  if (lines.some((l) => l.startsWith(`## ${version} `) || l.trimEnd() === `## ${version}`)) throw new Error(`the changelog already has a ${version} section`);
  lines[i] = `## ${version} (${date})`;
  return lines.join("\n");
}
