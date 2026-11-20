/**
 * The component gallery: every reusable piece of the package in each color
 * scheme, built from lib/ the way a consumer would. The chrome (windows,
 * buttons, wells, key-value rows, the menu bar and the icons) is plain markup
 * over the package's stylesheets. The rooms and the tower scenes are painted
 * by the package's own painters from the components' hand-written render
 * catalog (`src/tests/catalogFixture.ts`), the stand-in for the catalog a game
 * hands the renderer. The overview map is left out: it draws a running tower,
 * and the gallery has none.
 */
import { catalogFor } from "../src/tests/catalogFixture.js";
import type { FacilityKind, RenderFacility } from "../lib/render/renderModel.js";
import { bindViewWorld } from "../lib/presentation/viewWorld.js";
import { bindViewKinds } from "../lib/presentation/viewKinds.js";
import type { DrawCtx } from "../lib/render/sprites.js";
import { MenuBar } from "../lib/ui/menuBar.js";
import { ICON_NAMES, iconElement } from "../lib/ui/icons.js";
import { GALLERY_HOUR, roomCells, type RoomCell } from "./rooms.js";
import { paintScene, sceneSize, type Scene } from "./scene.js";
import { elevatorScenes, lobbyScenes, stairScenes } from "./scenes.js";
import { soundBoard } from "./sounds.js";

/** The color schemes, by the value each sets on `html[data-scheme]` (none for
 *  the classic look). */
const SCHEMES: ReadonlyArray<{ label: string; value: string | null }> = [
  { label: "Classic", value: null },
  { label: "Skyline", value: "skyline" },
  { label: "High contrast", value: "high_contrast" },
];

/** Room cell size in CSS px. */
const CELL_W = 260;
const CELL_H = 200;

/** Scene magnification, a whole multiple so world pixels stay square blocks. */
const SCENE_MAG = 2;

const app = document.getElementById("app")!;

function section(title: string, body: HTMLElement): HTMLElement {
  const s = document.createElement("section");
  s.className = "g-section";
  const h = document.createElement("h2");
  h.textContent = title;
  s.append(h, body);
  return s;
}

function fromMarkup(markup: string): HTMLElement {
  const holder = document.createElement("div");
  holder.innerHTML = markup.trim();
  return holder.firstElementChild as HTMLElement;
}

function schemeSwitcher(): HTMLElement {
  const row = document.createElement("div");
  row.className = "g-schemes";
  row.setAttribute("role", "group");
  row.setAttribute("aria-label", "Color scheme");
  const buttons = SCHEMES.map(({ label, value }) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "btn";
    b.textContent = label;
    b.addEventListener("click", () => {
      if (value) document.documentElement.dataset.scheme = value;
      else delete document.documentElement.dataset.scheme;
      for (const other of buttons) other.setAttribute("aria-pressed", String(other === b));
    });
    return b;
  });
  buttons[0].setAttribute("aria-pressed", "true");
  row.append(...buttons);
  return row;
}

const BUTTONS = `
<div class="g-row">
  <button type="button" class="btn">Button</button>
  <button type="button" class="btn primary">Primary</button>
  <button type="button" class="btn danger">Danger</button>
  <button type="button" class="btn" aria-disabled="true">Grayed</button>
  <button type="button" class="btn xs">xs</button>
  <a class="btn" href="#">Link button</a>
</div>`;

const WINDOWS = `
<div class="g-row">
  <div class="win g-win">
    <div class="win-title">Window</div>
    <div class="g-pad">A window with a title bar.</div>
  </div>
  <div class="win win-closable g-win">
    <div class="win-title">Closable window <button type="button" class="btn xs" aria-label="Close">×</button></div>
    <div class="g-pad">Its title bar carries a close button.</div>
  </div>
  <div class="win g-win">
    <div class="win-title sm">Small title</div>
    <div class="g-pad">The compact title bar.</div>
  </div>
</div>`;

const WELLS = `
<div class="g-row">
  <div class="win g-win">
    <div class="win-title">Tower Info</div>
    <div class="g-pad">
      <div class="well g-well">
        <div>8:00 AM: the lobby opened.</div>
        <div>9:15 AM: an office tenant moved in.</div>
        <div>11:40 AM: a fast food shop opened.</div>
      </div>
      <input class="field g-field" type="text" value="A text field" aria-label="Sample text field" />
      <dl class="kv">
        <dt class="k">Population</dt><dd class="v">1,204</dd>
        <dt class="k">Funds</dt><dd class="v">$2,450,000</dd>
        <dt class="k">Rating</dt><dd class="v">3 stars</dd>
      </dl>
    </div>
  </div>
</div>`;

const MENU = `
<nav class="menubar" aria-label="Sample menu">
    <div class="mb-menu">
      <button type="button" class="mb-title" id="g-file" aria-haspopup="menu" aria-expanded="false" aria-controls="g-file-menu"><u>F</u>ile</button>
      <div class="mb-pop" id="g-file-menu" role="menu" aria-labelledby="g-file" hidden>
        <button type="button" role="menuitem" class="mb-item">New…</button>
        <button type="button" role="menuitem" class="mb-item">Open…<kbd>Ctrl+O</kbd></button>
        <hr class="mb-sep" />
        <button type="button" role="menuitem" class="mb-item">Save<kbd>Ctrl+S</kbd></button>
        <button type="button" role="menuitem" class="mb-item" aria-disabled="true">Grayed item</button>
      </div>
    </div>
    <div class="mb-menu">
      <button type="button" class="mb-title" id="g-options" aria-haspopup="menu" aria-expanded="false" aria-controls="g-options-menu"><u>O</u>ptions</button>
      <div class="mb-pop" id="g-options-menu" role="menu" aria-labelledby="g-options" hidden>
        <button type="button" role="menuitemcheckbox" class="mb-item" aria-checked="true">Sound</button>
        <button type="button" role="menuitemcheckbox" class="mb-item" aria-checked="false">Music</button>
      </div>
    </div>
    <div class="mb-menu">
      <button type="button" class="mb-title" id="g-help" aria-haspopup="menu" aria-expanded="false" aria-controls="g-help-menu"><u>H</u>elp</button>
      <div class="mb-pop" id="g-help-menu" role="menu" aria-labelledby="g-help" hidden>
        <button type="button" role="menuitem" class="mb-item">About…</button>
      </div>
    </div>
</nav>`;

function icons(): HTMLElement {
  const grid = document.createElement("div");
  grid.className = "g-icons";
  for (const name of ICON_NAMES) {
    const fig = document.createElement("figure");
    const cap = document.createElement("figcaption");
    cap.textContent = name;
    fig.append(iconElement(name, { size: 24 }), cap);
    grid.append(fig);
  }
  return grid;
}

/** A still evening frame, the look the game's own sprite gallery used. */
function frame(ctx: CanvasRenderingContext2D, hour: number): DrawCtx {
  return { ctx, lit: true, anim: 0, hour, parkingUse: 0.7, recycleFill: 0.66 };
}

function canvasFor(cssW: number, cssH: number, label: string): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", label);
  const ctx = canvas.getContext("2d")!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;
  return [canvas, ctx];
}

function figure(canvas: HTMLCanvasElement, title: string, caption?: string): HTMLElement {
  const fig = document.createElement("figure");
  const cap = document.createElement("figcaption");
  const name = document.createElement("strong");
  name.textContent = title;
  cap.append(name);
  if (caption) cap.append(document.createElement("br"), caption);
  fig.append(canvas, cap);
  return fig;
}

function roomGrid(cells: RoomCell[]): HTMLElement {
  const grid = document.createElement("div");
  grid.className = "g-sprites";
  for (const c of cells) {
    const [canvas, ctx] = canvasFor(CELL_W, CELL_H, c.label);
    c.draw(frame(ctx, c.hour), CELL_W, CELL_H);
    const fig = document.createElement("figure");
    const cap = document.createElement("figcaption");
    cap.textContent = c.label;
    fig.append(canvas, cap);
    grid.append(fig);
  }
  return grid;
}

function sceneGrid(scenes: Scene[], facts: (kind: FacilityKind) => RenderFacility): HTMLElement {
  const grid = document.createElement("div");
  grid.className = "g-scenes";
  for (const scene of scenes) {
    const { w, h } = sceneSize(scene);
    const [canvas, ctx] = canvasFor(w * SCENE_MAG, h * SCENE_MAG, scene.title);
    ctx.scale(SCENE_MAG, SCENE_MAG);
    paintScene(frame(ctx, GALLERY_HOUR), scene, facts);
    grid.append(figure(canvas, scene.title, scene.caption));
  }
  return grid;
}

/** The rooms and the tower scenes, drawn from the Modern render catalog,
 *  which holds every kind and variety the art draws. */
function towerSections(): HTMLElement[] {
  const cat = catalogFor("modern");
  bindViewWorld(cat.world);
  bindViewKinds(cat);
  const byKey = new Map(cat.facilities.map((f) => [f.key, f]));
  const facts = (kind: FacilityKind): RenderFacility => {
    const f = byKey.get(kind);
    if (!f) throw new Error(`The gallery's catalog has no ${kind}.`);
    return f;
  };
  return [
    section("Lobbies", sceneGrid(lobbyScenes(facts), facts)),
    section("Stairs and escalators", sceneGrid(stairScenes(facts), facts)),
    section("Elevators", sceneGrid(elevatorScenes(facts), facts)),
    section("Rooms", roomGrid(roomCells(cat.facilities))),
  ];
}

function start(): void {
  const win = fromMarkup(`
<div class="win page-win">
  <div class="win-title"><span class="page-title-text">@verticopolis/components</span></div>
  <div class="win-body"></div>
</div>`);
  const body = win.querySelector<HTMLElement>(".win-body")!;
  const lede = fromMarkup(`
<div class="page-lede">
  <h1>Component gallery</h1>
  <p class="sub">Every reusable piece of the package, drawn from its own stylesheets and painters. Pick a color scheme to see each one in it.</p>
</div>`);
  const menu = fromMarkup(MENU);
  const menuNote = document.createElement("p");
  menuNote.textContent =
    "The bar at the top of this page: open File or Options to see the menus, with the keyboard too (Alt and the underlined letter).";
  body.append(
    lede,
    schemeSwitcher(),
    section("Buttons", fromMarkup(BUTTONS)),
    section("Windows", fromMarkup(WINDOWS)),
    section("Wells, fields and key-value rows", fromMarkup(WELLS)),
    section("Menu bar", menuNote),
    section("Icons", icons()),
    section("Sounds", soundBoard()),
    ...towerSections(),
  );
  // The menu bar sits above the page window, outside any window body, the
  // way the game places it, so no page rule restyles its items.
  app.replaceChildren(menu, win);
  new MenuBar(menu);

  (window as unknown as { galleryReady: boolean }).galleryReady = true;
}

start();
