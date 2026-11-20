import { describe, expect, it } from "vitest";
import { deskMode, pocketBody, POCKET_BODY_CLASS, type DeskScreen } from "./deskPocket";

describe("deskMode", () => {
  const none: DeskScreen = { forced: null, computer: false, wide: false, touch: false, roomy: false };

  it("gives a computer the full desk and a small computer window none", () => {
    expect(deskMode({ ...none, computer: true, wide: true })).toBe("desk");
    expect(deskMode({ ...none, wide: true })).toBeNull();
  });

  it("gives a touchscreen at least 1024 by 600 the full desk and a smaller one the pocket desk", () => {
    expect(deskMode({ ...none, touch: true, wide: true, roomy: true })).toBe("desk");
    expect(deskMode({ ...none, touch: true, wide: true })).toBe("pocket");
    expect(deskMode({ ...none, touch: true })).toBe("pocket");
  });

  it("follows the testing switches", () => {
    expect(deskMode({ ...none, forced: "off", computer: true, touch: true })).toBeNull();
    expect(deskMode({ ...none, forced: "pocket", computer: true })).toBe("pocket");
    expect(deskMode({ ...none, forced: "any", wide: true })).toBe("desk");
    expect(deskMode({ ...none, forced: "any" })).toBeNull();
  });
});

describe("pocketBody", () => {
  it("is an empty grid element, ready to be placed and filled", () => {
    const grid = pocketBody(document);
    expect(grid.tagName).toBe("DIV");
    expect(grid.className).toBe(POCKET_BODY_CLASS);
    expect(grid.childElementCount).toBe(0);
    const tower = document.createElement("section");
    tower.append(grid);
    grid.append(document.createElement("p"));
    expect(tower.querySelector(`.${POCKET_BODY_CLASS} > p`)).not.toBeNull();
  });
});
