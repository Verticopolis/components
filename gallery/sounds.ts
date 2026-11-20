/**
 * The gallery's sound board: play buttons for the package's own procedural
 * audio, the action effects, the two music tracks and the ambience of each
 * part of a tower. One audio engine plays them all. It loads on the first
 * press, as browsers only allow sound after one.
 */
import { AudioEngine, type ProgramKind, type SfxName } from "../lib/audio/Audio.js";
import { watchAway } from "../lib/audio/awayWatch.js";
import type { ViewFocus } from "../lib/render/excalibur/towerInputCamera.js";
import { html, nothing, render } from "lit-html";

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

/** A button on the board; `pressed` is set only on a button that stays pressed
 *  while its sound plays. */
interface Key {
  readonly label: string;
  readonly onPress: () => void;
  readonly pressed?: boolean;
}

const keyTemplate = (k: Key) =>
  html`<button type="button" class="btn" aria-pressed=${k.pressed === undefined ? nothing : String(k.pressed)} @click=${k.onPress}>${k.label}</button>`;

const rowTemplate = (title: string, keys: readonly Key[]) =>
  html`<div class="g-sound-row"><h3>${title}</h3><div class="g-row" role="group" aria-label=${title}>${keys.map(keyTemplate)}</div></div>`;

/** The sound board, drawn into `holder` and redrawn as its buttons press. */
export function soundBoard(holder: HTMLElement): void {
  const audio = new AudioEngine();
  // Fall silent while the page is hidden or out of focus, as the game does.
  watchAway({ win: window, doc: document }, (away) => audio.setAway(away));
  let music = 0;
  let ambience = 0;
  let focus: ViewFocus = BASE_FOCUS;
  let timer: ReturnType<typeof setInterval> | null = null;
  /** The label of the pressed music and place buttons, if any. */
  let musicOn: string | null = null;
  let placeOn: string | null = null;
  const apply = (): void => {
    audio.start();
    audio.setVolumes(music, ambience, 1);
  };

  const effects: Key[] = EFFECTS.map(({ name, label }) => ({
    label,
    onPress: () => {
      apply();
      audio.sfx(name);
    },
  }));
  const tracks = MUSIC.map(({ program, label }) => ({
    label,
    onPress: () => {
      music = 1;
      audio.setProgram(program);
      apply();
      musicOn = label;
      draw();
    },
  }));
  const stopMusic: Key = {
    label: "Stop music",
    onPress: () => {
      music = 0;
      apply();
      musicOn = null;
      draw();
    },
  };
  const places = PLACES.map(({ label, focus: f }) => ({
    label,
    onPress: () => {
      ambience = 1;
      focus = { ...BASE_FOCUS, ...f };
      apply();
      audio.update(focus);
      timer ??= setInterval(() => audio.update(focus), FOCUS_EVERY_MS);
      placeOn = label;
      draw();
    },
  }));
  const stopPlace: Key = {
    label: "Stop ambience",
    onPress: () => {
      ambience = 0;
      apply();
      if (timer !== null) clearInterval(timer);
      timer = null;
      placeOn = null;
      draw();
    },
  };

  function draw(): void {
    const musicKeys = tracks.map((k) => ({ ...k, pressed: k.label === musicOn }));
    const placeKeys = places.map((k) => ({ ...k, pressed: k.label === placeOn }));
    render(
      html`<div>${[
        rowTemplate("Effects", effects),
        rowTemplate("Music", [...musicKeys, stopMusic]),
        rowTemplate("Places", [...placeKeys, stopPlace]),
      ]}</div>`,
      holder,
    );
  }
  draw();
}
