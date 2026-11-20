import { html, render, svg, type SVGTemplateResult, type TemplateResult } from "lit-html";
import { DESK_ICON, buildFrame } from "./deskWindow";

/**
 * The desk's Control Panel: a window of large icons, each for a setting a
 * 1995 player looked for there, with an object count along its foot. The
 * game names each icon and decides what it opens; the package draws the
 * window and the icons' art. The look is `styles/game/desk.css`.
 *
 * Cost: drawn once; a label change redraws only that label's text.
 */

/** The icons the package draws, each in 32 pixels as the 1995 Control
 *  Panel's were. */
export type ControlIcon = "display" | "appearance" | "sounds" | "settings";

/** The window's id, which `desk.css` sizes. */
export const CONTROL_PANEL_ID = "desk-win-control";

const ART: Record<ControlIcon, SVGTemplateResult> = {
  display: svg`<rect x="4" y="4" width="24" height="18" fill="#c0c0c0" stroke="#000"/><rect x="7" y="7" width="18" height="12" fill="#008080"/><rect x="12" y="22" width="8" height="3" fill="#808080"/><rect x="8" y="25" width="16" height="3" fill="#c0c0c0" stroke="#000"/>`,
  appearance: svg`<rect x="3" y="5" width="22" height="17" fill="#c0c0c0" stroke="#000"/><rect x="4" y="6" width="20" height="4" fill="#000080"/><rect x="9" y="11" width="20" height="16" fill="#ebe7dc" stroke="#000"/><rect x="10" y="12" width="18" height="4" fill="#5c66c9"/><rect x="23" y="13" width="3" height="2" fill="#c65a63"/>`,
  sounds: svg`<path d="M5 12h6l7-6v20l-7-6H5z" fill="#c0c0c0" stroke="#000"/><path d="M21 11q3 5 0 10M24 8q5 8 0 16" fill="none" stroke="#000080" stroke-width="2"/>`,
  settings: svg`<circle cx="16" cy="16" r="9" fill="#c0c0c0" stroke="#000"/><circle cx="16" cy="16" r="3" fill="#fff" stroke="#000"/><path d="M16 3v5M16 24v5M3 16h5M24 16h5M7 7l3 3M22 22l3 3M25 7l-3 3M10 22l-3 3" stroke="#000" stroke-width="2"/>`,
};

/** One icon: which art it wears, the name under it and its tooltip. */
export interface ControlItem {
  readonly icon: ControlIcon;
  readonly label: string;
  readonly hint: string;
}

export interface ControlPanelOptions {
  /** The icons, in the order they sit. */
  readonly items: readonly ControlItem[];
  /** The ✕'s accessible name, such as "Close Control Panel". */
  readonly closeLabel: string;
  /** Hears each icon's press. */
  readonly picked: (icon: ControlIcon) => void;
  /** Hears the ✕, after the window hides. */
  readonly closed?: () => void;
  /** The window's title; "Control Panel" unless given. */
  readonly title?: string;
  /** The title bar's icon; the desk's own (`DESK_ICON`) unless given. */
  readonly icon?: string;
}

/** The icon grid and the object count, with each icon's current label. */
function bodyTemplate(
  items: readonly ControlItem[],
  labels: ReadonlyMap<ControlIcon, string>,
  picked: (icon: ControlIcon) => void,
  title: string,
): TemplateResult {
  return html`<div class="desk-control-icons" role="group" aria-label=${title}>
      ${items.map(
        (item) =>
          html`<button
            type="button"
            class="desk-control-icon"
            data-control=${item.icon}
            title=${item.hint}
            @click=${() => picked(item.icon)}
          >
            <svg width="32" height="32" viewBox="0 0 32 32" shape-rendering="crispEdges" aria-hidden="true">
              ${ART[item.icon]}</svg
            ><span>${labels.get(item.icon) ?? item.label}</span>
          </button>`,
      )}
    </div>
    <div class="desk-control-status">${items.length} object(s)</div>`;
}

/** The Control Panel's window, drawn closed. A page places `root` on its desk
 *  (a `DeskWindow` can take it over). */
export class ControlPanel {
  readonly root: HTMLElement;
  private readonly labels = new Map<ControlIcon, string>();
  private readonly draw: () => void;

  constructor(doc: Document, options: ControlPanelOptions) {
    const title = options.title ?? "Control Panel";
    const close = {
      label: options.closeLabel,
      onClick: () => {
        this.close();
        options.closed?.();
      },
    };
    const frame = buildFrame(doc, CONTROL_PANEL_ID, title, close, options.icon ?? DESK_ICON);
    this.root = frame.root;
    this.root.classList.add("desk-control");
    this.root.hidden = true;
    this.draw = () => render(bodyTemplate(options.items, this.labels, options.picked, title), frame.body);
    this.draw();
  }

  isOpen(): boolean {
    return !this.root.hidden;
  }

  open(): void {
    this.root.hidden = false;
  }

  close(): void {
    this.root.hidden = true;
  }

  /** Show `label` under an icon in place of its own, such as "Sounds: Off".
   *  The same label again draws nothing. */
  setLabel(icon: ControlIcon, label: string): void {
    if (this.labels.get(icon) === label) return;
    this.labels.set(icon, label);
    this.draw();
  }
}
