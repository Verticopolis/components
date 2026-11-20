import { svg, type SVGTemplateResult } from "lit-html";

/**
 * The small file icons of the Open and Save As windows: a yellow folder for
 * the home folder and a page for each kind of file, drawn on a 16-pixel grid
 * in the style of a 1990s file list. A kind of file shows its mark on the
 * page: the marks here are a tower, a 1994 tower and the Auto-save's clock,
 * and a game may draw its own on the same grid. They are original to this
 * project (MIT), drawn from rectangles with fixed colors, since an icon in a
 * file list is a picture.
 */

const INK = "#000";
const PAPER = "#fff";
const SHADE = "#808080";

/** A page with its corner folded, the outline every file icon shares. */
const page = svg`
  <path d="M3.5 1.5h6l3 3v10h-9z" fill=${PAPER} stroke=${INK} />
  <path d="M9.5 1.5v3h3" fill=${SHADE} stroke=${INK} />`;

/** A tower: a navy block with lit windows. */
export const towerMark: SVGTemplateResult = svg`
    <rect x="6" y="6" width="4" height="8" fill="#000080" />
    <rect x="7" y="7" width="1" height="1" fill="#ffd400" /><rect x="8" y="9" width="1" height="1" fill="#ffd400" />
    <rect x="7" y="11" width="1" height="1" fill="#ffd400" />`;

/** A 1994 tower: the same block in the old game's teal, on a gray lot. */
export const oldTowerMark: SVGTemplateResult = svg`
    <rect x="5" y="12" width="6" height="2" fill=${SHADE} />
    <rect x="6" y="6" width="4" height="6" fill="#008080" />
    <rect x="7" y="7" width="2" height="1" fill=${PAPER} /><rect x="7" y="9" width="2" height="1" fill=${PAPER} />`;

/** The Auto-save: a green clock face. */
export const clockMark: SVGTemplateResult = svg`
    <rect x="5" y="7" width="6" height="6" fill="#008000" />
    <rect x="7" y="8" width="1" height="3" fill=${PAPER} /><rect x="8" y="10" width="2" height="1" fill=${PAPER} />`;

/** A file's page with `mark` drawn on it (a 16-pixel grid). */
export function fileIcon(mark: SVGTemplateResult): SVGTemplateResult {
  return svg`<svg class="fd-icon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" shape-rendering="crispEdges">${page}${mark}</svg>`;
}

/** The home folder: yellow, with its tab. */
export function folderIcon(): SVGTemplateResult {
  return svg`<svg class="fd-icon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" shape-rendering="crispEdges">
    <path d="M1.5 3.5h5l1 2h7v8h-13z" fill="#ffd400" stroke=${INK} />
    <path d="M2 6h12" stroke="#fff4a0" />
  </svg>`;
}

/** The warning sign of a message box that asks before a step that can't be
 *  taken back: a yellow triangle with a black "!", on a 32-pixel grid. */
export function warningIcon(): SVGTemplateResult {
  return svg`<svg class="fd-ask-icon" viewBox="0 0 32 32" width="32" height="32" aria-hidden="true" shape-rendering="crispEdges">
    <path d="M16 2.5 30.5 29.5h-29z" fill="#ffd400" stroke=${INK} stroke-linejoin="miter" />
    <path d="M3.5 28.5h26" stroke=${SHADE} />
    <rect x="14" y="10" width="4" height="11" fill=${INK} />
    <rect x="14" y="23" width="4" height="4" fill=${INK} />
  </svg>`;
}

/** A folder on the player's own computer, linked to the windows: the yellow
 *  folder with a small gray drive at its corner. */
export function linkedFolderIcon(): SVGTemplateResult {
  return svg`<svg class="fd-icon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" shape-rendering="crispEdges">
    <path d="M1.5 3.5h5l1 2h7v8h-13z" fill="#ffd400" stroke=${INK} />
    <path d="M2 6h12" stroke="#fff4a0" />
    <rect x="8.5" y="9.5" width="7" height="5" fill="#c0c0c0" stroke=${INK} />
    <rect x="10" y="12" width="2" height="1" fill="#008000" />
  </svg>`;
}

/** Link a folder: an open white folder with a navy plus. */
export function linkFolderIcon(): SVGTemplateResult {
  return svg`<svg class="fd-icon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" shape-rendering="crispEdges">
    <path d="M1.5 3.5h5l1 2h7v8h-13z" fill=${PAPER} stroke=${INK} />
    <path d="M10 8v5M7.5 10.5h5" stroke="#000080" stroke-width="2" />
  </svg>`;
}
