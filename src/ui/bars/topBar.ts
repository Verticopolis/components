import { html, nothing, type TemplateResult } from "lit-html";
import { classMap } from "lit-html/directives/class-map.js";
import { guard } from "lit-html/directives/guard.js";
import { iconTemplate, type IconName } from "../icons";
import type { TrafficLevel } from "../../presentation/traffic";

/**
 * The game's Information bar: the Verticopolis badge, the six meters (rating,
 * date, time, funds, population and traffic) and the row of buttons (the four
 * speeds, Undo, Redo, Save, the speaker, and the Update and Install chips that
 * show only when there is something to offer). The game owns the bar's
 * element, `<header id="topbar">`, and renders {@link topBarTemplate} into
 * it, so the desk can move that element between windows. The look is
 * `styles/game/topbar.css`, with the desk's and the phone's sizes in
 * `desk.css`, `desk-pocket.css` and the media sheets.
 *
 * Every control but the speeds is optional: a page that leaves out an
 * action (Undo, Redo, Save, the speaker, Update, Install, the traffic
 * meter) gets no control for it, and `brand: false` leaves out the badge.
 * The game passes them all.
 *
 * Every id the game's stylesheets and help pages name stays as it was:
 * `#status`, `#stat-star`, `#stat-date`, `#stat-time`, `#stat-money`,
 * `#stat-pop`, `#traffic` with `#traffic-glyph`, `#traffic-label` and
 * `#traffic-floor`, `#speed` with its `data-speed` buttons, `#btn-undo`,
 * `#btn-redo`, `#btn-save-top`, `#audio-toggle`, `#btn-update` and
 * `#btn-install`.
 *
 * Cost: the game renders the bar on each status pass, several times a second,
 * and the time and the funds change on nearly every one. Lit compares every
 * value with the one it drew last and writes only the ones that changed, so an
 * unchanged pass touches no DOM. The badge, the traffic meter, the speeds and
 * the buttons after them sit behind `guard`: a pass that leaves their fields
 * as they were skips them with one comparison, so a pass costs the meters it
 * changed. Pass the same {@link TopBarActions} object every time, so lit never
 * rebinds a listener and the guards hold; which controls show is read from
 * that object, so give it every action it will answer from the start.
 * The classes go through `classMap`, which leaves alone a class the game adds
 * itself (the Play button's nudge). The funds color is a plain attribute, so
 * lit writes it only when the sign of the funds changes.
 */

/** What the meters and buttons show. The game formats every text. */
export interface TopBarView {
  /** False leaves out the Verticopolis badge; it shows when absent. */
  readonly brand?: boolean;
  /** The star rating, such as "★★☆☆☆", or "TOWER". */
  readonly rating: string;
  /** The date, such as "1st WD/1Q/1st Year". */
  readonly date: string;
  /** The time of day, such as "Mon 07:00". */
  readonly time: string;
  /** The funds, such as "$2,000,000". */
  readonly funds: string;
  /** The funds are below zero: they show in the warning color. */
  readonly fundsNegative: boolean;
  /** The population, such as "1,204". */
  readonly population: string;
  /** The traffic meter; drawn only with a `traffic` action. */
  readonly traffic?: TrafficReadout;
  /** The speed that is on: 0 is Pause, 1 to 3 are slow, medium and fast. */
  readonly speed: TopBarSpeed;
  /** Undo has nothing to undo: the button shows gray and stays focusable. */
  readonly undoOff?: boolean;
  /** Redo has nothing to redo. */
  readonly redoOff?: boolean;
  /** The sound is off: the speaker shows crossed out and is pressed. */
  readonly muted?: boolean;
  /** An update is ready: the Update chip shows. */
  readonly update?: boolean;
  /** The game can be installed: the Install chip shows. */
  readonly install?: boolean;
}

/** The traffic meter: four bars filled up to `level`, a word, and the floor
 *  of the worst line above Smooth. */
export interface TrafficReadout {
  readonly level: TrafficLevel;
  /** The level's word, such as "Backed up". */
  readonly word: string;
  /** A footnote after the word, such as " · 4F", or "" for none. */
  readonly floor: string;
  /** The whole sentence a screen reader hears, such as "Traffic: Busy, worst
   *  line on floor 4". */
  readonly spoken: string;
  /** The meter shows in the warning color as well as its bars. */
  readonly warn: boolean;
}

export type TopBarSpeed = 0 | 1 | 2 | 3;

/** What each control does. The bar runs nothing of its own. Every action but
 *  `speed` is optional: without it, its control is not drawn. */
export interface TopBarActions {
  speed(level: TopBarSpeed): void;
  /** Called on every press, a grayed one too: the game decides whether there
   *  is a step to undo, since a gesture under way can still be closed. */
  undo?(): void;
  redo?(): void;
  save?(): void;
  /** The speaker: the game flips the sound and renders the bar again. */
  mute?(): void;
  update?(): void;
  install?(): void;
  /** A click, a tap, Enter or Space on the traffic meter. */
  traffic?(): void;
}

const SPEEDS: readonly { level: TopBarSpeed; icon: IconName; title: string; label: string }[] = [
  { level: 0, icon: "pause", title: "Pause", label: "Pause" },
  { level: 1, icon: "speed1", title: "Play (slow speed)", label: "Play (slow speed)" },
  { level: 2, icon: "speed2", title: "Medium", label: "Medium speed" },
  { level: 3, icon: "speed3", title: "Fast", label: "Fast speed" },
];

const UPDATE_LABEL = "An update is ready. Tap to review.";

/** The icons, made once: a pass reuses each template, so the bar allocates no
 *  icon on a status pass. */
const ICON = {
  brand: iconTemplate("brand"),
  speed: SPEEDS.map((s) => iconTemplate(s.icon, { size: 14 })),
  undo: iconTemplate("undo"),
  redo: iconTemplate("redo"),
  save: iconTemplate("save"),
  sound: iconTemplate("sound"),
  mute: iconTemplate("mute"),
  update: iconTemplate("update", { size: 14 }),
  install: iconTemplate("install", { size: 14 }),
};

/** Enter or Space on the traffic meter, which is a span with role="button". */
function trafficKey(actions: TopBarActions, e: KeyboardEvent): void {
  if (e.key !== "Enter" && e.key !== " ") return;
  e.preventDefault();
  actions.traffic?.();
}

/** The listeners for one actions object, made once and kept, so every render
 *  binds the same functions and lit leaves the listeners as they are. */
interface Handlers {
  readonly speed: readonly (() => void)[];
  readonly undo: () => void;
  readonly redo: () => void;
  readonly save: () => void;
  readonly mute: () => void;
  readonly update: () => void;
  readonly install: () => void;
  readonly traffic: () => void;
  readonly trafficKey: (e: KeyboardEvent) => void;
}

const handlersOf = new WeakMap<TopBarActions, Handlers>();

function handlers(actions: TopBarActions): Handlers {
  let h = handlersOf.get(actions);
  if (!h) {
    h = {
      speed: SPEEDS.map((s) => () => actions.speed(s.level)),
      undo: () => actions.undo?.(),
      redo: () => actions.redo?.(),
      save: () => actions.save?.(),
      mute: () => actions.mute?.(),
      update: () => actions.update?.(),
      install: () => actions.install?.(),
      traffic: () => actions.traffic?.(),
      trafficKey: (e: KeyboardEvent) => trafficKey(actions, e),
    };
    handlersOf.set(actions, h);
  }
  return h;
}

const BRAND = html`<div class="brand">
  ${ICON.brand}<span>VERTICO<b>POLIS</b><span class="brand-tm">™</span></span>
</div>`;

/** The traffic meter's cell. */
function trafficTemplate(t: TrafficReadout, on: Handlers): TemplateResult {
  return html`<div class="stat" title="Vertical transport traffic: the worst waiting line. Tap to go to it">
    <span class="label">TRAFFIC</span>
    <span
      id="traffic"
      class=${classMap({ value: true, "traffic-warn": t.warn })}
      role="button"
      tabindex="0"
      aria-live="polite"
      aria-label=${t.spoken}
      @click=${on.traffic}
      @keydown=${on.trafficKey}
      ><span id="traffic-glyph" aria-hidden="true" data-level=${t.level}></span>
      <span id="traffic-label">${t.word}</span><span id="traffic-floor" aria-hidden="true">${t.floor}</span></span
    >
  </div>`;
}

/** The four speed buttons, with `speed` pressed. */
function speedButtons(speed: TopBarSpeed, on: Handlers): TemplateResult[] {
  return SPEEDS.map(
    (s, i) =>
      html`<button
        class=${classMap({ btn: true, active: speed === s.level })}
        data-speed=${s.level}
        title=${s.title}
        aria-label=${s.label}
        @click=${on.speed[i]}
      >
        ${ICON.speed[i]}
      </button>`,
  );
}

/** The buttons after the speeds, each drawn only when the page gave its action. */
function moreButtons(view: TopBarView, actions: TopBarActions, on: Handlers): TemplateResult {
  return html`${
    actions.undo
      ? html`<button class="btn" id="btn-undo" title="Undo (Ctrl+Z)" aria-label="Undo" aria-disabled=${view.undoOff ? "true" : nothing} @click=${on.undo}>
        ${ICON.undo}
      </button>`
      : nothing
  }${
    actions.redo
      ? html`<button class="btn" id="btn-redo" title="Redo (Ctrl+Shift+Z)" aria-label="Redo" aria-disabled=${view.redoOff ? "true" : nothing} @click=${on.redo}>
        ${ICON.redo}
      </button>`
      : nothing
  }${
    actions.save
      ? html`<button class="btn" id="btn-save-top" title="Save (Ctrl+S)" aria-label="Save" @click=${on.save}>${ICON.save}</button>`
      : nothing
  }${
    actions.mute
      ? html`<button
        class="btn"
        id="audio-toggle"
        title="Toggle sound"
        aria-label="Mute sound"
        aria-pressed=${view.muted ? "true" : "false"}
        @click=${on.mute}
      >
        ${view.muted ? ICON.mute : ICON.sound}
      </button>`
      : nothing
  }${
    actions.update
      ? html`<button class="btn" id="btn-update" title=${UPDATE_LABEL} aria-label=${UPDATE_LABEL} ?hidden=${!view.update} @click=${on.update}>
        ${ICON.update}<span class="btn-label">Update</span>
      </button>`
      : nothing
  }${
    actions.install
      ? html`<button
        class="btn"
        id="btn-install"
        title="Install Verticopolis: play offline, fullscreen, from your home screen."
        aria-label="Install Verticopolis"
        ?hidden=${!view.install}
        @click=${on.install}
      >
        ${ICON.install}<span class="btn-label">Install</span>
      </button>`
      : nothing
  }`;
}

/** The meters and buttons, for the game to render into its
 *  `<header id="topbar">`. */
export function topBarTemplate(view: TopBarView, actions: TopBarActions): TemplateResult {
  const on = handlers(actions);
  return html`${view.brand === false ? nothing : BRAND}
    <div id="status">
      <div class="stat" title="Star rating">
        <span class="label">RATING</span>
        <span id="stat-star" class="value stars">${view.rating}</span>
      </div>
      <div class="stat stat-date" title="Date">
        <span class="label">DATE</span>
        <span id="stat-date" class="value">${view.date}</span>
      </div>
      <div class="stat" title="Time of day">
        <span class="label">TIME</span>
        <span id="stat-time" class="value">${view.time}</span>
      </div>
      <div class="stat" title="Cash on hand">
        <span class="label">FUND</span>
        <span id="stat-money" class="value money" style="color: ${view.fundsNegative ? "var(--bad)" : "var(--money)"}"
          >${view.funds}</span
        >
      </div>
      <div class="stat" title="Total population">
        <span class="label">POP</span>
        <span id="stat-pop" class="value">${view.population}</span>
      </div>
      ${guard([view.traffic, on], () => (view.traffic && actions.traffic ? trafficTemplate(view.traffic, on) : nothing))}
    </div>
    <div id="speed">
      ${guard([view.speed, on], () => speedButtons(view.speed, on))}
      ${guard([view.undoOff, view.redoOff, view.muted, view.update, view.install, on], () =>
        moreButtons(view, actions, on),
      )}
    </div>`;
}
