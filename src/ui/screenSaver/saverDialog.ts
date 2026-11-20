/**
 * The Screen Saver dialog: a small monitor plays the picked saver, the list
 * picks one (or none), Wait sets the minutes, a box says whether it also
 * shows on the way back to the tab, and Preview plays it full screen and
 * comes back to the dialog. OK keeps the choices; Cancel, the ✕ and Escape
 * drop them. It opens in the shared modal (`ModalShell`).
 *
 * The monitor's scene runs only while its canvas is on the page
 * (`runScene` stops itself once the canvas is gone, whatever closed the
 * dialog).
 *
 * Cost: nothing runs until it opens. While it is open, the monitor's scene
 * draws at most 30 times a second on an 88 by 66 canvas.
 */
import { html, type TemplateResult } from "lit-html";
import "../../styles/game/screen-saver.css"; // the monitor and the dialog's rows
import { messageActionsTemplate } from "../messageBox";
import type { ModalShell, ModalView } from "../uiModal";
import { runScene } from "./screenSaver";
import type { SaverScene } from "./saverScene";
import {
  NO_SAVER,
  SAVERS,
  SAVER_NAMES,
  WAIT_MINUTES,
  type SaverChoice,
  type SaverId,
  type SaverPrefs,
} from "./saverPrefs";

export interface SaverDialogPorts {
  /** Build a saver's scene for a canvas this size. */
  makeScene(id: SaverId, w: number, h: number): SaverScene;
  /** One still frame instead of motion. */
  still(): boolean;
  /** Keep the choices (OK). */
  save(p: SaverPrefs): void;
  /** Play a saver full screen, then call `back` when the player ends it. */
  preview(id: SaverId, back: () => void): void;
}

/** The monitor's canvas size, in its own pixels (the frame is 2x that). */
export const MONITOR_W = 88;
export const MONITOR_H = 66;

/** The dialog's words that depend on the page around it. */
export interface SaverDialogCopy {
  /** After the Wait list: "minutes" unless given (a game adds "while the
   *  tower is paused"). */
  readonly waitCaption?: string;
  /** The line under the choices about ending the saver. */
  readonly note?: string;
}

const DEFAULT_COPY: Required<SaverDialogCopy> = {
  waitCaption: "minutes",
  note: "Any key, click or tap, or moving the mouse, ends it, and that input goes nowhere else.",
};

export interface SaverDialogHandlers {
  onPick(choice: SaverChoice): void;
  onWait(minutes: number): void;
  onReturn(on: boolean): void;
  onPreview(): void;
  onOk(): void;
  onCancel(): void;
}

/** The dialog's body for the choices in `p`. */
export function screenSaverTemplate(p: SaverPrefs, h: SaverDialogHandlers, copy: SaverDialogCopy = {}): TemplateResult {
  const words = { ...DEFAULT_COPY, ...copy };
  const none = p.saver === NO_SAVER;
  return html`
    <div class="saver-monitor" aria-hidden="true">
      <div class="saver-bezel"><canvas class="saver-screen" width=${MONITOR_W} height=${MONITOR_H}></canvas></div>
      <div class="saver-stand"></div>
    </div>
    <fieldset class="saver-group">
      <legend>Screen saver</legend>
      <div class="saver-row">
        <select
          id="saver-pick"
          aria-label="Screen saver"
          @change=${(e: Event) => h.onPick((e.target as HTMLSelectElement).value as SaverChoice)}
        >
          <option value=${NO_SAVER} .selected=${none}>(None)</option>
          ${SAVERS.map((id) => html`<option value=${id} .selected=${p.saver === id}>${SAVER_NAMES[id]}</option>`)}
        </select>
        <button type="button" class="btn" data-saver="preview" ?disabled=${none} @click=${h.onPreview}>
          Preview
        </button>
      </div>
      <div class="saver-row">
        <label for="saver-wait">Wait:</label>
        <select
          id="saver-wait"
          ?disabled=${none}
          @change=${(e: Event) => h.onWait(Number((e.target as HTMLSelectElement).value))}
        >
          ${WAIT_MINUTES.map((m) => html`<option value=${m} .selected=${p.waitMinutes === m}>${m}</option>`)}
        </select>
        <span>${words.waitCaption}</span>
      </div>
      <label class="saver-check">
        <input
          type="checkbox"
          id="saver-return"
          ?disabled=${none}
          .checked=${p.onReturn}
          @change=${(e: Event) => h.onReturn((e.target as HTMLInputElement).checked)}
        />
        Also when I come back to this tab after that long
      </label>
    </fieldset>
    <p class="saver-note">${words.note}</p>
    ${messageActionsTemplate([
      { label: "OK", primary: true, act: "ok", onPress: h.onOk },
      { label: "Cancel", act: "cancel", onPress: h.onCancel },
    ])}
  `;
}

/** The dialog as a view for {@link ModalShell}. */
export function screenSaverView(p: SaverPrefs, h: SaverDialogHandlers, copy?: SaverDialogCopy): ModalView {
  return { title: "Screen Saver", body: screenSaverTemplate(p, h, copy) };
}

/** Open the dialog in `shell` with `start` as its first choices. */
export function openScreenSaverDialog(
  shell: ModalShell,
  start: SaverPrefs,
  ports: SaverDialogPorts,
  copy: SaverDialogCopy = {},
): void {
  const draft: SaverPrefs = { ...start };
  let stopMonitor = () => {};
  let box: HTMLElement | null = null;
  const play = () => {
    stopMonitor();
    stopMonitor = () => {};
    const canvas = box?.querySelector<HTMLCanvasElement>(".saver-screen");
    if (!canvas) return;
    if (draft.saver === NO_SAVER) {
      const c = canvas.getContext("2d");
      if (c) {
        c.fillStyle = "#000";
        c.fillRect(0, 0, MONITOR_W, MONITOR_H);
      }
      return;
    }
    stopMonitor = runScene(canvas, ports.makeScene(draft.saver, MONITOR_W, MONITOR_H), ports.still());
  };
  const close = () => {
    stopMonitor();
    shell.close();
  };
  const handlers: SaverDialogHandlers = {
    onPick: (choice) => {
      draft.saver = choice;
      shell.render(screenSaverView(draft, handlers, copy));
      play();
    },
    onWait: (m) => {
      draft.waitMinutes = m;
    },
    onReturn: (on) => {
      draft.onReturn = on;
    },
    onPreview: () => {
      if (draft.saver === NO_SAVER) return;
      const id = draft.saver;
      close();
      ports.preview(id, () => openScreenSaverDialog(shell, draft, ports, copy));
    },
    onOk: () => {
      ports.save({ ...draft });
      close();
    },
    onCancel: close,
  };
  box = shell.open(screenSaverView(draft, handlers, copy), { displaceable: true });
  // Set the lists from the draft once their options are in place: an option
  // marked selected before it joins its list does not hold in every DOM.
  const pick = box.querySelector<HTMLSelectElement>("#saver-pick");
  const wait = box.querySelector<HTMLSelectElement>("#saver-wait");
  if (pick) pick.value = draft.saver;
  if (wait) wait.value = String(draft.waitMinutes);
  play();
}
