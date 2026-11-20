import { html, nothing, type TemplateResult } from "lit-html";
import { messageWithIcons } from "../icons";

/**
 * The game's Win95 status bar, along the foot of the tower window: a hint
 * about the tool under the pointer in the Tools window (shown only while there
 * is one, in place of the next box), the picked tool's card, the tower's name
 * and rules, and the newest bulletin line. The game owns the bar's element,
 * `<footer id="statusbar" class="statusbar">`, and renders
 * {@link statusBarTemplate} into it. The look is `styles/game/menubar.css`.
 *
 * The ids stay as the game's stylesheets name them: `#sb-hint`, `#tool-info`,
 * `#sb-tower` and `#sb-news`.
 *
 * The bulletin line is not spoken from here: the box is hidden on a phone and
 * when the player turns the bar off, so the game keeps its own live region
 * outside the bar.
 *
 * Cost: the game renders the bar on each status pass, several times a second,
 * and lit writes only the boxes whose value changed.
 */

/** What the four boxes show. */
export interface StatusBarView {
  /** The hint for the tool under the pointer, or "" for none. */
  readonly hint: string;
  /** The picked tool's card: any value lit can draw, such as a template. */
  readonly tool: unknown;
  /** The tower's name and rules, such as "Harmony Tower · Classic". */
  readonly tower: string;
  /** The newest bulletin line. A known leading emoji draws as its pixel icon. */
  readonly news: string;
}

/** The four boxes, for the game to render into its `<footer id="statusbar">`. */
export function statusBarTemplate(view: StatusBarView): TemplateResult {
  // No space around a value: a box with nothing in it must match the
  // stylesheet's `.sb-cell:empty`, which hides it.
  return html`<div id="sb-hint" class="sb-cell sb-grow" aria-hidden="true" ?hidden=${!view.hint}>${view.hint || nothing}</div>
    <div id="tool-info" class="sb-cell sb-grow">${view.tool}</div>
    <div id="sb-tower" class="sb-cell">${view.tower || nothing}</div>
    <div id="sb-news" class="sb-cell sb-news" aria-hidden="true" title=${view.news || nothing}>${view.news ? messageWithIcons(view.news) : nothing}</div>`;
}
