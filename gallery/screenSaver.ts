/**
 * The screen saver (`windows/screenSaver/*`): each scene on a little monitor,
 * and the Screen Saver dialog in the package's modal, whose Preview plays a
 * saver over the whole page. The monitors hold one still frame from a fixed
 * seed, so the page looks the same on every visit; the dialog's monitor and
 * the preview move, as they do in a game.
 */
import { html, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import { ModalShell } from "../lib/ui/uiModal.js";
import { openScreenSaverDialog } from "../lib/ui/screenSaver/saverDialog.js";
import { SAVERS, SAVER_NAMES, defaultSaverPrefs, type SaverId } from "../lib/ui/screenSaver/saverPrefs.js";
import type { Rng, SaverScene } from "../lib/ui/screenSaver/saverScene.js";
import { runScene, showScreenSaver } from "../lib/ui/screenSaver/screenSaver.js";
import { bulletinMarquee, expressElevators, skylineStarfield } from "../lib/ui/screenSaver/skyScenes.js";
import { endlessTower, nightShift } from "../lib/ui/screenSaver/towerScenes.js";

/** The marquee's sample lines, as a game would read them from its tower. */
const MARQUEE = ["Sample Tower", "Population 1,234", "Three stars", "The hotel is full tonight"];

/** A small seeded random source, so a still frame is the same every time. */
export function seeded(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A saver's scene for a canvas `w` by `h`. Night Shift has no tower here,
 *  so it draws the made-up tower a game shows before its first room. */
function makeScene(id: SaverId, w: number, h: number, rng: Rng = Math.random): SaverScene {
  switch (id) {
    case "night":
      return nightShift(w, h, null, rng);
    case "stars":
      return skylineStarfield(w, h, rng);
    case "express":
      return expressElevators(w, h, rng);
    case "endless":
      return endlessTower(w, h, rng);
    case "marquee":
      return bulletinMarquee(w, h, MARQUEE, rng);
  }
}

const MONITOR_W = 88;
const MONITOR_H = 66;

/** One saver on a little monitor, as the dialog shows it, held still. */
function monitor(id: SaverId): TemplateResult {
  const drawn = (el?: Element) => {
    if (el instanceof HTMLCanvasElement) runScene(el, makeScene(id, MONITOR_W, MONITOR_H, seeded(7)), true);
  };
  return html`<figure class="g-saver">
    <div class="saver-monitor" aria-hidden="true">
      <div class="saver-bezel">
        <canvas class="saver-screen" width=${MONITOR_W} height=${MONITOR_H} ${ref(drawn)}></canvas>
      </div>
      <div class="saver-stand"></div>
    </div>
    <figcaption><strong>${SAVER_NAMES[id]}</strong></figcaption>
  </figure>`;
}

/** Every saver on its monitor. */
export function saverScenes(): TemplateResult {
  return html`<div class="g-row">${SAVERS.map(monitor)}</div>`;
}

/** The button that opens the Screen Saver dialog, and the dialog it opens in. */
export function saverDialogDemo(): TemplateResult {
  let shell: ModalShell | null = null;
  let prefs = defaultSaverPrefs(false);
  const still = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const made = (el?: Element) => {
    if (el instanceof HTMLDialogElement && !shell)
      shell = new ModalShell(el, { gameStopped: () => false, toast: () => undefined });
  };
  const open = () => {
    if (!shell) return;
    const box = shell;
    openScreenSaverDialog(box, prefs, {
      makeScene: (id, w, h) => makeScene(id, w, h),
      still,
      save: (p) => {
        prefs = p;
      },
      preview: (id, back) => {
        showScreenSaver({ makeScene: (w, h) => makeScene(id, w, h), still: still(), onEnd: back });
      },
    });
  };
  return html`<div class="g-row">
      <button type="button" class="btn" @click=${open}>Screen Saver…</button>
    </div>
    <dialog id="modal" ${ref(made)}></dialog>`;
}
