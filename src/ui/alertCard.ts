/**
 * The alert card: a window that holds the whole page until it is answered,
 * as a 1995 program's "This program has stopped" box did. It is a real
 * `<dialog>` opened with `showModal()`, so it wins the top layer over any
 * other open dialog and makes the page behind it inert, and it swallows
 * Escape: its buttons are the only way out. A browser that closes it anyway
 * (one lets a page refuse only so many Escapes in a row) sees it open again
 * at once. A card with no buttons (a wait,
 * such as "Recovering graphics") closes only when its caller closes it.
 *
 * The caller writes every word and owns what each button does; the card
 * draws the title bar, the paragraphs, an optional status line a screen
 * reader hears as it changes, and the button row. `update` draws it again
 * (a new status, a button that is busy), and lit writes only what changed.
 * Nothing here draws on a canvas, so a game whose canvas is gone still
 * shows it.
 *
 * The look is `styles/game/dialogs.css` (`.crash-card`).
 *
 * Cost: nothing runs until a card opens; it draws on open and on `update`.
 */
import { html, nothing, type TemplateResult } from "lit-html";
import { renderDetached, type Detached } from "./detached";
import type { MessageParagraph } from "./messageBox";

/** One button in the card's row. */
export interface AlertCardButton {
  /** Its words: plain text, or a template (a hidden "opens in a new tab"). */
  readonly label: string | TemplateResult;
  /** A stable name for the button (`data-act`), for tests and analytics. */
  readonly act: string;
  /** The default action, drawn heavier. */
  readonly primary?: boolean;
  /** A link instead of a button, opened in a new tab so the card stays. */
  readonly href?: string;
  /** Grayed and deaf, such as while its work runs. */
  readonly disabled?: boolean;
  readonly onPress?: () => void;
}

/** What the card says. */
export interface AlertCardView {
  /** The title bar's words. */
  readonly title: string;
  /** `alert` for a failure the player answers (an `alertdialog`); `wait`
   *  for a card that only says what is happening, its text heard as a
   *  status. */
  readonly kind: "alert" | "wait";
  /** The paragraphs, in order. */
  readonly text: readonly MessageParagraph[];
  /** The status line under the text, such as "Packing crash report…".
   *  Leave it out for a card with none; "" keeps the line, empty. */
  readonly status?: string;
  /** The buttons, in the order they sit. */
  readonly buttons?: readonly AlertCardButton[];
  /** The `act` of the button that takes the focus when the card opens. */
  readonly focus?: string;
}

const keepOpen = (e: Event) => e.preventDefault();

function buttonTemplate(b: AlertCardButton, focus: string | undefined): TemplateResult {
  const cls = b.primary ? "btn primary" : "btn";
  if (b.href !== undefined)
    return html`<a class=${cls} data-act=${b.act} target="_blank" rel="noopener noreferrer" href=${b.href} @click=${b.onPress ?? nothing}>${b.label}</a>`;
  return html`<button type="button" class=${cls} data-act=${b.act} ?disabled=${b.disabled === true} ?autofocus=${focus === b.act} @click=${b.onPress ?? nothing}>${b.label}</button>`;
}

/** The card's elements: the dialog, its title, text, status line and row.
 *  `open` is set only where the page has no `showModal`; `closed` hears the
 *  dialog close. */
export function alertCardTemplate(id: string, view: AlertCardView, open = false, closed?: () => void): TemplateResult {
  const titleId = `${id}-title`;
  const heard = view.kind === "wait" ? "status" : nothing;
  const buttons = view.buttons ?? [];
  const status =
    view.status === undefined ? nothing : html`<p class="crash-status" aria-live="polite">${view.status}</p>`;
  const row = buttons.length
    ? html`<div class="modal-actions">${buttons.map((b) => buttonTemplate(b, view.focus))}</div>`
    : nothing;
  return html`<dialog
    id=${id}
    class="win crash-card"
    role=${view.kind === "alert" ? "alertdialog" : nothing}
    aria-labelledby=${titleId}
    ?open=${open}
    @cancel=${keepOpen}
    @close=${closed ?? nothing}
  ><h2 id=${titleId} class="win-title">${view.title}</h2>${view.text.map((p) => html`<p role=${heard}>${p}</p>`)}${status}${row}</dialog>`;
}

/** An open alert card. */
export class AlertCard {
  private readonly drawn: Detached;
  private view: AlertCardView;
  /** The page has no `showModal`, so the card shows as an open dialog in the
   *  page's flow; the stylesheet keeps it in view. */
  private fallback = false;
  /** `close` is taking the card down, so its dialog's close is meant. */
  private closing = false;
  /** The dialog closed without `close`: a browser that stops honoring a
   *  refused Escape closes it anyway, so put it straight back. */
  private readonly closed = () => {
    if (!this.closing) this.show();
  };
  /** The card's `<dialog>`. */
  readonly dialog: HTMLDialogElement;

  /** Put the card up at the end of `doc.body`, with `id` on its dialog (a
   *  caller asks `doc.getElementById(id)` whether one is up already). */
  constructor(
    doc: Document,
    private readonly id: string,
    view: AlertCardView,
  ) {
    this.view = view;
    this.drawn = renderDetached(doc, alertCardTemplate(id, view, false, this.closed));
    this.dialog = this.drawn.elements[0] as HTMLDialogElement;
    doc.body.append(this.dialog);
    this.show();
  }

  /** Draw the card with a new view (a status, a busy button). */
  update(view: AlertCardView): void {
    this.view = view;
    this.draw();
  }

  /** The button or link with `act`, or null. */
  button(act: string): HTMLElement | null {
    return this.dialog.querySelector<HTMLElement>(`[data-act="${act}"]`);
  }

  /** Take the card down. */
  close(): void {
    this.closing = true;
    if (this.dialog.open) this.dialog.close();
    this.dialog.remove();
  }

  /** Open the dialog as a modal, or as an open dialog in the page's flow
   *  where `showModal` is missing or refuses, and focus the named button. */
  private show(): void {
    try {
      this.dialog.showModal();
    } catch {
      // A page without dialog support. lit writes `open` only when its value
      // changes, so a reopen draws it off and then on.
      this.fallback = false;
      this.draw();
      this.fallback = true;
      this.draw();
    }
    // showModal honors autofocus; this covers the fallback and a reopen too.
    if (this.view.focus !== undefined) this.button(this.view.focus)?.focus();
  }

  private draw(): void {
    this.drawn.update(alertCardTemplate(this.id, this.view, this.fallback, this.closed));
  }
}
