/**
 * Message boxes: the package's one modal dialog (`ModalShell` from
 * `windows/uiModal`) opening sample views. The box blocks the page under its
 * backdrop until it is answered, as a 1995 message box did; Esc, the ✕ and a
 * press on the backdrop close it. The dialog's look is
 * `styles/game/dialogs.css`, keyed on the dialog's `#modal` id.
 */
import { html, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import { ModalShell, type ModalView } from "../lib/ui/uiModal.js";

/** The sample boxes, each opened by its own button. */
interface Sample {
  readonly button: string;
  readonly view: (close: () => void) => ModalView;
  /** A notice to put under the title once the box is open. */
  readonly notice?: string;
}

const actions = (...buttons: TemplateResult[]) => html`<div class="modal-actions modal-footer">${buttons}</div>`;

const SAMPLES: readonly Sample[] = [
  {
    button: "A message…",
    view: (close) => ({
      title: "About Verticopolis components",
      body: html`<p>The windows, menus, sprites and sounds of Verticopolis, in one package.</p>
        ${actions(html`<button type="button" class="btn primary" @click=${close}>OK</button>`)}`,
    }),
  },
  {
    button: "A question…",
    view: (close) => ({
      title: "Sample Tower",
      body: html`<p>Save the changes to Sample Tower before closing it?</p>
        ${actions(
          html`<button type="button" class="btn primary" @click=${close}>Save</button>`,
          html`<button type="button" class="btn" @click=${close}>Don't Save</button>`,
          html`<button type="button" class="btn" @click=${close}>Cancel</button>`,
        )}`,
    }),
  },
  {
    button: "A notice…",
    view: (close) => ({
      title: "Open",
      body: html`<p>Pick a tower file to open.</p>
        ${actions(html`<button type="button" class="btn" @click=${close}>Close</button>`)}`,
    }),
    notice: "That file is not a tower. Pick another one.",
  },
];

/** The buttons that open each sample, and the dialog they open in. */
export function messageBoxes(): TemplateResult {
  let shell: ModalShell | null = null;
  const made = (el?: Element) => {
    if (el instanceof HTMLDialogElement && !shell)
      shell = new ModalShell(el, { gameStopped: () => false, toast: () => undefined });
  };
  const open = (s: Sample) => {
    if (!shell) return;
    const box = shell;
    box.open(s.view(() => box.close()));
    if (s.notice) box.say(s.notice);
  };
  return html`<div class="g-row">
      ${SAMPLES.map((s) => html`<button type="button" class="btn" @click=${() => open(s)}>${s.button}</button>`)}
    </div>
    <dialog id="modal" ${ref(made)}></dialog>`;
}
