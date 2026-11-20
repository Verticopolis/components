/**
 * The message box: a title bar, a line or two of text and a row of buttons,
 * as a 1995 program asked a question or said something had happened (OK;
 * OK and Cancel; Yes, No and Cancel). It is a view for the shared modal
 * (`ModalShell` from `windows/uiModal`), which draws the window around it and
 * closes it on the ✕, Escape and a press beside the box.
 *
 * A button's press runs its `onPress`; the caller decides whether that
 * closes the box. The ✕, Escape and the backdrop are the shell's, so a
 * caller that must hear them (a question whose silence means "no") watches
 * the dialog as it does for any other modal.
 *
 * The look is `styles/game/dialogs.css` (`.modal-actions`, `.modal-footer`):
 * the buttons sit in the footer strip, right-aligned, primary first where the
 * caller lists it first.
 *
 * Cost: nothing runs until a box opens; it is drawn once.
 */
import { html, nothing, type TemplateResult } from "lit-html";
import { iconTemplate, type IconName } from "./icons";
import type { ModalView } from "./uiModal";

/** One paragraph of a box's text. A string is plain text (lit escapes it); a
 *  template can carry icons (`messageWithIcons`) or bold words. */
export type MessageParagraph = string | TemplateResult;

/** One button in the row. */
export interface MessageButton {
  readonly label: string;
  /** The default action, drawn heavier. One per box at most. */
  readonly primary?: boolean;
  readonly onPress: () => void;
  /** A stable name for the button (`data-act`), for tests and analytics. */
  readonly act?: string;
  /** Takes the focus when the box opens. */
  readonly autofocus?: boolean;
}

/** What a message box says. */
export interface MessageBox {
  /** The title bar's words. */
  readonly title: string;
  /** An icon before the title (`windows/icons`). */
  readonly icon?: IconName;
  /** The icon's size in CSS pixels; 16 unless given. */
  readonly iconSize?: number;
  /** The text: one paragraph or several. */
  readonly text: MessageParagraph | readonly MessageParagraph[];
  /** The buttons, in the order they sit. */
  readonly buttons: readonly MessageButton[];
}

/** The row of buttons, as the footer strip every dialog pins to its foot. */
export function messageActionsTemplate(buttons: readonly MessageButton[]): TemplateResult {
  return html`<div class="modal-actions modal-footer">
    ${buttons.map((b) => {
      const cls = b.primary ? "btn primary" : "btn";
      const act = b.act ?? nothing;
      const focus = b.autofocus === true;
      return html`<button type="button" class=${cls} data-act=${act} ?autofocus=${focus} @click=${b.onPress}>${b.label}</button>`;
    })}
  </div>`;
}

/** The box's body: its paragraphs, then the button row. */
export function messageBoxTemplate(box: MessageBox): TemplateResult {
  const paragraphs = (Array.isArray(box.text) ? box.text : [box.text]) as readonly MessageParagraph[];
  return html`${paragraphs.map((p) => html`<p>${p}</p>`)}${messageActionsTemplate(box.buttons)}`;
}

/** The box as a view for `ModalShell.open`: the title (with its icon) and
 *  {@link messageBoxTemplate}. */
export function messageBoxView(box: MessageBox): ModalView {
  const title = box.icon ? html`${iconTemplate(box.icon, { size: box.iconSize ?? 16 })}${box.title}` : box.title;
  return { title, body: messageBoxTemplate(box) };
}
