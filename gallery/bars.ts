/**
 * The Information bar and the status bar (`windows/bars/topBar`,
 * `windows/bars/statusBar`) on a frame page of their own
 * (site/src/pages/frames/information-bar.astro), which loads the game's whole
 * stylesheet the way the game does. Every press only says what it was, the
 * speed and the speaker show their new state, and the traffic meter steps
 * through its four levels so each one can be seen. A check box trims the bar
 * to what a page with no history, saving, sound or traffic passes: the
 * meters and the speeds alone, without the badge.
 */
import { html, render } from "lit-html";
import {
  topBarTemplate,
  type TopBarActions,
  type TopBarSpeed,
  type TopBarView,
  type TrafficReadout,
} from "../lib/ui/bars/topBar.js";
import { statusBarTemplate, type StatusBarView } from "../lib/ui/bars/statusBar.js";
import { applyScheme, isScheme, DEFAULT_SCHEME } from "../lib/ui/schemes.js";
import { SCHEME_KEY } from "../site/schemeKey.mjs";

const TRAFFIC: readonly TrafficReadout[] = [
  { level: "smooth", word: "Smooth", floor: "", spoken: "Traffic: Smooth", warn: false },
  { level: "busy", word: "Busy", floor: " · 12F", spoken: "Traffic: Busy, worst line on floor 12", warn: false },
  {
    level: "backed-up",
    word: "Backed up",
    floor: " · 1F",
    spoken: "Traffic: Backed up, worst line on floor 1",
    warn: true,
  },
  {
    level: "gridlock",
    word: "Gridlock",
    floor: " · B2",
    spoken: "Traffic: Gridlock, worst line on floor B2",
    warn: true,
  },
];

const SPEED_NAMES = ["Pause", "Slow", "Medium", "Fast"] as const;

/** The sample tower's Information bar, which the pocket desk shows too. */
export const SAMPLE_TOP_BAR: TopBarView = {
  rating: "★★★☆☆",
  date: "2nd WD/3Q/4th Year",
  time: "Tue 08:45",
  funds: "$1,284,500",
  fundsNegative: false,
  population: "2,418",
  traffic: TRAFFIC[0],
  speed: 1,
  undoOff: false,
  redoOff: true,
  muted: false,
  update: true,
  install: true,
};

/** Draw both bars and their said line into the frame page's elements, and
 *  follow the scheme the gallery keeps when the visitor picks another. */
export function mountBars(doc: Document = document): void {
  const top = doc.getElementById("topbar");
  const status = doc.getElementById("statusbar");
  const line = doc.getElementById("g-bars-said");
  const trimHost = doc.getElementById("g-bars-trim");
  if (!top || !status || !line || !trimHost) return;
  let trimmed = false;
  let traffic = 0;
  let said = "Press a button or the traffic meter.";
  let view: TopBarView = SAMPLE_TOP_BAR;
  const bar: StatusBarView = {
    hint: "",
    tool: html`<span class="ti-name">Office</span><span>$40,000</span><span>9 tiles wide</span>`,
    tower: "Harmony Tower · Classic",
    news: "🔥 A fire broke out on floor 12.",
  };
  const say = (text: string) => {
    said = text;
    draw();
  };
  const actions: TopBarActions = {
    speed: (level: TopBarSpeed) => {
      view = { ...view, speed: level };
      say(`${SPEED_NAMES[level]} pressed.`);
    },
    undo: () => say("Undo pressed."),
    redo: () => say("Redo pressed: there is nothing to redo, so the game would do nothing."),
    save: () => say("Save pressed."),
    mute: () => {
      view = { ...view, muted: !view.muted };
      say(view.muted ? "Sound off." : "Sound on.");
    },
    update: () => say("Update pressed."),
    install: () => say("Install pressed."),
    traffic: () => {
      traffic = (traffic + 1) % TRAFFIC.length;
      view = { ...view, traffic: TRAFFIC[traffic] };
      say(`Traffic pressed: the meter now reads ${TRAFFIC[traffic].word}.`);
    },
  };
  /** What a page with only the speeds passes. */
  const speedsOnly: TopBarActions = { speed: actions.speed };
  const trim = (e: Event) => {
    trimmed = (e.target as HTMLInputElement).checked;
    say(trimmed ? "Trimmed to the meters and the speeds." : "Every control is back.");
  };
  const draw = () => {
    render(trimmed ? topBarTemplate({ ...view, brand: false }, speedsOnly) : topBarTemplate(view, actions), top);
    render(
      html`<label
        ><input type="checkbox" .checked=${trimmed} @change=${trim} /> Speeds only (a page with no undo, save, sound
        or traffic)</label
      >`,
      trimHost,
    );
    render(statusBarTemplate(bar), status);
    render(html`${said}`, line);
  };
  draw();
  followScheme(doc);
}

/** The gallery keeps the picked scheme in local storage; a pick on the page
 *  around the frame reaches the frame as a storage event. */
export function followScheme(doc: Document): void {
  const view = doc.defaultView;
  if (!view) return;
  view.addEventListener("storage", (e) => {
    if (e.key !== SCHEME_KEY) return;
    applyScheme(isScheme(e.newValue) ? e.newValue : DEFAULT_SCHEME, doc.documentElement);
  });
}
