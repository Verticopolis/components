/**
 * The component gallery: every reusable piece of the package in each color
 * scheme, built from lib/ the way a consumer would. The chrome (windows,
 * buttons, wells, key-value rows, the menu bar and the icons) is plain markup
 * over the package's stylesheets; the room sprites are painted by the
 * package's own portrait painters with the engine's Modern catalog. The
 * overview map is left out: it draws a running tower, and the gallery has
 * none.
 */
import initEngine, { catalog as engineCatalog } from "@verticopolis/engine/web/verticopolis_engine.js";
import { readCatalog } from "../lib/engineBinding/catalog.js";
import type { Catalog, CatalogFacility } from "../lib/catalog/catalogTypes.js";
import type { FacilityKind } from "../lib/shared/types.js";
import { bindViewWorld } from "../lib/presentation/viewWorld.js";
import { bindViewKinds } from "../lib/presentation/viewKinds.js";
import { drawRoomPortrait, drawTransportPortrait } from "../lib/render/roomPortrait.js";
import type { DrawCtx } from "../lib/render/sprites.js";
import { MenuBar } from "../lib/ui/menuBar.js";
import { ICON_NAMES, iconElement } from "../lib/ui/icons.js";

/** The color schemes, by the value each sets on `html[data-scheme]` (none for
 *  the classic look). */
const SCHEMES: ReadonlyArray<{ label: string; value: string | null }> = [
  { label: "Classic", value: null },
  { label: "Skyline", value: "skyline" },
  { label: "High contrast", value: "high_contrast" },
];

/** Sprite cell size in CSS px, the caption strip the painters keep clear, and
 *  the magnification (a whole multiple, so world pixels stay square blocks). */
const CELL_W = 260;
const CELL_H = 200;
const CAPTION_H = 0;
const MAG = 3;

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
      <div class="field">A sunken well</div>
      <dl class="kv">
        <dt class="k">Population</dt><dd class="v">1,204</dd>
        <dt class="k">Funds</dt><dd class="v">$2,450,000</dd>
        <dt class="k">Rating</dt><dd class="v">3 stars</dd>
      </dl>
    </div>
  </div>
</div>`;

const MENU = `
<div class="g-menubar">
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
  </nav>
</div>`;

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

interface Sprite {
  label: string;
  draw(d: DrawCtx, w: number, h: number): void;
}

/** One cell per catalog kind, plus one per named variant (the canon shop,
 *  restaurant and venue names), in the catalog's own order. */
function sprites(cat: Catalog): Sprite[] {
  const facts = (kind: FacilityKind): CatalogFacility => {
    const f = cat.facilities.find((e) => e.key === kind);
    if (!f) throw new Error(`The engine's catalog has no ${kind}.`);
    return f;
  };
  return cat.facilities.flatMap((f): Sprite[] => {
    const kind = f.key;
    if (f.transport) {
      const span = f.fixedSpan ? 1 : 3;
      return [{ label: f.name, draw: (d, w, h) => drawTransportPortrait(d, facts, kind, span, 0, 0, w, h, CAPTION_H, MAG) }];
    }
    const base: Sprite = { label: f.name, draw: (d, w, h) => drawRoomPortrait(d, facts, kind, { state: "occupied" }, 0, 0, w, h, CAPTION_H, MAG) };
    const variants = (f.subtypes ?? []).map(
      (name): Sprite => ({
        label: `${f.name}: ${name}`,
        draw: (d, w, h) => drawRoomPortrait(d, facts, kind, { state: "occupied", subtype: name }, 0, 0, w, h, CAPTION_H, MAG),
      }),
    );
    return [base, ...variants];
  });
}

function spriteGrid(list: Sprite[]): HTMLElement {
  const grid = document.createElement("div");
  grid.className = "g-sprites";
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  for (const s of list) {
    const fig = document.createElement("figure");
    const canvas = document.createElement("canvas");
    canvas.width = CELL_W * dpr;
    canvas.height = CELL_H * dpr;
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", s.label);
    const ctx = canvas.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // A still evening frame, the look the game's own sprite gallery used.
    s.draw({ ctx, lit: true, anim: 0, hour: 19, parkingUse: 0.7, recycleFill: 0.66 }, CELL_W, CELL_H);
    const cap = document.createElement("figcaption");
    cap.textContent = s.label;
    fig.append(canvas, cap);
    grid.append(fig);
  }
  return grid;
}

async function start(): Promise<void> {
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
  const spritesHolder = document.createElement("div");
  spritesHolder.textContent = "Loading the engine's catalog…";
  const menu = fromMarkup(MENU);
  body.append(
    lede,
    schemeSwitcher(),
    section("Buttons", fromMarkup(BUTTONS)),
    section("Windows", fromMarkup(WINDOWS)),
    section("Wells and key-value rows", fromMarkup(WELLS)),
    section("Menu bar", menu),
    section("Icons", icons()),
    section("Room sprites", spritesHolder),
  );
  app.replaceChildren(win);
  new MenuBar(menu.querySelector<HTMLElement>(".menubar")!);

  try {
    await initEngine();
    const cat = readCatalog({ catalog: engineCatalog }, "modern");
    bindViewWorld(cat.world);
    bindViewKinds(cat);
    spritesHolder.replaceChildren(spriteGrid(sprites(cat)));
  } catch (e) {
    console.error("Component gallery: the engine's catalog did not load.", e);
    spritesHolder.textContent = "The room sprites need the engine, and it did not load. Reload the page to try again.";
  }
  (window as unknown as { galleryReady: boolean }).galleryReady = true;
}

void start();
