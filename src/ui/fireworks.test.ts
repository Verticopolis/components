import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  LAUNCH_WINDOW_MS,
  MAX_SPARKS,
  PIXEL,
  SPARKS_PER_BURST,
  burst,
  drawSky,
  newSky,
  playFireworks,
  skyDone,
  stepSky,
  stillSky,
} from "./fireworks";

describe("the sky", () => {
  it("sends up a rocket, bursts it at its height and lets the sparks die out", () => {
    const sky = newSky(200, 100);
    stepSky(sky, 16, () => 0.5);
    expect(sky.rockets).toHaveLength(1);
    let sawSparks = false;
    for (let i = 0; i < 1000 && !skyDone(sky); i++) {
      stepSky(sky, 50, () => 0.5);
      if (sky.sparks.length) sawSparks = true;
    }
    expect(sawSparks).toBe(true);
    expect(skyDone(sky)).toBe(true);
  });

  it("launches no rockets after the launch window", () => {
    const sky = newSky(200, 100);
    sky.elapsedMs = LAUNCH_WINDOW_MS + 1;
    stepSky(sky, 50, () => 0.5);
    expect(sky.rockets).toHaveLength(0);
  });

  it("clamps a long stall to one short step", () => {
    const sky = newSky(200, 100);
    stepSky(sky, 10_000, () => 0.5);
    expect(sky.elapsedMs).toBeLessThanOrEqual(50);
  });

  it("caps the live sparks", () => {
    const sky = newSky(200, 100);
    const bursts = Math.ceil(MAX_SPARKS / SPARKS_PER_BURST) + 3;
    for (let i = 0; i < bursts; i++) burst(sky, 100, 50, "#ffffff", () => 0.5);
    expect(sky.sparks).toHaveLength(MAX_SPARKS);
  });

  it("lays out the same still frame of four full bursts every time", () => {
    const sky = stillSky(200, 100);
    expect(sky.sparks).toHaveLength(4 * SPARKS_PER_BURST);
    expect(sky.rockets).toHaveLength(0);
    expect(stillSky(200, 100)).toEqual(sky);
  });

  it("paints one pixel per spark and per rocket", () => {
    const sky = newSky(200, 100);
    burst(sky, 100, 50, "#ffc94a", () => 0.5);
    sky.rockets.push({ x: 10, y: 90, vy: -50, burstY: 20, color: "#50e0ff" });
    const ctx = { clearRect: vi.fn(), fillRect: vi.fn(), fillStyle: "", globalAlpha: 1 };
    drawSky(ctx as unknown as CanvasRenderingContext2D, sky);
    expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 200, 100);
    expect(ctx.fillRect).toHaveBeenCalledTimes(SPARKS_PER_BURST + 1);
    expect(ctx.globalAlpha).toBe(1);
  });
});

describe("playFireworks", () => {
  let host: HTMLElement;
  let ctx: { clearRect: ReturnType<typeof vi.fn>; fillRect: ReturnType<typeof vi.fn>; imageSmoothingEnabled: boolean };
  let frames: FrameRequestCallback[];
  const raf = (cb: FrameRequestCallback) => frames.push(cb);
  /** Run the waiting frame at `now`, and say whether another was asked for. */
  const runFrame = (now: number) => {
    const cb = frames.shift();
    cb?.(now);
    return frames.length > 0;
  };

  beforeEach(() => {
    host = document.createElement("div");
    host.append(document.createElement("p"));
    document.body.replaceChildren(host);
    ctx = { clearRect: vi.fn(), fillRect: vi.fn(), imageSmoothingEnabled: true };
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(ctx as unknown as CanvasRenderingContext2D);
    frames = [];
  });

  afterEach(() => vi.restoreAllMocks());

  it("puts a hidden, unsmoothed canvas a PIXEL-th of the screen first in its host", () => {
    const show = playFireworks(document, host, { reducedMotion: false, width: 400, height: 201, raf });
    expect(host.firstElementChild).toBe(show.canvas);
    expect(show.canvas.className).toBe("launch-fireworks-sky");
    expect(show.canvas.getAttribute("aria-hidden")).toBe("true");
    expect(show.canvas.width).toBe(400 / PIXEL);
    expect(show.canvas.height).toBe(Math.ceil(201 / PIXEL));
    expect(ctx.imageSmoothingEnabled).toBe(false);
  });

  it("animates until the sky is empty, then asks for no more frames", () => {
    playFireworks(document, host, { reducedMotion: false, width: 400, height: 200, raf, rand: () => 0.5 });
    let now = 0;
    let more = true;
    let count = 0;
    while (more && count < 1000) {
      more = runFrame(now);
      now += 50;
      count++;
    }
    expect(more).toBe(false);
    expect(count).toBeGreaterThan(LAUNCH_WINDOW_MS / 50);
    expect(ctx.fillRect).toHaveBeenCalled();
  });

  it("draws one still frame with reduced motion, and asks for none", () => {
    playFireworks(document, host, { reducedMotion: true, width: 400, height: 200, raf });
    expect(frames).toHaveLength(0);
    expect(ctx.fillRect).toHaveBeenCalledTimes(4 * SPARKS_PER_BURST);
  });

  it("stops and leaves the page on stop, or when its host takes the canvas away", () => {
    const show = playFireworks(document, host, { reducedMotion: false, width: 400, height: 200, raf });
    runFrame(0);
    show.stop();
    expect(show.canvas.isConnected).toBe(false);
    expect(runFrame(50)).toBe(false);

    const again = playFireworks(document, host, { reducedMotion: false, width: 400, height: 200, raf });
    runFrame(0);
    host.replaceChildren();
    ctx.fillRect.mockClear();
    expect(runFrame(50)).toBe(false);
    expect(ctx.fillRect).not.toHaveBeenCalled();
    expect(again.canvas.isConnected).toBe(false);
  });
});
