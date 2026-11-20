/** The canvas helpers every painted demo shares. */

/** A canvas sized in CSS pixels, drawn at the screen's pixel ratio (at most
 *  2) with smoothing off, so whole world pixels stay square blocks. */
export function canvasFor(cssW: number, cssH: number, label: string): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", label);
  const ctx = canvas.getContext("2d")!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;
  return [canvas, ctx];
}

/** A figure holding a canvas, its title, an optional caption line and an
 *  optional link (to the player's manual) at the end of the caption. */
export function figure(canvas: HTMLCanvasElement, title: string, caption?: string, link?: HTMLElement): HTMLElement {
  const fig = document.createElement("figure");
  const cap = document.createElement("figcaption");
  const name = document.createElement("strong");
  name.textContent = title;
  cap.append(name);
  if (caption) cap.append(document.createElement("br"), caption);
  if (link) cap.append(" ", link);
  fig.append(canvas, cap);
  return fig;
}
