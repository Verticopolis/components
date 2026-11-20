import { html, type TemplateResult } from "lit-html";
import { renderDetached } from "../detached";
import { buildFrame, DESK_ICON, type DeskFrame, type FrameClose } from "./deskWindow";

/**
 * The Help window on the desk: the Player's Manual in a frame of its own,
 * under a row of buttons the way 1995's Help windows had them (Contents,
 * Back, Forward), plus Open in Browser. The game decides what the buttons do
 * and which page the frame shows; this draws the window and keeps the
 * buttons' state.
 *
 * Cost: nothing runs per frame; the buttons redraw when the page changes.
 */

/** The Help window's element id. */
export const HELP_WINDOW_ID = "desk-win-help";

/** What the Help window's buttons do. */
export interface HelpWindowActions {
  readonly contents: () => void;
  readonly back: () => void;
  readonly forward: () => void;
  readonly openInBrowser: () => void;
  readonly close: FrameClose;
}

/** Which of Back and Forward can go anywhere. */
export interface HelpNav {
  readonly back: boolean;
  readonly forward: boolean;
}

/** A drawn Help window. */
export interface HelpWindow extends DeskFrame {
  /** The frame the manual's pages load in. */
  readonly page: HTMLIFrameElement;
  /** Turn Back and Forward on or off. */
  setNav(nav: HelpNav): void;
}

const barTemplate = (a: HelpWindowActions, nav: HelpNav): TemplateResult =>
  html`<div class="desk-help-bar" role="group" aria-label="Help"><button type="button" class="btn" @click=${a.contents}>Contents</button><button type="button" class="btn" ?disabled=${!nav.back} @click=${a.back}>Back</button><button type="button" class="btn" ?disabled=${!nav.forward} @click=${a.forward}>Forward</button><button type="button" class="btn" @click=${a.openInBrowser}>Open in Browser</button></div>`;

/** Draw the Help window titled `title`, its frame empty until the game sets
 *  its page. `icon` is the title bar's icon. */
export function buildHelpWindow(
  doc: Document,
  title: string,
  actions: HelpWindowActions,
  icon = DESK_ICON,
): HelpWindow {
  const frame = buildFrame(doc, HELP_WINDOW_ID, title, actions.close, icon);
  const bar = renderDetached(doc, barTemplate(actions, { back: false, forward: false }));
  frame.body.append(...bar.elements);
  const page = renderDetached(
    doc,
    html`<iframe class="desk-help-page" title="Player's Manual" referrerpolicy="strict-origin-when-cross-origin"></iframe>`,
  ).elements[0] as HTMLIFrameElement;
  frame.body.append(page);
  return {
    ...frame,
    page,
    setNav: (nav) => bar.update(barTemplate(actions, nav)),
  };
}
