/**
 * Fireworks: a sample welcome box (`messageBoxView` in the package's one
 * modal dialog) with the pixel fireworks (`playFireworks` from
 * `windows/fireworks`) going off behind it, under the box and over the dimmed
 * backdrop. Closing the box ends the show. With reduced motion on, one still
 * frame shows. The look is `styles/game/launch-fireworks.css`.
 */
import { html, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import { ModalShell } from "../lib/ui/uiModal.js";
import { messageBoxView } from "../lib/ui/messageBox.js";
import { playFireworks, type Fireworks } from "../lib/ui/fireworks.js";

/** The button that opens the welcome, and the dialog it opens in. */
export function fireworksDemo(): TemplateResult {
  let shell: ModalShell | null = null;
  let show: Fireworks | null = null;
  const made = (el?: Element) => {
    if (el instanceof HTMLDialogElement && !shell)
      shell = new ModalShell(el, { gameStopped: () => false, toast: () => undefined });
  };
  const ended = () => {
    show?.stop();
    show = null;
  };
  const open = () => {
    const box = shell;
    if (!box) return;
    box.open(
      messageBoxView({
        title: "Welcome to the gallery",
        text: ["Every window, menu, sound and room of the game, drawn from the package.", "Have a look around."],
        buttons: [{ label: "OK", primary: true, autofocus: true, onPress: () => box.close() }],
      }),
    );
    show?.stop();
    show = playFireworks(document, box.dialog, {
      reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      width: window.innerWidth,
      height: window.innerHeight,
    });
  };
  return html`<div class="g-row">
      <button type="button" class="btn" @click=${open}>Celebrate…</button>
    </div>
    <dialog id="modal" ${ref(made)} @close=${ended}></dialog>`;
}
