import * as ex from "excalibur";
import { afterEach, describe, expect, it } from "vitest";
import { teardownEngine, textureCollector } from "./engineTeardown";

// A real Excalibur engine, not a double: the point is to fail when an
// Excalibur upgrade moves the private collector this module reaches into.
// happy-dom has no canvas, so getContext answers with a stand-in that takes
// every call; WebGL creation fails and Excalibur falls back to Canvas2D.
const anything: unknown = new Proxy(function () {}, {
  get: (_t, key) => (key === Symbol.toPrimitive ? () => 0 : anything),
  apply: () => anything,
});
const realGetContext = HTMLCanvasElement.prototype.getContext;

function engine(): ex.Engine {
  (HTMLCanvasElement.prototype as { getContext: unknown }).getContext = (kind: string) =>
    kind === "webgl2" ? null : anything;
  const canvas = document.createElement("canvas");
  document.body.appendChild(canvas);
  return new ex.Engine({
    canvasElement: canvas,
    suppressPlayButton: true,
    suppressConsoleBootMessage: true,
    physics: false,
  });
}

afterEach(() => {
  HTMLCanvasElement.prototype.getContext = realGetContext;
  document.body.replaceChildren();
});

describe("teardownEngine", () => {
  it("finds the texture collector where this Excalibur keeps it", () => {
    const e = engine();
    expect(
      textureCollector(e),
      `Excalibur ${ex.EX_VERSION} moved its texture collector; update engineTeardown.ts`,
    ).toBeDefined();
  });

  it("stops a running texture collector when the clock is already stopped", () => {
    const e = engine();
    const gc = textureCollector(e)!;
    // What Engine.start() does, without loading a scene: the collector runs.
    (gc as unknown as { start(): void }).start();
    expect(gc.isRunning).toBe(true);
    // A context lost while the screen saver held the frames: the clock is
    // stopped, so Engine.dispose()'s own stop() skips the collector.
    expect(e.clock.isRunning).toBe(false);
    teardownEngine(e);
    expect(gc.isRunning).toBe(false);
  });

  it("is safe on an engine whose collector never started", () => {
    const e = engine();
    expect(() => teardownEngine(e)).not.toThrow();
    expect(textureCollector(e)!.isRunning).toBe(false);
  });
});
