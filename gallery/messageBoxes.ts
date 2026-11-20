/**
 * Message boxes: sample boxes (`messageBoxView` from `windows/messageBox`)
 * opened in the package's one modal dialog (`ModalShell` from
 * `windows/uiModal`). The box blocks the page under its
 * backdrop until it is answered, as a 1995 message box did; Esc, the ✕ and a
 * press on the backdrop close it. The dialog's look is
 * `styles/game/dialogs.css`, keyed on the dialog's `#modal` id.
 */
import { html, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import { ModalShell, type ModalView } from "../lib/ui/uiModal.js";
import { messageBoxView } from "../lib/ui/messageBox.js";

/** The sample boxes, each opened by its own button. */
interface Sample {
  readonly button: string;
  readonly view: (close: () => void) => ModalView;
  /** A notice to put under the title once the box is open. */
  readonly notice?: string;
}

const SAMPLES: readonly Sample[] = [
  {
    button: "A message…",
    view: (close) =>
      messageBoxView({
        title: "About Verticopolis components",
        text: "The windows, menus, sprites and sounds of Verticopolis, in one package.",
        buttons: [{ label: "OK", primary: true, onPress: close }],
      }),
  },
  {
    button: "A question…",
    view: (close) =>
      messageBoxView({
        title: "Sample Tower",
        text: "Save the changes to Sample Tower before closing it?",
        buttons: [
          { label: "Save", primary: true, onPress: close },
          { label: "Don't Save", onPress: close },
          { label: "Cancel", onPress: close },
        ],
      }),
  },
  {
    button: "A warning…",
    view: (close) =>
      messageBoxView({
        title: "Sample Tower",
        icon: "warning",
        text: ["Sample Tower could not be saved.", "This browser's storage is full."],
        buttons: [{ label: "OK", primary: true, onPress: close }],
      }),
  },
  {
    button: "A notice…",
    view: (close) =>
      messageBoxView({
        title: "Open",
        text: "Pick a tower file to open.",
        buttons: [{ label: "Close", onPress: close }],
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
