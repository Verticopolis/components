/**
 * The 2.5D split of the side view's room art, painted live for the Tower in
 * 3D: each room's wall (its shell) on one canvas and its furniture and seated
 * people on another, using the same layer marks the atlas bake records
 * (`pixelSprites/layers.ts`, docs/atlas.md "Depth layers"). The 3D view hangs
 * the shell on the back wall and stands the furniture out in front of it.
 *
 * Each painter runs twice per room: once on the shell canvas, where the canvas
 * is put back as it stood at the break when the furniture ends, and once on
 * the furniture canvas, where everything before the break is cleared and the
 * marks drawn after the end only tint the furniture (source-atop), as the
 * bake's soft furniture does.
 */
import type { RenderUnit } from "../render/renderModel";
import { drawUnit, lobbyVariant, type DrawCtx } from "../render/sprites";
import { drawLobbyTile } from "../render/sprites/structure/lobby";
import { withLayerHook } from "../render/pixelSprites/layers";
import { shellMarks } from "../render/atlas/shellMarks";

/** A rectangle in canvas pixels. */
export interface PxRect {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

/** The three canvases a band paints its split on. */
export interface SplitTargets {
  readonly shell: CanvasRenderingContext2D;
  readonly front: CanvasRenderingContext2D;
  /** Holds a room's shell aside while its furniture paints. */
  readonly aside: CanvasRenderingContext2D;
  /** The canvas scale (canvas pixels per world pixel). */
  readonly scale: number;
}

/** A piece of a room that paints with one break: the room, or one lobby tile. */
interface Piece {
  readonly x: number;
  readonly w: number;
  readonly draw: (d: DrawCtx) => void;
}

/** A room's pieces at world pixels `x, y, w, h`. A lobby marks a break per tile, so it paints tile by tile. */
function pieces(u: RenderUnit, x: number, y: number, w: number, h: number): Piece[] {
  if (u.kind !== "lobby") return [{ x, w, draw: (d) => drawUnit(d, u, x, y, w, h) }];
  const tiles = Math.max(1, Math.min(Math.round(u.width) || 1, Math.ceil(w)));
  const pitch = w / tiles;
  const out: Piece[] = [];
  for (let t = 0; t < tiles; t++) {
    const x0 = x + t * pitch;
    const tw = t === tiles - 1 ? x + w - x0 : pitch;
    out.push({ x: x0, w: tw, draw: (d) => drawLobbyTile(d, x0, y, tw, h, lobbyVariant(u.x + t), u.floor === 1) });
  }
  return out;
}

/** Paints room `u` at world pixels `x, y, w, h` on both canvases. */
export function paintSplit(
  t: SplitTargets,
  look: Omit<DrawCtx, "ctx">,
  u: RenderUnit,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  for (const p of pieces(u, x, y, w, h)) {
    const s = t.scale;
    const px: PxRect = {
      x: Math.floor(p.x * s),
      y: Math.floor(y * s),
      w: Math.ceil((p.x + p.w) * s) - Math.floor(p.x * s),
      h: Math.ceil((y + h) * s) - Math.floor(y * s),
    };
    const clip = (ctx: CanvasRenderingContext2D): void => {
      ctx.beginPath();
      ctx.rect(p.x, y, p.w, h);
      ctx.clip();
    };
    paintShell(t, px, clip, (ctx) => p.draw({ ...look, ctx }));
    paintFront(t, px, clip, (ctx) => p.draw({ ...look, ctx }));
  }
}

/** Runs `draw` with the context's transform set to the identity. */
function raw(ctx: CanvasRenderingContext2D, draw: () => void): void {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  try {
    draw();
  } finally {
    ctx.restore();
  }
}

/** The shell: the canvas at the break, put back when the furniture ends, plus whatever the paint draws after. */
function paintShell(
  t: SplitTargets,
  r: PxRect,
  clip: (ctx: CanvasRenderingContext2D) => void,
  draw: (ctx: CanvasRenderingContext2D) => void,
): void {
  const ctx = t.shell;
  const late: { m: DOMMatrix; draw: () => void }[] = [];
  const marks = shellMarks(
    () =>
      raw(t.aside, () => {
        t.aside.clearRect(r.x, r.y, r.w, r.h);
        t.aside.drawImage(ctx.canvas, r.x, r.y, r.w, r.h, r.x, r.y, r.w, r.h);
      }),
    () => {
      raw(ctx, () => {
        ctx.clearRect(r.x, r.y, r.w, r.h);
        ctx.drawImage(t.aside.canvas, r.x, r.y, r.w, r.h, r.x, r.y, r.w, r.h);
      });
      // Shell art the paint drew among the furniture goes back on the wall.
      for (const l of late) {
        ctx.save();
        ctx.setTransform(l.m);
        l.draw();
        ctx.restore();
      }
    },
    (d) => late.push({ m: ctx.getTransform(), draw: d }),
  );
  ctx.save();
  clip(ctx);
  try {
    withLayerHook(marks.hook, () => draw(ctx));
  } catch {
    // A painter that can't draw this room leaves its wall plain.
  } finally {
    marks.finish();
    ctx.restore();
  }
}

/** The furniture: cleared at the break, so it lands on transparency; the marks after the end only tint it. */
function paintFront(
  t: SplitTargets,
  r: PxRect,
  clip: (ctx: CanvasRenderingContext2D) => void,
  draw: (ctx: CanvasRenderingContext2D) => void,
): void {
  const ctx = t.front;
  const restore = ctx.restore.bind(ctx);
  const marks = shellMarks(
    () => raw(ctx, () => ctx.clearRect(r.x, r.y, r.w, r.h)),
    () => {
      ctx.globalCompositeOperation = "source-atop";
      ctx.restore = () => {
        restore();
        ctx.globalCompositeOperation = "source-atop";
      };
    },
    // Shell art among the furniture only cuts away the furniture it covers.
    (d) => {
      const prev = ctx.globalCompositeOperation;
      ctx.globalCompositeOperation = "destination-out";
      try {
        d();
      } finally {
        ctx.globalCompositeOperation = prev;
      }
    },
  );
  ctx.save();
  clip(ctx);
  let split: boolean;
  try {
    withLayerHook(marks.hook, () => draw(ctx));
  } catch {
    // Nothing stands in front of a room its painter can't draw.
  } finally {
    split = marks.finish();
    ctx.restore = restore;
    ctx.restore();
    ctx.globalCompositeOperation = "source-over";
  }
  // A room with no split (a vacancy, a bare floor) is all wall.
  if (!split) raw(ctx, () => ctx.clearRect(r.x, r.y, r.w, r.h));
}
