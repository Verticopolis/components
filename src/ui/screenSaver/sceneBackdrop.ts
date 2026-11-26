import "../../styles/game/screen-saver.css"; // the backdrop canvas
import { runScene } from "./screenSaver";
import { SAVER_PIXEL, type SaverScene } from "./saverScene";

/**
 * A screen saver scene as a moving backdrop behind a page's windows (a launch
 * screen, say), at the saver's pixel size and look. The page draws the
 * canvas in its own template, with {@link SCENE_BACKDROP_CLASS} and
 * `aria-hidden="true"`, inside a holder it places; the canvas fills the
 * holder. It is decoration only: hidden from screen readers, it never takes a
 * press, and with reduced motion it holds one still frame.
 *
 * Cost: one canvas at one pixel per {@link SAVER_PIXEL} CSS pixels, drawn at
 * most `MAX_FPS` times a second while it is up (`runScene`). A resize builds
 * the scene again at the new size, at most once a frame. Nothing runs once it
 * is stopped or the canvas leaves the page, and the resize listener goes with
 * the stop, or at the first resize after the canvas has left.
 */

export interface SceneBackdropOpts {
  /** Build the scene for a canvas this many pixels wide and high. */
  readonly makeScene: (w: number, h: number) => SaverScene;
  /** One still frame instead of motion (reduced motion). */
  readonly still: boolean;
}

/** The class the backdrop's canvas wears (`styles/game/screen-saver.css`). */
export const SCENE_BACKDROP_CLASS = "scene-backdrop";

/** The canvas size, in canvas pixels, for a canvas this many CSS pixels big;
 *  the window's size when it has none yet. */
export function backdropSize(cssW: number, cssH: number, win: Pick<Window, "innerWidth" | "innerHeight">) {
  const w = cssW > 0 ? cssW : win.innerWidth;
  const h = cssH > 0 ? cssH : win.innerHeight;
  return { w: Math.max(1, Math.ceil(w / SAVER_PIXEL)), h: Math.max(1, Math.ceil(h / SAVER_PIXEL)) };
}

/** Run a scene on `canvas`, sized to the canvas's CSS box, and build it
 *  again at the new size after the window is resized (once per frame, however
 *  many resize events a drag sends). A canvas not yet on the page is built
 *  on the next frame, so a template's `ref` may start it. Returns a stop that ends the motion and
 *  the listener; a resize after the canvas has left the page stops it too. */
export function startSceneBackdrop(
  canvas: HTMLCanvasElement,
  opts: SceneBackdropOpts,
  win: Window = window,
): () => void {
  let stopScene = () => {};
  let queued = 0;
  const start = () => {
    stopScene();
    const { w, h } = backdropSize(canvas.clientWidth, canvas.clientHeight, win);
    canvas.width = w;
    canvas.height = h;
    stopScene = runScene(canvas, opts.makeScene(w, h), opts.still, win);
  };
  const stop = () => {
    stopScene();
    win.cancelAnimationFrame(queued);
    queued = 0;
    win.removeEventListener("resize", resized);
  };
  const rebuild = () => {
    queued = 0;
    if (canvas.isConnected) start();
    else stop();
  };
  function resized(): void {
    if (!canvas.isConnected) return stop();
    if (queued === 0) queued = win.requestAnimationFrame(rebuild);
  }
  // A template's ref hands the canvas over before it is on the page, when it
  // has no size yet: build on the next frame, once it is laid out.
  if (canvas.isConnected) start();
  else queued = win.requestAnimationFrame(rebuild);
  win.addEventListener("resize", resized);
  return stop;
}
