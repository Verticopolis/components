/**
 * The Appearance dialog (`windows/appearance`) opened in the package's modal
 * (`ModalShell`). OK dresses this page in the picked scheme
 * (`windows/schemes`) and keeps the pick under the site's key, as the
 * Options menu does, so the next page opens in it too.
 */
import { html, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import { ModalShell } from "../lib/ui/uiModal.js";
import { openAppearanceDialog } from "../lib/ui/appearance.js";
import { applyScheme, saveScheme, schemeOf } from "../lib/ui/schemes.js";
import { SCHEME_KEY } from "../site/schemeKey.mjs";

/** The button that opens the dialog, and the dialog it opens in. */
export function appearanceDemo(): TemplateResult {
  let shell: ModalShell | null = null;
  const made = (el?: Element) => {
    if (el instanceof HTMLDialogElement && !shell)
      shell = new ModalShell(el, { gameStopped: () => false, toast: () => undefined });
  };
  const open = () => {
    if (!shell) return;
    const root = document.documentElement;
    openAppearanceDialog(shell, schemeOf(root), (id) => {
      applyScheme(id, root);
      saveScheme(SCHEME_KEY, id);
    });
  };
  return html`<div class="g-row">
      <button type="button" class="btn" @click=${open}>Appearance…</button>
    </div>
    <dialog id="modal" ${ref(made)}></dialog>`;
}
