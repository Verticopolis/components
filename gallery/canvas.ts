/** The canvas helpers every painted demo shares. */
import { html, nothing, type TemplateResult } from "lit-html";
import { ifDefined } from "lit-html/directives/if-defined.js";
import { ref } from "lit-html/directives/ref.js";

/** Paints a canvas once it is drawn. */
export type Paint = (ctx: CanvasRenderingContext2D) => void;

/** A canvas sized in CSS pixels, drawn at the screen's pixel ratio (at most
 *  2) with smoothing off, so whole world pixels stay square blocks. `paint`
 *  runs once lit has drawn the element, with the ratio already applied.
 *  `width` pins the canvas's CSS width, for a strip the page shrinks only to
 *  fit a narrow screen. */
export function canvasTemplate(
  cssW: number,
  cssH: number,
  label: string,
  paint: Paint,
  width?: string,
): TemplateResult {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const drawn = (el?: Element): void => {
    if (!(el instanceof HTMLCanvasElement)) return;
    const ctx = el.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    paint(ctx);
  };
  return html`<canvas width=${Math.round(cssW * dpr)} height=${Math.round(cssH * dpr)} role="img" aria-label=${label} style=${ifDefined(width && `width: ${width};`)} ${ref(drawn)}></canvas>`;
}

/** A figure holding a canvas, its title, an optional caption line and an
 *  optional link (to the player's manual) at the end of the caption. */
export function figure(canvas: TemplateResult, title: string, caption?: string, link?: TemplateResult): TemplateResult {
  const line = caption ? html`<br />${caption}` : nothing;
  const more = link ? html` ${link}` : nothing;
  return html`<figure>${canvas}<figcaption><strong>${title}</strong>${line}${more}</figcaption></figure>`;
}
