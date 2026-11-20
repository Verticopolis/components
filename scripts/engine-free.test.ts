import { describe, expect, it } from "vitest";
import { engineImports, isShim, specifiers } from "./engine-free.ts";

describe("the engine-free check on lib/", () => {
  it("knows the shims: whole folders, and only the listed modules in model/", () => {
    expect(isShim("simport/view")).toBe(true);
    expect(isShim("wasmhost/engineBoot")).toBe(true);
    expect(isShim("model/types")).toBe(true);
    expect(isShim("model/inputEvents")).toBe(false);
    expect(isShim("render/renderModel")).toBe(false);
    expect(isShim("render/catalog")).toBe(false);
  });

  it("reads static, side-effect, re-export and dynamic imports", () => {
    const code = [
      'import { a } from "./a.js";',
      'import "./b.js";',
      'export * from "../c.js";',
      'export { d } from "./d";',
      'const e = await import("./e.js");',
      'import type { F } from "@verticopolis/engine/model/types";',
    ].join("\n");
    expect(specifiers(code)).toEqual([
      "./a.js",
      "./b.js",
      "../c.js",
      "./d",
      "./e.js",
      "@verticopolis/engine/model/types",
    ]);
  });

  it("refuses the engine by name and a relative path into a shim, outside the shims only", () => {
    const code =
      'import { x } from "@verticopolis/engine/port/view";\nimport { y } from "../../simport/view.js";\nimport { z } from "../renderModel.js";';
    expect(engineImports("render/excalibur/towerScene.js", code)).toEqual([
      "@verticopolis/engine/port/view",
      "../../simport/view.js",
    ]);
    expect(engineImports("render/excalibur/towerScene.d.ts", 'import type { T } from "../../model/types";')).toEqual([
      "../../model/types",
    ]);
    expect(engineImports("render/x.js", 'import { w } from "../model/inputEvents.js";')).toEqual([]);
    expect(engineImports("simport/view.js", code)).toEqual([]);
  });
});
