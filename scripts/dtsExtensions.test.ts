import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { rewrite } from "./dtsExtensions.ts";

describe("dtsExtensions rewrite", () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "dts-ext-"));
    mkdirSync(join(dir, "sub"));
    for (const f of ["index.d.ts", "a.d.ts", "b.d.ts", "sub/index.d.ts", "sub/c.d.ts"])
      writeFileSync(join(dir, f), "export {};\n");
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it("adds .js to files, /index.js to folders and turns .ts into .js", () => {
    const missing: string[] = [];
    const out = rewrite(
      join(dir, "a.d.ts"),
      [
        `import type { X } from "./b";`,
        `export * from "./sub";`,
        `export { Y } from "./sub/c.ts";`,
        `export type Z = import("./b").Z;`,
        `import data from "./table.json";`,
        `import { q } from "excalibur";`,
      ].join("\n"),
      missing,
    );
    expect(missing).toEqual([]);
    expect(out).toBe(
      [
        `import type { X } from "./b.js";`,
        `export * from "./sub/index.js";`,
        `export { Y } from "./sub/c.js";`,
        `export type Z = import("./b.js").Z;`,
        `import data from "./table.json";`,
        `import { q } from "excalibur";`,
      ].join("\n"),
    );
  });

  it("gives a bare . or .. its /index.js", () => {
    const missing: string[] = [];
    const out = rewrite(join(dir, "sub", "c.d.ts"), `export * from "..";\nexport * from ".";`, missing);
    expect(missing).toEqual([]);
    expect(out).toBe(`export * from "../index.js";\nexport * from "./index.js";`);
  });

  it("leaves an import written in a comment alone", () => {
    const text = `/** Use \`import { X } from "./b"\` instead. */\nexport {};\n`;
    expect(rewrite(join(dir, "a.d.ts"), text, [])).toBe(text);
  });

  it("reports a relative import that names no declaration", () => {
    const missing: string[] = [];
    rewrite(join(dir, "a.d.ts"), `import type { X } from "./gone";`, missing);
    expect(missing).toEqual([`${join(dir, "a.d.ts")}: ./gone`]);
  });
});
