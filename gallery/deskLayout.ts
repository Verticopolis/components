/**
 * Where the desk's windows open the first time: `defaultLayout` from
 * `windows/desk/deskGeometry`, drawn to scale for a few screen sizes. The
 * windows of one fixed size (the Map, the Bulletin) take their own size in a
 * game; here they are drawn at the sizes the geometry plans for them before
 * it measures them. Tower Info and the Control Panel open only when asked
 * for, so they are left out.
 */
import { html, svg, type TemplateResult } from "lit-html";
import {
  BULLETIN_HEIGHT,
  INFO_HEIGHT,
  MAP_HEIGHT,
  SIDE_COLUMN,
  defaultLayout,
  type DeskRect,
} from "../lib/ui/desk/deskGeometry.js";

/** The desks drawn, each a screen size less the taskbar's 28 px. */
const DESKS = [
  { label: "1024 × 600, the smallest desk", w: 1024, h: 600 - 28 },
  { label: "1366 × 768", w: 1366, h: 768 - 28 },
  { label: "1920 × 1080", w: 1920, h: 1080 - 28 },
] as const;

/** The windows drawn, in the order they stack. */
const SHOWN = [
  { id: "tower", label: "Tower" },
  { id: "tools", label: "Tools" },
  { id: "info", label: "Info" },
  { id: "map", label: "Map" },
  { id: "bulletin", label: "Bulletin" },
] as const;

/** A window's box: its planned place, with the planned size of a window that
 *  takes its own size. */
function box(id: (typeof SHOWN)[number]["id"], r: DeskRect): DeskRect {
  if (id === "info") return { ...r, h: INFO_HEIGHT };
  if (id === "map") return { ...r, w: SIDE_COLUMN, h: MAP_HEIGHT };
  if (id === "bulletin") return { ...r, w: SIDE_COLUMN, h: BULLETIN_HEIGHT };
  return r;
}

function deskFigure(d: (typeof DESKS)[number]): TemplateResult {
  const layout = defaultLayout(d.w, d.h);
  const text = Math.round(d.w / 48);
  const rects = SHOWN.map(({ id, label }) => {
    const r = box(id, layout[id]);
    return svg`<g class=${`g-layout-${id}`}>
      <rect x=${r.x} y=${r.y} width=${r.w} height=${r.h}></rect>
      <text x=${r.x + text / 2} y=${r.y + text * 1.3}>${label}</text>
      <text class="g-layout-size" x=${r.x + text / 2} y=${r.y + text * 2.4}>${`${r.w} × ${r.h} at ${r.x}, ${r.y}`}</text>
    </g>`;
  });
  return html`<figure class="g-layout">
    <svg viewBox=${`0 0 ${d.w} ${d.h}`} style=${`--g-layout-text: ${text}px`} role="img" aria-label=${`Where the windows open on a ${d.label} desk`}>
      <rect class="g-layout-desk" width=${d.w} height=${d.h}></rect>
      ${rects}
    </svg>
    <figcaption><strong>${d.label}</strong></figcaption>
  </figure>`;
}

/** Every desk size's layout, one figure each. */
export const deskLayouts = (): TemplateResult => html`<div class="g-layouts">${DESKS.map(deskFigure)}</div>`;
