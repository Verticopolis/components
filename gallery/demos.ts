/**
 * The gallery's demos: every reusable piece of the package, built from lib/
 * the way a consumer would, each mounted where a site page asks for it by
 * name (`site/src/components/Demo.astro`). The chrome (windows, buttons,
 * wells, key-value rows, a sample menu bar and the icons) is plain markup
 * over the package's stylesheets. The rooms and the tower scenes are painted
 * by the package's own painters from the components' hand-written render
 * catalog (`src/tests/catalogFixture.ts`), the stand-in for the catalog a
 * game hands the renderer. The overview map is left out: it draws a running
 * tower, and the gallery has none.
 */
import { catalogFor } from "../src/tests/catalogFixture.js";
import type { FacilityKind, RenderCatalog, RenderFacility } from "../lib/render/renderModel.js";
import { bindViewWorld } from "../lib/presentation/viewWorld.js";
import { bindViewKinds } from "../lib/presentation/viewKinds.js";
import type { DrawCtx } from "../lib/render/sprites.js";
import { MenuBar } from "../lib/ui/menuBar.js";
import { ICON_NAMES, iconElement } from "../lib/ui/icons.js";
import { GALLERY_HOUR, roomCells, type RoomCell } from "./rooms.js";
import { paintScene, sceneSize, type Scene } from "./scene.js";
import { elevatorScenes, lobbyScenes, stairScenes } from "./scenes.js";
import { soundBoard } from "./sounds.js";
import { canvasFor, figure } from "./canvas.js";
import { people } from "./people.js";

/** Room cell size in CSS px. */
const CELL_W = 260;
const CELL_H = 200;

/** Scene magnification, a whole multiple so world pixels stay square blocks. */
const SCENE_MAG = 2;

function fromMarkup(markup: string): HTMLElement {
  const holder = document.createElement("div");
  holder.innerHTML = markup.trim();
  return holder.firstElementChild as HTMLElement;
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
      <button type="button" class="mb-title" id="g-file" aria-haspopup="menu" aria-expanded="false" aria-controls="g-file-menu"><span class="g-key">F</span>ile</button>
      <div class="mb-pop" id="g-file-menu" role="menu" aria-labelledby="g-file" hidden>
        <button type="button" role="menuitem" class="mb-item">New…</button>
        <button type="button" role="menuitem" class="mb-item">Open…<kbd>Ctrl+O</kbd></button>
        <hr class="mb-sep" />
        <button type="button" role="menuitem" class="mb-item">Save<kbd>Ctrl+S</kbd></button>
        <button type="button" role="menuitem" class="mb-item" aria-disabled="true">Grayed item</button>
      </div>
    </div>
    <div class="mb-menu">
      <button type="button" class="mb-title" id="g-options" aria-haspopup="menu" aria-expanded="false" aria-controls="g-options-menu"><span class="g-key">O</span>ptions</button>
      <div class="mb-pop" id="g-options-menu" role="menu" aria-labelledby="g-options" hidden>
        <button type="button" role="menuitemcheckbox" class="mb-item" aria-checked="true">Sound</button>
        <button type="button" role="menuitemcheckbox" class="mb-item" aria-checked="false">Music</button>
      </div>
    </div>
    <div class="mb-menu">
      <button type="button" class="mb-title" id="g-help" aria-haspopup="menu" aria-expanded="false" aria-controls="g-help-menu"><span class="g-key">H</span>elp</button>
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

/** The Modern render catalog, which holds every kind and variety the art
 *  draws, bound for the view the painters read. */
function towerFacts(): { cat: RenderCatalog; facts: (kind: FacilityKind) => RenderFacility } {
  const cat = catalogFor("modern");
  bindViewWorld(cat.world);
  bindViewKinds(cat);
  const byKey = new Map(cat.facilities.map((f) => [f.key, f]));
  const facts = (kind: FacilityKind): RenderFacility => {
    const f = byKey.get(kind);
    if (!f) throw new Error(`The gallery's catalog has no ${kind}.`);
    return f;
  };
  return { cat, facts };
}

/** Work a demo needs done once it is in the page, by its root element. */
const onMounted = new WeakMap<HTMLElement, () => void>();

/** The sample bar. `MenuBar` finds each menu by id in the document, so it is
 *  built once the bar is in the page. Its letters are underlined without a
 *  <u>, so Alt and a letter open the site's own bar and never this one too. */
function sampleMenu(): HTMLElement {
  const holder = document.createElement("div");
  holder.className = "g-menu-sample";
  const menu = fromMarkup(MENU);
  holder.append(menu);
  onMounted.set(holder, () => new MenuBar(menu));
  return holder;
}

/** Every demo a page can show, by the name its `Demo` component passes. */
export const DEMOS = {
  buttons: () => fromMarkup(BUTTONS),
  windows: () => fromMarkup(WINDOWS),
  wells: () => fromMarkup(WELLS),
  "menu-bar": sampleMenu,
  icons,
  sounds: soundBoard,
  people,
  lobbies: () => {
    const { facts } = towerFacts();
    return sceneGrid(lobbyScenes(facts), facts);
  },
  stairs: () => {
    const { facts } = towerFacts();
    return sceneGrid(stairScenes(facts), facts);
  },
  elevators: () => {
    const { facts } = towerFacts();
    return sceneGrid(elevatorScenes(facts), facts);
  },
  rooms: () => roomGrid(roomCells(towerFacts().cat.facilities)),
} satisfies Record<string, () => HTMLElement>;

export type DemoName = keyof typeof DEMOS;

/** Fill each `[data-demo]` holder on the page with its demo, then mark the
 *  page ready for the screenshot tests. */
export function mountDemos(root: ParentNode = document): void {
  for (const holder of root.querySelectorAll<HTMLElement>("[data-demo]")) {
    const name = holder.dataset.demo as DemoName;
    const make = DEMOS[name];
    if (!make) throw new Error(`The gallery has no demo named ${name}.`);
    const demo = make();
    holder.replaceChildren(demo);
    onMounted.get(demo)?.();
  }
  (window as unknown as { galleryReady: boolean }).galleryReady = true;
}
