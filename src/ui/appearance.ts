/**
 * The Appearance dialog: three small window pictures, one per scheme, pick
 * the look. OK hands the pick to the caller, which dresses the page in it
 * and keeps it; Cancel, the ✕, Escape and a press beside the box leave the
 * look as it was. Nothing changes until OK, so no way out needs an undo.
 *
 * The pictures are plain markup that `styles/game/appearance.css` paints in
 * each scheme's own colors (`.appearance-sample[data-sample=…]`), so every
 * picture shows its scheme whatever scheme the page wears.
 *
 * Cost: nothing runs until the dialog opens. A pick only remembers the
 * scheme; the dialog is drawn once.
 */
import { html, type TemplateResult } from "lit-html";
import "../styles/game/appearance.css"; // the row of scheme pictures
import { SCHEMES, SCHEME_NAMES, type SchemeId } from "./schemes";
import type { ModalShell, ModalView } from "./uiModal";

/** What the dialog's controls do. */
export interface AppearanceHandlers {
  onPick(id: SchemeId): void;
  onOk(): void;
  onCancel(): void;
}

/** The dialog's body: the scheme pictures as a radio group with `picked`
 *  checked, a line on what a scheme changes, and OK and Cancel. `note`
 *  replaces that line for a page whose scheme changes something else. */
export function appearanceTemplate(
  picked: SchemeId,
  h: AppearanceHandlers,
  note = "Changes the windows, menus and buttons only.",
): TemplateResult {
  return html`
    <fieldset class="appearance-group">
      <legend>Scheme</legend>
      <div class="appearance-samples" role="radiogroup" aria-label="Scheme">
        ${SCHEMES.map(
          (id) => html`
            <label class="appearance-choice" data-scheme-choice=${id}>
              <input
                type="radio"
                name="appearance-scheme"
                value=${id}
                .checked=${picked === id}
                @change=${() => h.onPick(id)}
              />
              <span class="appearance-sample" data-sample=${id} aria-hidden="true">
                <span class="appearance-sample-title">Tower</span>
                <span class="appearance-sample-body"><span class="appearance-sample-btn">OK</span></span>
              </span>
              <span class="appearance-name">${SCHEME_NAMES[id]}</span>
            </label>
          `,
        )}
      </div>
    </fieldset>
    <p class="appearance-note">${note}</p>
    <div class="modal-actions modal-footer">
      <button type="button" class="btn primary" data-appearance="ok" @click=${h.onOk}>OK</button>
      <button type="button" class="btn" data-appearance="cancel" @click=${h.onCancel}>Cancel</button>
    </div>
  `;
}

/** The dialog as a view for {@link ModalShell}: the "Appearance" title bar
 *  over {@link appearanceTemplate}. */
export function appearanceView(picked: SchemeId, h: AppearanceHandlers, note?: string): ModalView {
  return { title: "Appearance", body: appearanceTemplate(picked, h, note) };
}

/** Options for {@link openAppearanceDialog}. */
export interface AppearanceDialogOptions {
  /** The line under the pictures; see {@link appearanceTemplate}. */
  readonly note?: string;
  /** Whether another dialog may take the shell's place while this one is
   *  open (`ModalOpts.displaceable`). True unless given. */
  readonly displaceable?: boolean;
}

/** Open the dialog in `shell` with `current` picked and its radio focused.
 *  `save` hears OK with the pick, after the dialog has closed. */
export function openAppearanceDialog(
  shell: ModalShell,
  current: SchemeId,
  save: (id: SchemeId) => void,
  opts: AppearanceDialogOptions = {},
): HTMLElement {
  let picked = current;
  const handlers: AppearanceHandlers = {
    onPick: (id) => {
      picked = id;
    },
    onOk: () => {
      shell.close();
      save(picked);
    },
    onCancel: () => shell.close(),
  };
  const box = shell.open(appearanceView(current, handlers, opts.note), { displaceable: opts.displaceable ?? true });
  box.querySelector<HTMLInputElement>(`input[value="${current}"]`)?.focus();
  return box;
}
