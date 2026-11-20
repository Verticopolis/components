/**
 * The desk demo: the 1994 desk's windows from `windows/desk/*`, live on a
 * small sample desk. A sample tower (a menu bar over a painted lobby), Info
 * and Tools are frames the desk builds (`buildFrame`); the Bulletin is a
 * window with its own title bar and ✕, which `DeskWindow` takes over the way
 * it takes over a game's own windows. Every window moves by its title bar and
 * minimizes to the taskbar; the tower and Tools resize by their grips, the
 * tower maximizes, and a right-click on a title bar or a taskbar button opens
 * the window menu (`WindowMenu`). The taskbar, its Verticopolis menu and the
 * tray are the package's `DeskTaskbar`; its clock holds at 9:15 AM here.
 * The package's `DeskManager` keeps the windows and the taskbar in step.
 *
 * The desk's stylesheet keys its window rules on `body.desk`, so this page's
 * body wears that class while the demo is on it.
 */
import { html, render, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import { renderDetached } from "../lib/ui/detached.js";
import { buildFrame } from "../lib/ui/desk/deskWindow.js";
import { DeskManager, type DeskSlot } from "../lib/ui/desk/deskManager.js";
import type { WindowMenuHandlers } from "../lib/ui/desk/deskWindowMenu.js";
import { DeskTaskbar } from "../lib/ui/desk/deskTaskbar.js";
import { TOOLS_LIMITS, TOWER_LIMITS, type DeskRect, type DeskWindowId } from "../lib/ui/desk/deskGeometry.js";
import { MenuBar, type MenuBarModel } from "../lib/ui/menuBar.js";
import type { FacilityKind, RenderFacility } from "../lib/render/renderModel.js";
import { canvasTemplate } from "./canvas.js";
import { GALLERY_HOUR } from "./rooms.js";
import { paintScene, sceneSize } from "./scene.js";
import { lobbyScenes } from "./scenes.js";

/** The sample desk's size in CSS px, taskbar included: fixed, so the demo
 *  looks the same on every screen (a narrow one scrolls it). */
export const DESK_W = 720;
export const DESK_H = 460;
/** The taskbar's height (`desk.css`). */
const TASKBAR_H = 28;

/** The tray clock's fixed time, so the screenshots hold still. */
const CLOCK = new Date(2026, 10, 15, 9, 15);

/** The site's app icon, beside the site's base. */
const ICON = `${import.meta.env.BASE_URL.replace(/\/?$/, "/")}favicon.png`;

/** Where each window opens, laid out by hand for the small sample desk
 *  (`defaultLayout` lays out a full-size desk; the next page draws it). */
const PLACES: Record<DemoId, DeskRect> = {
  tools: { x: 8, y: 8, w: 132, h: 250 },
  info: { x: 148, y: 8, w: 352, h: 0 },
  tower: { x: 148, y: 62, w: 352, h: 300 },
  bulletin: { x: 508, y: 8, w: 204, h: 0 },
};

type DemoId = Extract<DeskWindowId, "tower" | "info" | "tools" | "bulletin">;

/** The taskbar's order. */
const ORDER: readonly DemoId[] = ["tower", "info", "tools", "bulletin"];

/** The slice of tower the sample tower window shows: two halls of different
 *  heights with rooms above them. */
function towerScene(facts: (kind: FacilityKind) => RenderFacility): TemplateResult {
  const scenes = lobbyScenes(facts);
  const scene = scenes.find((s) => s.title === "Halls of two heights") ?? scenes[0];
  const { w, h } = sceneSize(scene);
  const canvas = canvasTemplate(w, h, scene.title, (ctx) =>
    paintScene({ ctx, lit: true, anim: 0, hour: GALLERY_HOUR, parkingUse: 0.7, recycleFill: 0.66 }, scene, facts),
  );
  return html`<div class="g-desk-stage">${canvas}</div>`;
}

const INFO = html`<div class="g-desk-info">
  <span><b>Funds</b> $2,450,000</span><span><b>Population</b> 1,204</span><span><b>Time</b> 9:15 AM</span>
</div>`;

const TOOLS = html`<div class="g-desk-tools">
  ${["Lobby", "Floor", "Office", "Condo", "Hotel room", "Stairs", "Elevator"].map(
    (t) => html`<button type="button" class="btn">${t}</button>`,
  )}
</div>`;

/** The Bulletin: a window that draws its own title bar and ✕. */
const bulletinTemplate = (close: () => void): TemplateResult =>
  html`<section id="g-desk-bulletin" class="win win-closable g-desk-bulletin" aria-labelledby="g-desk-bulletin-title">
    <div class="win-title">
      <span class="desk-title-text" id="g-desk-bulletin-title">Bulletin</span
      ><button type="button" class="btn xs" aria-label="Close Bulletin" @click=${close}>×</button>
    </div>
    <div class="well g-desk-news">
      <div>8:00 AM: the lobby opened.</div>
      <div>9:15 AM: an office tenant moved in.</div>
    </div>
  </section>`;

/** Build the sample desk into `holder`. `facts` gives the painters the
 *  render catalog's facts for each kind. The package's `DeskManager` keeps
 *  the windows and the taskbar in step, as it does on the game's desk. */
export function deskDemo(holder: HTMLElement, facts: (kind: FacilityKind) => RenderFacility): void {
  document.body.classList.add("desk");
  const doc = holder.ownerDocument;
  const els = {} as Record<DemoId, HTMLElement>;

  const open = (id: DemoId) => () => void (els[id].hidden = false);
  const close = (id: DemoId) => () => void (els[id].hidden = true);

  /** Open every window, put each back where it opens at its own size, and
   *  give the tower the focus. */
  const arrange = () => {
    for (const id of ORDER) desk.show(id);
    desk.arrange();
    desk.bringUp("tower");
  };

  const START: Record<string, () => void> = {
    tower: () => desk.show("tower"),
    bulletin: () => desk.show("bulletin"),
    arrange,
  };

  /** The window menu's handlers, built once the manager is there. */
  let handlers: WindowMenuHandlers | null = null;
  const menu = () => (handlers ??= desk.windowMenu());

  let soundOn = true;
  const taskbar = new DeskTaskbar(doc, {
    items: [
      { id: "tower", label: "Sample Tower" },
      { id: "bulletin", label: "Bulletin" },
      null,
      { id: "arrange", label: "Arrange Windows" },
    ],
    icon: ICON,
    now: () => CLOCK,
    task: (id) => desk.taskPressed(id as DemoId),
    start: (id) => START[id]?.(),
    sound: () => taskbar.setSound((soundOn = !soundOn)),
    windowMenu: {
      state: (id) => menu().state(id),
      run: (id, command) => menu().run(id, command),
    },
  });

  /** A right-click on a window's title bar opens its window menu there. */
  const titleMenu = (ev: MouseEvent) => {
    const id = desk.titleBarOf(ev.target);
    if (!id) return;
    ev.preventDefault();
    taskbar.openWindowMenu(id, ev.clientX, ev.clientY);
  };

  // The windows are drawn first, then put on the desk as the desk template's
  // values, and only then handed to the manager, which needs them on the page
  // to place them.
  const tools = buildFrame(doc, "g-desk-tools", "Tools", undefined, ICON);
  render(TOOLS, tools.body);

  const info = buildFrame(doc, "g-desk-info", "Info", undefined, ICON);
  render(INFO, info.body);

  const tower = buildFrame(
    doc,
    "g-desk-tower",
    "Sample Tower",
    { label: "Close Sample Tower", onClick: close("tower") },
    ICON,
  );
  let menuHost!: HTMLElement;
  render(
    html`<div class="g-desk-menu" ${ref((el) => el && (menuHost = el as HTMLElement))}></div>${towerScene(facts)}`,
    tower.body,
  );
  new MenuBar(
    menuHost,
    towerMenu((id) => desk.show(id)),
    { altKeys: false },
  );

  const bulletin = renderDetached(doc, bulletinTemplate(close("bulletin"))).elements[0] as HTMLElement;
  Object.assign(els, { tools: tools.root, info: info.root, tower: tower.root, bulletin });

  let area!: HTMLElement;
  render(
    html`<div class="g-desk-scroll">
      <div class="g-desk" style=${`width: ${DESK_W}px; height: ${DESK_H}px;`}>
        <div
          class="desk-area"
          style=${`bottom: ${TASKBAR_H}px;`}
          @contextmenu=${titleMenu}
          ${ref((el) => el && (area = el as HTMLElement))}
        >
          ${[tools.root, info.root, tower.root, bulletin]}
        </div>
        ${taskbar.root}
      </div>
    </div>`,
    holder,
  );
  taskbar.start();

  // The handlers above reach the manager only once it is made, here.
  const desk = new DeskManager<DemoId>({
    desk: area,
    order: ORDER,
    places: () => PLACES,
    // A maximized tower keeps its title bar and menu bar clear of the small windows.
    chrome: (id) => (id === "tower" ? menuHost : null),
    refreshed: (entries) => taskbar.render(entries),
  });
  const slot = (id: DemoId, label: string, rest: Partial<DeskSlot<DemoId>> = {}): DeskSlot<DemoId> => ({
    id,
    el: els[id],
    label: () => label,
    icon: ICON,
    layer: "tool",
    limits: null,
    canMax: false,
    isOpen: () => !els[id].hidden,
    ...rest,
  });
  desk.add(slot("tools", "Tools", { limits: TOOLS_LIMITS, heightOnly: true }));
  tools.root.style.width = `${PLACES.tools.w}px`;
  desk.add(slot("info", "Info"));
  info.root.style.width = `${PLACES.info.w}px`;
  desk.add(
    slot("tower", "Sample Tower", {
      layer: "app",
      limits: TOWER_LIMITS,
      canMax: true,
      open: open("tower"),
      close: close("tower"),
    }),
  );
  desk.add(slot("bulletin", "Bulletin", { open: open("bulletin"), close: close("bulletin") }));
  desk.start();
}

/** The sample tower's menu bar: its Window menu brings each window up, the
 *  way the game's does on the desk. */
function towerMenu(bringUp: (id: DemoId) => void): MenuBarModel {
  return {
    label: "Sample Tower menu",
    menus: [
      {
        id: "g-desk-window",
        label: "Window",
        mnemonic: 0,
        items: [
          { label: "Tools", onPick: () => bringUp("tools") },
          { label: "Info", onPick: () => bringUp("info") },
          { label: "Bulletin", onPick: () => bringUp("bulletin") },
        ],
      },
    ],
  };
}
