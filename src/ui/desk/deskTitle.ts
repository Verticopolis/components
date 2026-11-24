import { html, nothing, render } from "lit-html";
import { DESK_ICON } from "./deskWindow";
import { DeskTaskbar, type TaskbarOptions } from "./deskTaskbar";
import { ControlPanel, type ControlPanelOptions } from "./deskControlPanel";

/**
 * The title screen on the 1994 desk (owner's pick, 2026-11-15): while a
 * page's title screen is up on a computer, the desk shows its teal and its
 * taskbar, and the title screen sits in one window: its poster on top, its
 * buttons in a gray bar below (`styles/game/desk-title.css`). The title
 * screen itself is unchanged; this adds the window's title bar and the
 * taskbar around it, drawn into a root the page names. The page imports
 * `styles.css`, which carries the desk's look.
 * Given `controlPanel`, the title screen has the desk's Control Panel too,
 * closed until {@link DeskTitle.openControl} (the Start menu's Control
 * Panel… or the tray's monitor) opens it over the window, so the Start menu
 * reads the same over the title screen as over a tower.
 *
 * Cost: drawn once when the title screen comes up on the desk and taken away
 * when it goes. Nothing runs per frame; the tray clock ticks once a minute.
 */

/** The class `<body>` wears while the title screen sits on the desk. */
export const DESK_TITLE_CLASS = "desk-title";
/** The class `<body>` also wears while the title screen sits on the pocket
 *  desk: a phone's or an upright tablet's (`styles/game/desk-title-pocket.css`). */
export const DESK_TITLE_POCKET_CLASS = "desk-title-pocket";
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
  /** The Control Panel's icons and what they run. Without it the title
   *  screen has no Control Panel, and the tray no monitor unless the taskbar
   *  options give one. */
  readonly controlPanel?: ControlPanelOptions;
}

export class DeskTitle {
  private bar: DeskTaskbar | null = null;
  /** The Control Panel, drawn closed, kept while the page lives. */
  private readonly panel: ControlPanel | null;

  constructor(private readonly opts: DeskTitleOptions) {
    this.panel = opts.controlPanel ? new ControlPanel(opts.host.ownerDocument, opts.controlPanel) : null;
  }

  /** The Control Panel, for its labels; null without `controlPanel`. */
  get control(): ControlPanel | null {
    return this.panel;
  }

  /** Open the Control Panel over the title screen; nothing without one or
   *  while the title screen is off the desk. */
  openControl(): void {
    if (this.bar) this.panel?.open();
  }

  /** Whether the title screen sits on the desk now. */
  get up(): boolean {
    return !!this.bar;
  }

  /** The taskbar while the title screen is up, for its sound and its menus. */
  get taskbar(): DeskTaskbar | null {
    return this.bar;
  }

  /** Put the title screen on the desk: the computer's, or the pocket desk's
   *  when `pocket` is set. A second call only switches between the two, as
   *  turning a tablet can. */
  show(pocket = false): void {
    const { host, title, taskbar } = this.opts;
    const doc = host.ownerDocument;
    // Touched only on a change: a page that watches <body>'s class (as the
    // game does, to call this) would otherwise hear a write it caused.
    if (doc.body.classList.contains(DESK_TITLE_POCKET_CLASS) !== pocket)
      doc.body.classList.toggle(DESK_TITLE_POCKET_CLASS, pocket);
    if (this.bar) return;
    const icon = this.opts.icon ?? DESK_ICON;
    const panel = this.panel;
    // The tray's monitor opens the panel, unless the page hears it itself.
    const controlPanel = taskbar.controlPanel ?? (panel ? () => this.openControl() : undefined);
    const bar = new DeskTaskbar(doc, {
      ...taskbar,
      ...(controlPanel ? { controlPanel } : {}),
      icon: taskbar.icon ?? icon,
      className: "desk-taskbar-title",
    });
    doc.body.classList.add(DESK_TITLE_CLASS);
    // The panel comes before the taskbar, so the Start menu opens over it.
    render(
      html`<div class="desk-title-bar" aria-hidden="true"><img src=${icon} alt="" width="16" height="16" /><span>${title}</span></div>${panel?.root ?? nothing}${bar.root}`,
      host,
    );
    bar.start();
    bar.render([{ id: DESK_TITLE_WINDOW, label: title, active: true, minimized: false }]);
    this.bar = bar;
  }

  /** Take the title screen off the desk. */
  hide(): void {
    if (!this.bar) return;
    // Closed, so it opens fresh the next time the title screen comes up.
    this.panel?.close();
    this.bar.stop();
    this.bar = null;
    render(nothing, this.opts.host);
    this.opts.host.ownerDocument.body.classList.remove(DESK_TITLE_CLASS, DESK_TITLE_POCKET_CLASS);
  }
}
