import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { backdropSize, startSceneBackdrop } from "./sceneBackdrop";
import type { SaverScene } from "./saverScene";

const scene = (): SaverScene => ({ step: vi.fn(), draw: vi.fn() });

function canvasOf(size: { w: number; h: number }): HTMLCanvasElement {
  const el = document.createElement("canvas");
  Object.defineProperty(el, "clientWidth", { get: () => size.w });
  Object.defineProperty(el, "clientHeight", { get: () => size.h });
  document.body.append(el);
  return el;
}

/** The frames the backdrop asked for, run by hand. */
let frames: FrameRequestCallback[];
const runFrames = () => {
  const now = frames;
  frames = [];
  now.forEach((f) => f(0));
};
const resize = () => window.dispatchEvent(new Event("resize"));

beforeEach(() => {
  frames = [];
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((f) => frames.push(f));
  vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = "";
});

describe("the backdrop's size", () => {
  it("is one canvas pixel per four CSS pixels, rounded up", () => {
    expect(backdropSize(1280, 801, { innerWidth: 1, innerHeight: 1 })).toEqual({ w: 320, h: 201 });
  });

  it("falls back to the window when the canvas has no size yet", () => {
    expect(backdropSize(0, 0, { innerWidth: 844, innerHeight: 390 })).toEqual({ w: 211, h: 98 });
  });
});

describe("the backdrop", () => {
  it("sizes the canvas to its box and builds the scene at that size", () => {
    const canvas = canvasOf({ w: 400, h: 200 });
    const makeScene = vi.fn(scene);
    startSceneBackdrop(canvas, { makeScene, still: true });
    expect([canvas.width, canvas.height]).toEqual([100, 50]);
    expect(makeScene).toHaveBeenCalledWith(100, 50);
  });

  it("builds the scene again at the new size once per frame, however many resizes come", () => {
    const size = { w: 400, h: 200 };
    const canvas = canvasOf(size);
    const makeScene = vi.fn(scene);
    startSceneBackdrop(canvas, { makeScene, still: true });
    size.w = 800;
    resize();
    resize();
    resize();
    expect(makeScene).toHaveBeenCalledTimes(1);
    runFrames();
    expect(makeScene).toHaveBeenCalledTimes(2);
    expect(makeScene).toHaveBeenLastCalledWith(200, 50);
    expect(canvas.width).toBe(200);
  });

  it("builds nothing more once stopped, even from a frame already asked for", () => {
    const canvas = canvasOf({ w: 400, h: 200 });
    const makeScene = vi.fn(scene);
    const stop = startSceneBackdrop(canvas, { makeScene, still: true });
    resize();
    stop();
    resize();
    expect(window.cancelAnimationFrame).toHaveBeenCalled();
    expect(frames).toHaveLength(1);
    expect(makeScene).toHaveBeenCalledTimes(1);
  });

  it("lets go of the window once the canvas has left the page", () => {
    const canvas = canvasOf({ w: 400, h: 200 });
    const makeScene = vi.fn(scene);
    const off = vi.spyOn(window, "removeEventListener");
    startSceneBackdrop(canvas, { makeScene, still: true });
    canvas.remove();
    resize();
    expect(off).toHaveBeenCalledWith("resize", expect.any(Function));
    expect(frames).toHaveLength(0);
    resize();
    expect(makeScene).toHaveBeenCalledTimes(1);
  });

  it("stops at the queued frame when the canvas left after the resize", () => {
    const canvas = canvasOf({ w: 400, h: 200 });
    const makeScene = vi.fn(scene);
    const off = vi.spyOn(window, "removeEventListener");
    startSceneBackdrop(canvas, { makeScene, still: true });
    resize();
    canvas.remove();
    runFrames();
    expect(makeScene).toHaveBeenCalledTimes(1);
    expect(off).toHaveBeenCalledWith("resize", expect.any(Function));
  });
});
