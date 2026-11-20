/**
 * The gallery's sound board: play buttons for the package's own procedural
 * audio, the action effects, the two music tracks and the ambience of each
 * part of a tower. One audio engine plays them all. It loads on the first
 * press, as browsers only allow sound after one.
 */
import { AudioEngine, type ProgramKind, type SfxName } from "../lib/audio/Audio.js";
import { watchAway } from "../lib/audio/awayWatch.js";
import type { ViewFocus } from "../lib/render/excalibur/towerInputCamera.js";

const EFFECTS: ReadonlyArray<{ name: SfxName; label: string }> = [
  { name: "click", label: "Click" },
  { name: "build", label: "Build" },
  { name: "sell", label: "Sell" },
  { name: "money", label: "Money" },
  { name: "promote", label: "Promotion" },
  { name: "notify", label: "Notice" },
  { name: "error", label: "Error" },
  { name: "tick", label: "Countdown tick" },
];

const MUSIC: ReadonlyArray<{ program: ProgramKind; label: string }> = [
  { program: "splash", label: "Title music" },
  { program: "game", label: "Tower music" },
];

/** Where the camera looks for each place, close up and fairly busy. */
const PLACES: ReadonlyArray<{ label: string; focus: Partial<ViewFocus> }> = [
  { label: "Lobby", focus: { dominant: "lobby" } },
  { label: "Offices", focus: { dominant: "office", hour: 11 } },
  { label: "Condos", focus: { dominant: "condo", hour: 18 } },
  { label: "Hotel", focus: { dominant: "hotelDouble", hour: 21, night: true } },
  { label: "Restaurants", focus: { dominant: "restaurant", hour: 19 } },
  { label: "Shops", focus: { dominant: "shop", hour: 15 } },
  { label: "Cinema", focus: { dominant: "cinema", hour: 20 } },
  { label: "Metro", focus: { dominant: "metro", centerFloor: -9 } },
  { label: "Street", focus: { dominant: "outside", centerFloor: 1 } },
  { label: "Street in the rain", focus: { dominant: "outside", centerFloor: 1, weather: "rain" } },
  { label: "Whole tower", focus: { dominant: "office", zoom: 0.1 } },
];

const BASE_FOCUS: ViewFocus = {
  centerFloor: 5,
  dominant: "lobby",
  night: false,
  zoom: 2,
  weather: "clear",
  hour: 12,
  crowd: 0.7,
};

/** How often the place's focus is handed to the audio engine again while it plays,
 *  as the game does every frame. */
const FOCUS_EVERY_MS = 250;

function button(label: string, onPress: () => void): HTMLButtonElement {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "btn";
  b.textContent = label;
  b.addEventListener("click", onPress);
  return b;
}

/** A button that stays pressed while its sound plays, unpressed at first. */
function toggle(label: string, onPress: () => void): HTMLButtonElement {
  const b = button(label, onPress);
  b.setAttribute("aria-pressed", "false");
  return b;
}

function row(title: string, buttons: HTMLElement[]): HTMLElement {
  const wrap = document.createElement("div");
  wrap.className = "g-sound-row";
  const h = document.createElement("h3");
  h.textContent = title;
  const r = document.createElement("div");
  r.className = "g-row";
  r.setAttribute("role", "group");
  r.setAttribute("aria-label", title);
  r.append(...buttons);
  wrap.append(h, r);
  return wrap;
}

/** Mark `on` as the pressed button of `group` (or none). */
function press(group: HTMLButtonElement[], on: HTMLButtonElement | null): void {
  for (const b of group) b.setAttribute("aria-pressed", String(b === on));
}

export function soundBoard(): HTMLElement {
  const audio = new AudioEngine();
  // Fall silent while the page is hidden or out of focus, as the game does.
  watchAway({ win: window, doc: document }, (away) => audio.setAway(away));
  let music = 0;
  let ambience = 0;
  let focus: ViewFocus = BASE_FOCUS;
  let timer: ReturnType<typeof setInterval> | null = null;
  const apply = (): void => {
    audio.start();
    audio.setVolumes(music, ambience, 1);
  };

  const effects = EFFECTS.map(({ name, label }) =>
    button(label, () => {
      apply();
      audio.sfx(name);
    }),
  );

  const musicButtons: HTMLButtonElement[] = [];
  for (const { program, label } of MUSIC) {
    const b = toggle(label, () => {
      music = 1;
      audio.setProgram(program);
      apply();
      press(musicButtons, b);
    });
    musicButtons.push(b);
  }
  const stopMusic = button("Stop music", () => {
    music = 0;
    apply();
    press(musicButtons, null);
  });

  const placeButtons: HTMLButtonElement[] = [];
  for (const { label, focus: f } of PLACES) {
    const b = toggle(label, () => {
      ambience = 1;
      focus = { ...BASE_FOCUS, ...f };
      apply();
      audio.update(focus);
      timer ??= setInterval(() => audio.update(focus), FOCUS_EVERY_MS);
      press(placeButtons, b);
    });
    placeButtons.push(b);
  }
  const stopPlace = button("Stop ambience", () => {
    ambience = 0;
    apply();
    if (timer !== null) clearInterval(timer);
    timer = null;
    press(placeButtons, null);
  });

  const board = document.createElement("div");
  const note = document.createElement("p");
  note.textContent =
    "Every sound is made by the package's synthesizer as it plays. Music and a place's ambience keep going until you stop them.";
  board.append(
    note,
    row("Effects", effects),
    row("Music", [...musicButtons, stopMusic]),
    row("Places", [...placeButtons, stopPlace]),
  );
  return board;
}
