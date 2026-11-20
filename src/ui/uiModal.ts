/**
 * The shared modal: one `<dialog>` the whole app opens its message boxes in,
 * drawn with lit. A caller hands it a view (the title bar's text and the
 * body) and the shell draws the window grammar around it: the title bar, the
 * ✕, a notice line under the title, and the dismissal handlers. Who may take
 * the dialog, and what happens to whoever waits for it, is
 * `modalPrecedence.ts`.
 *
 * Cost: nothing runs per frame. A dialog renders on open, again when its
 * caller redraws it or a notice lands, and clears on close.
 */
import { html, nothing, render, type TemplateResult } from "lit-html";
import { keyed } from "lit-html/directives/keyed.js";
import "../styles/window.css"; // the window frame and title bar (with its ✕ button) a modal wears
import { ModalPrecedence, type ModalOpts, type NoticeKind } from "./modalPrecedence";

/** Id of the span around the modal's title TEXT, which the dialog's
 *  `aria-labelledby` points at. It wraps the text alone, never the h2: the h2
 *  also holds the ✕, and labeling the h2 would fold the ✕'s accessible name
 *  ("Close") into the dialog's. Only one modal is ever live, so this constant
 *  never collides with itself. */
export const MODAL_TITLE_ID = "verticopolis-modal-title";

/** What a dialog shows. */
export interface ModalView {
  /** The title bar's text: a string, or a template (an icon and words). */
  readonly title: string | TemplateResult;
  /** Everything under the title bar. */
  readonly body: TemplateResult;
}

/** What the shell needs from the page around it. */
export interface ModalShellDeps {
  /** A game-failure message is up, so no modal may open over it: the top
   *  layer would cover the message's Reload button. */
  gameStopped(): boolean;
  /** Say `text` where no dialog is open. */
  toast(text: string, kind: NoticeKind): void;
}

/** A notice line; `serial` makes each new ask a new element, so a screen
 *  reader announces it again. */
interface Notice {
  readonly text: string;
  readonly kind: NoticeKind;
  readonly serial: number;
}

/** A notice under the title bar. A failure is drawn in danger ink with
 *  `role="alert"`, so it interrupts; plain and good news use ordinary ink and
 *  `role="status"`, so a late "it finished after all" is neither shown nor
 *  announced as an error (#785). */
export function noticeTemplate(text: string, kind: NoticeKind): TemplateResult {
  const bad = kind === "bad";
  return html`<p class=${bad ? "modal-notice" : "modal-notice modal-notice-calm"} role=${bad ? "alert" : "status"}>${text}</p>`;
}

/** The window grammar around a view: the box, the title bar with its title
 *  span and (once `closeShown`) the ✕, the notice, then the body. */
function modalTemplate(view: ModalView, notice: Notice | null, closeShown: boolean, onClose: () => void) {
  const close = closeShown
    ? html`<button type="button" class="modal-x btn xs" aria-label="Close" @click=${onClose}>✕</button>`
    : nothing;
  const line = notice ? keyed(notice.serial, noticeTemplate(notice.text, notice.kind)) : nothing;
  return html`<div class="modal-box win win-closable"><h2 class="win-title"><span id=${MODAL_TITLE_ID}>${view.title}</span>${close}</h2>${line}${view.body}</div>`;
}

export class ModalShell {
  /** Who may take the dialog, and who waits for it. */
  readonly precedence = new ModalPrecedence();
  /** What the open dialog shows; null while none is built. */
  private view: ModalView | null = null;
  private notice: Notice | null = null;
  private serial = 0;
  private closeShown = false;

  constructor(
    readonly dialog: HTMLDialogElement,
    private readonly deps: ModalShellDeps,
  ) {}

  /** Open `view` in the dialog, replacing whatever it showed, and return its
   *  box. Every open draws fresh elements, so nothing a player typed into the
   *  last dialog carries over. The ✕ is drawn after `showModal`, so the focus
   *  lands on the dialog's own first control rather than on the ✕. The ✕
   *  goes through the dialog's cancel path (as Esc does), so a caller that
   *  sets its own `oncancel` after opening still hears it. A backdrop click
   *  and Esc close the dialog. */
  open(view: ModalView, opts: ModalOpts = {}): HTMLElement {
    const dialog = this.dialog;
    const displacing = dialog.open;
    this.view = null;
    this.notice = null;
    this.closeShown = false;
    render(nothing, dialog);
    // After the clear, before the draw: a notice raised by a displaced
    // dialog's goodbye lands in this one.
    this.precedence.opening(displacing, opts);
    const held = this.precedence.takeNotice();
    if (held) this.notice = { ...held, serial: ++this.serial };
    this.view = view;
    this.draw();
    dialog.setAttribute("aria-labelledby", MODAL_TITLE_ID);
    if (!dialog.open && !this.deps.gameStopped()) dialog.showModal();
    this.closeShown = true;
    this.draw();
    dialog.onclick = (e) => {
      if (e.target === dialog) this.close();
    };
    dialog.oncancel = () => this.close();
    return dialog.querySelector<HTMLElement>(":scope > .modal-box")!;
  }

  /** Redraw the open dialog with `view`; lit touches only what changed. */
  render(view: ModalView): void {
    if (!this.view) return;
    this.view = view;
    this.draw();
  }

  /** Close the dialog and clear it. Safe to call with nothing open. */
  close(): void {
    const dialog = this.dialog;
    const wasOpen = dialog.open;
    if (wasOpen) dialog.close();
    this.view = null;
    this.notice = null;
    render(nothing, dialog);
    // Before the leash fires: a waiting report re-opens from inside
    // `closed()` and sets its own label on the way in.
    dialog.removeAttribute("aria-labelledby");
    this.precedence.closed(wasOpen);
  }

  /** Say `text` where the player can read it now: under the open dialog's
   *  title, held for the next dialog while one is mid-replace, or as a toast
   *  when none is open. A caller that asks every frame passes `again` false:
   *  it never rebuilds a line already shown (which would announce it anew),
   *  never replaces another one (a failure the player has yet to read), and
   *  is never held, since the next dialog could be the one it waited for. */
  say(text: string, again = true, kind: NoticeKind = "bad"): void {
    if (!this.dialog.open) {
      this.deps.toast(text, kind);
      return;
    }
    if (!this.view) {
      if (again) this.precedence.deferNotice(text, kind);
      return;
    }
    if (!again && this.notice) return;
    this.notice = { text, kind, serial: ++this.serial };
    this.draw();
  }

  private draw(): void {
    if (this.view) render(modalTemplate(this.view, this.notice, this.closeShown, this.cancel), this.dialog);
  }

  private readonly cancel = (): void => {
    this.dialog.dispatchEvent(new Event("cancel", { cancelable: true }));
  };
}
