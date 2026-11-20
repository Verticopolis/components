import { describe, expect, it } from "vitest";
import { bumpVersion, nextVersion, renameUnreleased, unreleasedTier } from "./releaseCut";

const changelog = (body: string) => `# Components changelog\n\nIntro.\n\n## Unreleased\n\n${body}\n## 0.2.2 (2026-11-19)\n\n- **major**: an old entry.\n`;

describe("unreleasedTier", () => {
  it("takes the highest tier among the Unreleased entries", () => {
    expect(unreleasedTier(changelog("- **patch**: a fix.\n  More text.\n\n- **minor**: a new API.\n"))).toBe("minor");
    expect(unreleasedTier(changelog("- **patch**: a fix.\n"))).toBe("patch");
    expect(unreleasedTier(changelog("- **minor**: a.\n- **major**: b.\n- **patch**: c.\n"))).toBe("major");
  });

  it("reads only the Unreleased section", () => {
    expect(unreleasedTier(changelog("- **patch**: a fix.\n"))).not.toBe("major");
  });

  it("refuses an entry with no tier, an empty section and a missing one", () => {
    expect(() => unreleasedTier(changelog("- **patch**: a fix.\n- a line with no tier.\n"))).toThrow(/names no tier/);
    expect(() => unreleasedTier(changelog(""))).toThrow(/no entries/);
    expect(() => unreleasedTier("# Components changelog\n\n## 1.0.0 (2026-01-01)\n\n- **patch**: x.\n")).toThrow(/no "## Unreleased"/);
  });
});

describe("nextVersion", () => {
  it("bumps by tier", () => {
    expect(bumpVersion("1.58.3", "patch")).toBe("1.58.4");
    expect(bumpVersion("1.58.3", "minor")).toBe("1.59.0");
    expect(bumpVersion("1.58.3", "major")).toBe("2.0.0");
  });

  it("keeps a breaking change in 0.x until 1.0.0 is named", () => {
    expect(bumpVersion("0.2.2", "major")).toBe("0.3.0");
    expect(bumpVersion("0.2.2", "minor")).toBe("0.3.0");
    expect(bumpVersion("0.2.2", "patch")).toBe("0.2.3");
    expect(nextVersion("0.2.2", "major", "1.0.0")).toBe("1.0.0");
  });

  it("takes a named version only at or past the bump", () => {
    expect(nextVersion("1.58.0", "minor")).toBe("1.59.0");
    expect(nextVersion("1.58.0", "minor", "")).toBe("1.59.0");
    expect(nextVersion("1.58.0", "minor", "2.0.0")).toBe("2.0.0");
    expect(nextVersion("1.58.0", "minor", "1.59.0")).toBe("1.59.0");
    expect(() => nextVersion("1.58.0", "minor", "1.58.1")).toThrow(/not 1\.59\.0 or later/);
    expect(() => nextVersion("1.58.0", "patch", "v1.59")).toThrow(/not a version/);
  });
});

describe("renameUnreleased", () => {
  it("renames the heading and keeps the rest", () => {
    const out = renameUnreleased(changelog("- **minor**: a.\n"), "0.3.0", "2026-11-20");
    expect(out).toContain("## 0.3.0 (2026-11-20)\n\n- **minor**: a.\n");
    expect(out).not.toContain("## Unreleased");
    expect(out).toContain("## 0.2.2 (2026-11-19)");
  });

  it("refuses a version the changelog already has", () => {
    expect(() => renameUnreleased(changelog("- **patch**: a.\n"), "0.2.2", "2026-11-20")).toThrow(/already has a 0\.2\.2/);
  });
});
