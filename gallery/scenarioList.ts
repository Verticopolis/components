/**
 * Scenario lists (`windows/scenarioList`, `windows/newScenario`): the launch
 * window's numbered rows over three made-up scenarios, and a button that
 * opens the same scenarios in the New Scenario dialog. The first has its
 * best result kept, the second is open and unplayed, and the third is
 * locked. The launch window sits over the screen saver's Endless Tower,
 * running as a backdrop (`windows/screenSaver/sceneBackdrop`). Play only
 * says which was pressed.
 */
import { html, render, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import { newScenarioView, type NewScenario } from "../lib/ui/newScenario.js";
import { scenarioLaunchTemplate, type ScenarioEntry, type ScenarioMark } from "../lib/ui/scenarioList.js";
import { startSceneBackdrop } from "../lib/ui/screenSaver/sceneBackdrop.js";
import { seeded } from "./screenSaver.js";
import { endlessTower } from "../lib/ui/screenSaver/towerScenes.js";
import { ModalShell } from "../lib/ui/uiModal.js";

const marks = (reached: number, texts: readonly string[]): ScenarioMark[] =>
  texts.map((text, i) => ({ text, earned: reached > i }));

const ENTRIES: readonly ScenarioEntry[] = [
  {
    id: "morning",
    title: "Morning Crush",
    facts: [
      { label: "Rules", value: "Classic" },
      { label: "Length", value: "6 days" },
    ],
    brief:
      "Every office is rented and one elevator carries everyone. Bring the morning wait down before the week ends.",
    best: 2,
    locked: null,
    goals: [
      { label: "Load in the busiest hour", marks: marks(2, ["At most 50%", "At most 25%", "At most 18%"]) },
      { label: "Funds", marks: marks(3, ["At least $1M", "At least $1.5M", "At least $2M"]) },
    ],
  },
  {
    id: "noon",
    title: "Noon Rush",
    facts: [
      { label: "Rules", value: "Modern" },
      { label: "Length", value: "4 days" },
    ],
    brief: "A small tower with a food court and $300,000. Keep the lunch crowd moving.",
    best: 0,
    locked: null,
    goals: [{ label: "Population", marks: marks(0, ["At least 600", "At least 900", "At least 1,200"]) }],
  },
  {
    id: "night",
    title: "Night Line",
    facts: [
      { label: "Rules", value: "Modern" },
      { label: "Length", value: "60 days" },
    ],
    brief: "Three stations and a parking problem.",
    best: 0,
    locked: "Meet the Goal in Noon Rush to open it.",
    goals: [],
  },
];

/** The launch window, the button that opens the dialog, and a line saying
 *  what was pressed. */
export function scenarioListDemo(): TemplateResult {
  let shell: ModalShell | null = null;
  let root: HTMLElement | null = null;
  let said = "Press Play, or open the dialog.";
  let state: NewScenario = {
    lead: [
      {
        id: "sandbox",
        title: "Sandbox",
        note: "No goals",
        details: html`<p>Every tool and no money limit. There is nothing to win.</p>`,
      },
    ],
    entries: ENTRIES,
    picked: "morning",
  };
  const say = (what: string) => {
    said = what;
    draw();
  };
  const title = (id: string) => [...(state.lead ?? []), ...ENTRIES].find((e) => e.id === id)?.title ?? id;
  const on = {
    pick: (id: string) => {
      state = { ...state, picked: id };
      shell?.render(newScenarioView(state, on));
    },
    play: () => {
      shell?.close();
      say(`Play ${title(state.picked)}.`);
    },
    cancel: () => shell?.close(),
  };
  const openDialog = () => shell?.open(newScenarioView(state, on));
  function draw(): void {
    if (!root) return;
    render(
      html`<div class="g-backdrop">
          <canvas class="scene-backdrop" aria-hidden="true" ${ref(backdrop)}></canvas>
          ${scenarioLaunchTemplate(
            {
              title: "Sample Game",
              icon: "brand",
              heading: "Choose a scenario",
              entries: ENTRIES,
              foot: html`<span><b>Sandbox.</b> Every tool and no money limit.</span>
              <button type="button" class="btn" @click=${() => say("Sandbox pressed.")}>New Sandbox</button>`,
            },
            { play: (id) => say(`Play ${title(id)}.`) },
          )}
        </div>
        <div class="g-row">
          <button type="button" class="btn" @click=${openDialog}>New Scenario…</button>
        </div>
        <p class="g-title-said" role="status">${said}</p>`,
      root,
    );
  }
  let backdropCanvas: HTMLCanvasElement | null = null;
  /** The Endless Tower scene behind the launch window, started once, from a
   *  fixed seed so a still frame (reduced motion) is the same every visit. */
  const backdrop = (el?: Element) => {
    if (!(el instanceof HTMLCanvasElement) || el === backdropCanvas) return;
    backdropCanvas = el;
    const layer = () => document.createElement("canvas").getContext("2d");
    startSceneBackdrop(el, {
      makeScene: (w, h) => endlessTower(w, h, seeded(7), layer),
      still: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    });
  };
  const madeRoot = (el?: Element) => {
    if (el instanceof HTMLElement && el !== root) {
      root = el;
      draw();
    }
  };
  const madeDialog = (el?: Element) => {
    if (el instanceof HTMLDialogElement && !shell)
      shell = new ModalShell(el, { gameStopped: () => false, toast: () => undefined });
  };
  return html`<div class="g-scenarios" ${ref(madeRoot)}></div>
    <dialog id="modal" ${ref(madeDialog)}></dialog>`;
}
