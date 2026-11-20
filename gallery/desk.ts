/**
 * The desk demo: the 1994 desk's windows from `windows/desk/*`, live on a
 * small sample desk. A sample tower (a menu bar over a painted lobby), Info
 * and Tools are frames the desk builds (`buildFrame`); the Bulletin is a
 * window with its own title bar and ✕, which `DeskWindow` takes over the way
 * it takes over a game's own windows. Every window moves by its title bar and
 * minimizes to the taskbar; the tower and Tools resize by their grips, the
 * tower maximizes, and a right-click on a title bar or a taskbar button opens
 * the window menu (`WindowMenu`). The taskbar is a sample (`deskTaskbar.ts`).
 *
 * The desk's stylesheet keys its window rules on `body.desk`, so this page's
 * body wears that class while the demo is on it.
 */
import { html, render, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import { renderDetached } from "../lib/ui/detached.js";
import { DESK_ACTIVE_CLASS, DeskWindow, buildFrame, type DeskChange } from "../lib/ui/desk/deskWindow.js";
import { WindowMenu, runWindowCommand, windowMenuState } from "../lib/ui/desk/deskWindowMenu.js";
import { TOOLS_LIMITS, TOWER_LIMITS, type DeskRect, type DeskWindowId } from "../lib/ui/desk/deskGeometry.js";
import { MenuBar, type MenuBarModel } from "../lib/ui/menuBar.js";
import type { FacilityKind, RenderFacility } from "../lib/render/renderModel.js";
import { canvasTemplate } from "./canvas.js";
import { GALLERY_HOUR } from "./rooms.js";
import { paintScene, sceneSize } from "./scene.js";
import { lobbyScenes } from "./scenes.js";
import { startMenuTemplate, taskbarTemplate, type StartItem } from "./deskTaskbar.js";

/** The sample desk's size in CSS px, taskbar included: fixed, so the demo
 *  looks the same on every screen (a narrow one scrolls it). */
export const DESK_W = 720;
export const DESK_H = 460;
/** The taskbar's height (`desk.css`). */
const TASKBAR_H = 28;

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

/** One window on the sample desk. */
interface Entry {
  readonly id: DemoId;
  readonly label: string;
  readonly el: HTMLElement;
  win: DeskWindow;
  open: boolean;
}

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
 *  render catalog's facts for each kind. */
export function deskDemo(holder: HTMLElement, facts: (kind: FacilityKind) => RenderFacility): void {
  document.body.classList.add("desk");
  const doc = holder.ownerDocument;
  const entries = new Map<DemoId, Entry>();
  let area!: HTMLElement;
  let bar!: HTMLElement;
  let active: Entry | null = null;
  let top = 0;
  let startOpen = false;
  let muted = false;

  const visible = () => [...entries.values()].filter((e) => e.open && !e.win.minimized);
  const entryOf = (w: DeskWindow) => [...entries.values()].find((e) => e.win === w)!;

  /** Give the focus to `e` (or to nobody): its title bar lights up and it
   *  stacks on top of its layer. Tools, Info and the Bulletin stay above the
   *  tower, as on the game's desk. */
  const focus = (e: Entry | null) => {
    active = e;
    if (e) e.el.style.zIndex = String((e.win.spec.layer === "tool" ? 1000 : 0) + ++top);
    for (const x of entries.values()) x.el.classList.toggle(DESK_ACTIVE_CLASS, x === e);
    draw();
  };
  /** The window now in front once `gone` steps away. */
  const next = (gone: Entry) =>
    visible()
      .filter((e) => e !== gone)
      .sort((a, b) => Number(b.el.style.zIndex) - Number(a.el.style.zIndex))[0] ?? null;

  const bringUp = (e: Entry) => {
    if (!e.open) {
      e.open = true;
      e.el.hidden = false;
    }
    if (e.win.minimized) e.win.restore();
    focus(e);
  };
  const close = (e: Entry) => {
    e.open = false;
    e.el.hidden = true;
    if (active === e) focus(next(e));
    else draw();
  };
  const changed = (e: Entry) => (what: DeskChange) => {
    if (what === "min" && active === e) focus(next(e));
    else draw();
  };

  const winMenu = new WindowMenu(doc, {
    state: (id) => windowMenuState(entries.get(id as DemoId)?.win, active?.win ?? null),
    run: (id, command) => runWindowCommand(entries.get(id as DemoId)?.win, command, (w) => bringUp(entryOf(w))),
  });

  /** Put every window back where it opens, at its own size, and open them. */
  const arrange = () => {
    for (const e of entries.values()) {
      if (e.win.maximized) e.win.toggleMax();
      e.win.place(PLACES[e.id]);
      bringUp(e);
    }
    focus(entries.get("tower")!);
  };

  const startItems: StartItem[] = [
    { label: "Sample Tower", run: () => bringUp(entries.get("tower")!) },
    { label: "Bulletin", run: () => bringUp(entries.get("bulletin")!) },
    null,
    { label: "Arrange Windows", run: arrange },
  ];

  function draw(): void {
    const tasks = [...entries.values()]
      .filter((e) => e.open)
      .map((e) => ({ id: e.id, label: e.label, on: e === active && !e.win.minimized }));
    const view = {
      icon: ICON,
      startOpen,
      startItems,
      tasks,
      muted,
      toggleStart: () => setStart(!startOpen),
      pickStart: (item: NonNullable<StartItem>) => {
        setStart(false);
        item.run();
      },
      task: (id: string) => {
        const e = entries.get(id as DemoId)!;
        if (e === active && !e.win.minimized) e.win.minimize();
        else bringUp(e);
      },
      taskMenu: (id: string, button: HTMLElement, x: number, y: number) => {
        setStart(false);
        winMenu.show(id, x, y, true, button);
      },
      toggleSound: () => {
        muted = !muted;
        draw();
      },
    };
    render(html`${startMenuTemplate(view)}${taskbarTemplate(view)}`, bar);
  }

  function setStart(open: boolean): void {
    if (open === startOpen) return;
    startOpen = open;
    if (open) winMenu.close();
    draw();
    if (open) bar.querySelector<HTMLElement>(".desk-start-menu .mb-item")?.focus();
  }

  /** A right-click on a window's title bar opens its window menu there. */
  const titleMenu = (ev: MouseEvent) => {
    const t = ev.target as Element;
    const winEl = t.closest(".desk-win");
    if (!winEl || !t.closest(".win-title") || t.closest("button")) return;
    const e = [...entries.values()].find((x) => x.el === winEl);
    if (!e) return;
    ev.preventDefault();
    setStart(false);
    winMenu.show(e.id, ev.clientX, ev.clientY, false, null);
  };

  render(
    html`<div class="g-desk-scroll">
      <div class="g-desk" style=${`width: ${DESK_W}px; height: ${DESK_H}px;`}>
        <div class="desk-area" style=${`bottom: ${TASKBAR_H}px;`} @contextmenu=${titleMenu} ${ref((el) => el && (area = el as HTMLElement))}></div>
        <div class="g-desk-bar" ${ref((el) => el && (bar = el as HTMLElement))}></div>
      </div>
    </div>`,
    holder,
  );
  holder.querySelector(".g-desk")!.append(winMenu.root);

  const add = (id: DemoId, label: string, el: HTMLElement, opts: Partial<DeskWindow["spec"]>) => {
    area.append(el);
    const e: Entry = { id, label, el, win: null as unknown as DeskWindow, open: true };
    e.win = new DeskWindow({
      id,
      el,
      label: () => label,
      icon: ICON,
      layer: "tool",
      limits: null,
      canMax: false,
      isOpen: () => e.open,
      changed: changed(e),
      pressed: () => active !== e && focus(e),
      ...opts,
    });
    e.win.place(PLACES[id]);
    entries.set(id, e);
    return e;
  };

  const tools = buildFrame(doc, "g-desk-tools", "Tools", undefined, ICON);
  render(TOOLS, tools.body);
  add("tools", "Tools", tools.root, { limits: TOOLS_LIMITS, heightOnly: true });
  tools.root.style.width = `${PLACES.tools.w}px`;

  const info = buildFrame(doc, "g-desk-info", "Info", undefined, ICON);
  render(INFO, info.body);
  add("info", "Info", info.root, {});
  info.root.style.width = `${PLACES.info.w}px`;

  const tower = buildFrame(
    doc,
    "g-desk-tower",
    "Sample Tower",
    { label: "Close Sample Tower", onClick: () => close(entries.get("tower")!) },
    ICON,
  );
  let menuHost!: HTMLElement;
  render(
    html`<div class="g-desk-menu" ${ref((el) => el && (menuHost = el as HTMLElement))}></div>${towerScene(facts)}`,
    tower.body,
  );
  add("tower", "Sample Tower", tower.root, {
    layer: "app",
    limits: TOWER_LIMITS,
    canMax: true,
    close: () => close(entries.get("tower")!),
  });
  new MenuBar(
    menuHost,
    towerMenu((id) => bringUp(entries.get(id)!)),
    { altKeys: false },
  );

  const bulletin = renderDetached(
    doc,
    bulletinTemplate(() => close(entries.get("bulletin")!)),
  ).elements[0] as HTMLElement;
  add("bulletin", "Bulletin", bulletin, {
    open: () => bringUp(entries.get("bulletin")!),
    close: () => close(entries.get("bulletin")!),
  });

  // A press anywhere else closes the open menus, and Escape closes them too,
  // as on the game's desk.
  doc.addEventListener(
    "pointerdown",
    (ev) => {
      const t = ev.target as Node;
      if (!winMenu.root.contains(t)) winMenu.close();
      const start = bar.querySelector(".desk-start");
      const menu = bar.querySelector(".desk-start-menu");
      if (!start?.contains(t) && !menu?.contains(t)) setStart(false);
    },
    true,
  );
  doc.addEventListener("keydown", (ev) => {
    if (ev.key !== "Escape") return;
    winMenu.close(true);
    if (startOpen) {
      setStart(false);
      bar.querySelector<HTMLElement>(".desk-start")?.focus();
    }
  });

  focus(entries.get("tower")!);
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
