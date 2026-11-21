import { html, nothing, render } from "lit-html";
import { DESK_ICON } from "./deskWindow";
import { DeskTaskbar, type TaskbarOptions } from "./deskTaskbar";

/**
 * The title screen on the 1994 desk (owner's pick, 2026-11-15): while a
 * page's title screen is up on a computer, the desk shows its teal and its
 * taskbar, and the title screen sits in one window: its poster on top, its
 * buttons in a gray bar below (`styles/game/desk-title.css`). The title
 * screen itself is unchanged; this adds the window's title bar and the
 * taskbar around it, drawn into a root the page names. The page imports
 * `styles.css`, which carries the desk's look.
 *
 * Cost: drawn once when the title screen comes up on the desk and taken away
 * when it goes. Nothing runs per frame; the tray clock ticks once a minute.
 */

/** The class `<body>` wears while the title screen sits on the desk. */
export const DESK_TITLE_CLASS = "desk-title";
/** The id of the title screen's one window, on its taskbar. */
export const DESK_TITLE_WINDOW = "title";

export interface DeskTitleOptions {
  /** Where the title bar and the taskbar go; the page's root, so an inert
   *  cover over it covers them too. Nothing else may `render` into it. */
  readonly host: HTMLElement;
  /** The window's name, on its title bar and its taskbar button. */
  readonly title: string;
  /** The title bar's icon; {@link DESK_ICON} when absent. */
  readonly icon?: string;
  /** The taskbar's Start menu, tray and presses. A press on the window's
   *  taskbar button is `task(DESK_TITLE_WINDOW)`. */
  readonly taskbar: Omit<TaskbarOptions, "className">;
}

export class DeskTitle {
  private bar: DeskTaskbar | null = null;

  constructor(private readonly opts: DeskTitleOptions) {}

  /** Whether the title screen sits on the desk now. */
  get up(): boolean {
    return !!this.bar;
  }

  /** The taskbar while the title screen is up, for its sound and its menus. */
  get taskbar(): DeskTaskbar | null {
    return this.bar;
  }

  /** Put the title screen on the desk. A second call does nothing. */
  show(): void {
    if (this.bar) return;
    const { host, title, taskbar } = this.opts;
    const doc = host.ownerDocument;
    const icon = this.opts.icon ?? DESK_ICON;
    const bar = new DeskTaskbar(doc, { ...taskbar, icon: taskbar.icon ?? icon, className: "desk-taskbar-title" });
    doc.body.classList.add(DESK_TITLE_CLASS);
    render(
      html`<div class="desk-title-bar" aria-hidden="true"><img src=${icon} alt="" width="16" height="16" /><span>${title}</span></div>${bar.root}`,
      host,
    );
    bar.start();
    bar.render([{ id: DESK_TITLE_WINDOW, label: title, active: true, minimized: false }]);
    this.bar = bar;
  }

  /** Take the title screen off the desk. */
  hide(): void {
    if (!this.bar) return;
    this.bar.stop();
    this.bar = null;
    render(nothing, this.opts.host);
    this.opts.host.ownerDocument.body.classList.remove(DESK_TITLE_CLASS);
  }
}
