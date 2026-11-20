/**
 * The gallery's demos: every reusable piece of the package, built from lib/
 * the way a consumer would, each mounted where a site page asks for it by
 * name (`site/src/components/Demo.astro`). The chrome (windows, buttons,
 * wells, key-value rows, a sample menu bar, message boxes, alert cards, the
 * update box and the icons) is
 * lit templates over the package's stylesheets, and the desk (`desk.ts`) is
 * the package's desk windows and window menu on a sample desk. The rooms and
 * the tower scenes are painted by the package's own painters from the
 * components' hand-written render catalog (`src/tests/catalogFixture.ts`),
 * the stand-in for the catalog a game hands the renderer. The overview map is
 * left out: it draws a running tower, and the gallery has none.
 */
import { catalogFor } from "../src/tests/catalogFixture.js";
import type { FacilityKind, RenderCatalog, RenderFacility } from "../lib/render/renderModel.js";
import { bindViewWorld } from "../lib/presentation/viewWorld.js";
import { bindViewKinds } from "../lib/presentation/viewKinds.js";
import type { DrawCtx } from "../lib/render/sprites.js";
import { html, nothing, render, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import { MenuBar, type MenuBarModel } from "../lib/ui/menuBar.js";
import { ICON_NAMES, iconTemplate, type IconName } from "../lib/ui/icons.js";
import { GALLERY_HOUR, roomCells, type RoomCell } from "./rooms.js";
import { paintScene, sceneSize, type Scene } from "./scene.js";
import { elevatorScenes, lobbyScenes, stairScenes } from "./scenes.js";
import { soundBoard } from "./sounds.js";
import { canvasTemplate, figure } from "./canvas.js";
import { ROOM_MANUAL, manualLink } from "./manual.js";
import { people } from "./people.js";
import { deskDemo } from "./desk.js";
import { deskLayouts } from "./deskLayout.js";
import { messageBoxes } from "./messageBoxes.js";
import { alertCards } from "./alertCards.js";
import { appearanceDemo } from "./appearance.js";
import { fileDialogDemo } from "./fileDialog.js";
import { titleScreenDemo } from "./titleScreen.js";
import { saverDialogDemo, saverScenes } from "./screenSaver.js";

/** Room cell size in CSS px. */
const CELL_W = 260;
const CELL_H = 200;

/** Scene magnification, a whole multiple so world pixels stay square blocks. */
const SCENE_MAG = 2;

const BUTTONS = html`<div class="g-row">
  <button type="button" class="btn">Button</button>
  <button type="button" class="btn primary">Primary</button>
  <button type="button" class="btn danger">Danger</button>
  <button type="button" class="btn" aria-disabled="true">Grayed</button>
  <button type="button" class="btn xs">xs</button>
  <a class="btn" href="#">Link button</a>
</div>`;

const WINDOWS = html`<div class="g-row">
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

const WELLS = html`<div class="g-row">
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

/** The sample menu bar, with made-up items that do nothing. */
const SAMPLE_MENU: MenuBarModel = {
  label: "Sample menu",
  menus: [
    {
      id: "g-file",
      label: "File",
      mnemonic: 0,
      items: [
        { label: "New…" },
        { label: "Open…", shortcut: "Ctrl+O" },
        { kind: "separator" },
        { label: "Save", shortcut: "Ctrl+S" },
        { label: "Grayed item", disabled: true },
      ],
    },
    {
      id: "g-options",
      label: "Options",
      mnemonic: 0,
      items: [
        { label: "Sound", checked: true },
        { label: "Music", checked: false },
      ],
    },
    { id: "g-help", label: "Help", mnemonic: 0, items: [{ label: "About…" }] },
  ],
};

const icon = (name: IconName) =>
  html`<figure>${iconTemplate(name, { size: 24 })}<figcaption>${name}</figcaption></figure>`;

const icons = () => html`<div class="g-icons">${ICON_NAMES.map(icon)}</div>`;

/** A still evening frame, the look the game's own sprite gallery used. */
function frame(ctx: CanvasRenderingContext2D, hour: number): DrawCtx {
  return { ctx, lit: true, anim: 0, hour, parkingUse: 0.7, recycleFill: 0.66 };
}

function roomCell(c: RoomCell): TemplateResult {
  const canvas = canvasTemplate(CELL_W, CELL_H, c.label, (ctx) => c.draw(frame(ctx, c.hour), CELL_W, CELL_H));
  const page = ROOM_MANUAL[c.kind];
  const link = page ? html` ${manualLink(page)}` : nothing;
  return html`<figure>${canvas}<figcaption><span class="g-name">${c.label}</span>${link}</figcaption></figure>`;
}

const roomGrid = (cells: RoomCell[]) => html`<div class="g-sprites">${cells.map(roomCell)}</div>`;

function sceneGrid(scenes: Scene[], facts: (kind: FacilityKind) => RenderFacility): TemplateResult {
  const shown = scenes.map((scene) => {
    const { w, h } = sceneSize(scene);
    const canvas = canvasTemplate(w * SCENE_MAG, h * SCENE_MAG, scene.title, (ctx) => {
      ctx.scale(SCENE_MAG, SCENE_MAG);
      paintScene(frame(ctx, GALLERY_HOUR), scene, facts);
    });
    return figure(canvas, scene.title, scene.caption, scene.manual ? manualLink(scene.manual) : undefined);
  });
  return html`<div class="g-scenes">${shown}</div>`;
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

/** The sample bar. Its Alt keys are off, so Alt and a letter open the
 *  site's own bar and never this one too. */
const sampleMenu = () =>
  html`<div class="g-menu-sample" ${ref((el) => el && new MenuBar(el as HTMLElement, SAMPLE_MENU, { altKeys: false }))}></div>`;

/** A demo draws itself into the holder the page gives it. */
type Demo = (holder: HTMLElement) => void;

/** A demo that is one template, drawn once. */
const shows =
  (template: () => TemplateResult): Demo =>
  (holder) =>
    render(template(), holder);

/** Every demo a page can show, by the name its `Demo` component passes. */
export const DEMOS = {
  buttons: shows(() => BUTTONS),
  windows: shows(() => WINDOWS),
  wells: shows(() => WELLS),
  "menu-bar": shows(sampleMenu),
  "message-boxes": shows(messageBoxes),
  "alert-cards": shows(alertCards),
  appearance: shows(appearanceDemo),
  "file-dialog": shows(fileDialogDemo),
  "title-screen": shows(titleScreenDemo),
  "saver-scenes": shows(saverScenes),
  "saver-dialog": shows(saverDialogDemo),
  desk: (holder) => deskDemo(holder, towerFacts().facts),
  "desk-layout": shows(deskLayouts),
  icons: shows(icons),
  sounds: soundBoard,
  people: shows(people),
  lobbies: shows(() => {
    const { facts } = towerFacts();
    return sceneGrid(lobbyScenes(facts), facts);
  }),
  stairs: shows(() => {
    const { facts } = towerFacts();
    return sceneGrid(stairScenes(facts), facts);
  }),
  elevators: shows(() => {
    const { facts } = towerFacts();
    return sceneGrid(elevatorScenes(facts), facts);
  }),
  rooms: shows(() => roomGrid(roomCells(towerFacts().cat.facilities))),
} satisfies Record<string, Demo>;

export type DemoName = keyof typeof DEMOS;

/** Fill each `[data-demo]` holder on the page with its demo, then mark the
 *  page ready for the screenshot tests. */
export function mountDemos(root: ParentNode = document): void {
  for (const holder of root.querySelectorAll<HTMLElement>("[data-demo]")) {
    const name = holder.dataset.demo as DemoName;
    const make = DEMOS[name];
    if (!make) throw new Error(`The gallery has no demo named ${name}.`);
    make(holder);
  }
  (window as unknown as { galleryReady: boolean }).galleryReady = true;
}
