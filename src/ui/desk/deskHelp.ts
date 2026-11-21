import { html, type TemplateResult } from "lit-html";
import { renderDetached } from "../detached";
import { MenuBar, type MenuBarModel } from "../menuBar";
import { buildFrame, DESK_ICON, type DeskFrame, type FrameClose } from "./deskWindow";

/**
 * The Help window on the desk: the Player's Manual in a frame of its own,
 * laid out the way 1995's Help windows were: a menu bar under the title bar
 * (File, Edit, Options, Help), a row of buttons under it (Contents, Back,
 * Forward, plus Open in Browser), then the page. The game decides what the
 * menus and buttons do and which page the frame shows; this draws the window
 * and keeps the buttons' state.
 *
 * Cost: nothing runs per frame; the buttons redraw when the page changes, and
 * the menus when the game asks (a menu opening, say).
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

/** The Help window's menu bar: what it shows, and what runs as a menu opens
 *  (the game re-renders its check marks there). */
export interface HelpWindowMenu {
  readonly model: MenuBarModel;
  readonly onOpen?: (menu: HTMLElement) => void;
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
  /** The window's menu bar; `render` it with a fresh model to change it. */
  readonly menus: MenuBar;
  /** Turn Back and Forward on or off. */
  setNav(nav: HelpNav): void;
  /** Take the menu bar's listeners off the page, once the window is gone. */
  dispose(): void;
}

const barTemplate = (a: HelpWindowActions, nav: HelpNav): TemplateResult =>
  html`<div class="desk-help-bar" role="group" aria-label="Help"><button type="button" class="btn" @click=${a.contents}>Contents</button><button type="button" class="btn" ?disabled=${!nav.back} @click=${a.back}>Back</button><button type="button" class="btn" ?disabled=${!nav.forward} @click=${a.forward}>Forward</button><button type="button" class="btn" @click=${a.openInBrowser}>Open in Browser</button></div>`;

/** Draw the Help window titled `title` with `menu` under its title bar, its
 *  frame empty until the game sets its page. `icon` is the title bar's icon.
 *  The menu bar leaves Alt and the menus' letters to the game's own bar. */
export function buildHelpWindow(
  doc: Document,
  title: string,
  actions: HelpWindowActions,
  menu: HelpWindowMenu,
  icon = DESK_ICON,
): HelpWindow {
  const frame = buildFrame(doc, HELP_WINDOW_ID, title, actions.close, icon);
  const menuHost = renderDetached(doc, html`<div class="desk-help-menu"></div>`).elements[0] as HTMLElement;
  frame.body.append(menuHost);
  const menus = new MenuBar(menuHost, menu.model, { altKeys: false, onOpen: menu.onOpen });
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
    menus,
    setNav: (nav) => bar.update(barTemplate(actions, nav)),
    dispose: () => menus.dispose(),
  };
}
