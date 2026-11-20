import { describe, expect, it } from "vitest";
import {
  SKYLINE_BUILDINGS,
  SKYLINE_VIEWBOX,
  SKYLINE_WINDOWS,
  SKYLINE_WINDOW_COLOR,
} from "../src/ui/titleScreen/titleSkyline.ts";
import { skylineImage } from "./splashSkyline.ts";

describe("the skyline image", () => {
  it("draws every building in the given colors and every lit window", () => {
    const doc = new DOMParser().parseFromString(skylineImage({ building: "#123456", ink: "#000001" }), "image/svg+xml");
    const svg = doc.documentElement;
    expect(svg.getAttribute("viewBox")).toBe(SKYLINE_VIEWBOX);
    const [buildings, windows] = [...svg.querySelectorAll("g")];
    expect([buildings!.getAttribute("fill"), buildings!.getAttribute("stroke")]).toEqual(["#123456", "#000001"]);
    expect([...buildings!.querySelectorAll("path")].map((p) => p.getAttribute("d"))).toEqual(SKYLINE_BUILDINGS);
    expect(windows!.getAttribute("fill")).toBe(SKYLINE_WINDOW_COLOR);
    expect(
      [...windows!.querySelectorAll("rect")].map((r) => [Number(r.getAttribute("x")), Number(r.getAttribute("y"))]),
    ).toEqual(SKYLINE_WINDOWS);
  });
});
