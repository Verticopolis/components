import { describe, expect, it } from "vitest";
import { addSection, bumpVersion, nextVersion } from "./releaseCut";

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

describe("addSection", () => {
  const changelog = "# Components changelog\n\nIntro.\n\n## 0.2.2 (2026-11-19)\n\n- **major**: an old entry.\n";

  it("puts the new section above the newest one and keeps the rest", () => {
    const out = addSection(changelog, "0.3.0", "2026-11-20", "- **minor**: a.\n- **patch**: b.");
    expect(out).toBe(
      "# Components changelog\n\nIntro.\n\n## 0.3.0 (2026-11-20)\n\n- **minor**: a.\n- **patch**: b.\n\n## 0.2.2 (2026-11-19)\n\n- **major**: an old entry.\n",
    );
  });

  it("refuses a version the changelog already has, and a leftover Unreleased section", () => {
    expect(() => addSection(changelog, "0.2.2", "2026-11-20", "- **patch**: a.")).toThrow(/already has a 0\.2\.2/);
    expect(() => addSection("# C\n\n## Unreleased\n\n- x.\n", "1.0.0", "2026-11-20", "- **patch**: a.")).toThrow(
      /Unreleased/,
    );
  });
});
