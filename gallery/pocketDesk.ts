/**
 * The pocket desk (`windows/desk/deskPocket`) on a frame page of its own
 * (site/src/pages/frames/pocket-desk.astro), which loads the game's whole
 * stylesheet the way the game does. The Pocket desk page shows it in a
 * phone-shaped frame, so the frame is the phone's screen and the pocket
 * stylesheet's media queries take its size and orientation.
 *
 * The body wears `desk`, `desk-touch` and `desk-pocket`, as the game's does
 * on a phone. The tower window (`buildFrame`) fills the desk and holds the
 * sample tower's menu bar and the grid `pocketBody` draws, with the
 * Information bar, the tower's view and Tools in it. `desk-pocket.css` places
 * them by the game's element ids (`#topbar`, `#stage`, `#palette`), so this
 * page gives its own under the same ids: the page is the frame's alone, so
 * no other id can clash. The Bulletin opens over the whole desk. The taskbar
 * is the package's `DeskTaskbar`, and its clock holds at 9:15 AM.
 */
import { html, render, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import { renderDetached } from "../lib/ui/detached.js";
import { buildFrame } from "../lib/ui/desk/deskWindow.js";
import { DeskManager, type DeskSlot } from "../lib/ui/desk/deskManager.js";
import { DeskTaskbar } from "../lib/ui/desk/deskTaskbar.js";
import { DESK_POCKET_CLASS, DESK_TOUCH_CLASS, pocketBody } from "../lib/ui/desk/deskPocket.js";
import { TOWER_LIMITS, type DeskWindowId } from "../lib/ui/desk/deskGeometry.js";
import { MenuBar, type MenuBarModel } from "../lib/ui/menuBar.js";
import { topBarTemplate, type TopBarSpeed, type TopBarView } from "../lib/ui/bars/topBar.js";
import { ToolPalette } from "../lib/ui/palette/toolPalette.js";
import { SAMPLE_TOP_BAR, followScheme } from "./bars.js";
import { PINNED, groups } from "./palette.js";
import { canvasTemplate } from "./canvas.js";
import { GALLERY_HOUR } from "./rooms.js";
import { paintScene, sceneSize } from "./scene.js";
import { lobbyScenes } from "./scenes.js";
import { towerFacts } from "./towerFacts.js";

type PocketId = Extract<DeskWindowId, "tower" | "bulletin">;

/** The tray clock's fixed time, so the screenshots hold still. */
const CLOCK = new Date(2026, 10, 15, 9, 15);

/** The site's app icon, beside the site's base. */
const ICON = `${import.meta.env.BASE_URL.replace(/\/?$/, "/")}favicon.png`;

/** Where the game's CSS shows the Tools tabs (`media-phone.css`): there the
 *  categories are tab panels. */
const TAB_MQ = "(max-width: 767px), (max-width: 1023px) and (max-height: 599px)";
/** Where the tabs are one row that scrolls sideways. */
const STRIP_MQ =
  "(max-width: 1023px) and (max-height: 339.98px) and (orientation: landscape), (max-width: 539.98px) and (orientation: landscape)";

/** The sample tower's star rating and funds, for which tools show. */
const STARS = 3;
const FUNDS = 1_284_500;

/** The Bulletin: a window that draws its own title bar and ✕. */
const bulletinTemplate = (close: () => void): TemplateResult =>
  html`<section id="bulletin-win" class="win win-closable" aria-labelledby="bulletin-win-title" hidden>
    <div class="win-title">
      <span class="desk-title-text" id="bulletin-win-title">Bulletin</span
      ><button type="button" class="btn xs" aria-label="Close Bulletin" @click=${close}>×</button>
    </div>
    <div class="well g-pocket-news">
      <div>8:00 AM: the lobby opened.</div>
      <div>9:15 AM: an office tenant moved in.</div>
    </div>
  </section>`;

/** The sample tower's menu bar, with the app icon at its left as on a phone. */
const towerMenu = (bulletin: () => void): MenuBarModel => ({
  label: "Sample Tower menu",
  brand: true,
  menus: [
    {
      id: "g-pocket-window",
      label: "Window",
      mnemonic: 0,
      items: [{ label: "Bulletin", onPick: bulletin }],
    },
  ],
});

/** Build the sample pocket desk into the page's `#app`. */
export function mountPocketDesk(doc: Document = document): void {
  const app = doc.getElementById("app");
  if (!app) return;
  doc.body.classList.add("desk", DESK_TOUCH_CLASS, DESK_POCKET_CLASS);
  const { facts } = towerFacts();
  const view = doc.defaultView;
  const media = (q: string) => view?.matchMedia(q) ?? null;

  // The tower window: the menu bar, then the pocket grid.
  const tower = buildFrame(doc, "desk-win-tower", "Sample Tower", undefined, ICON);
  const grid = pocketBody(doc);
  let menuHost!: HTMLElement;
  render(
    html`<div id="menubar-host" ${ref((el) => el && (menuHost = el as HTMLElement))}></div>
      ${grid}`,
    tower.body,
  );

  let topView: TopBarView = SAMPLE_TOP_BAR;
  let top!: HTMLElement;
  let list!: HTMLElement;
  let tabs!: HTMLElement;
  const scenes = lobbyScenes(facts);
  const scene = scenes.find((s) => s.title === "Halls of two heights") ?? scenes[0];
  const { w, h } = sceneSize(scene);
  render(
    html`<header id="topbar" ${ref((el) => el && (top = el as HTMLElement))}></header>
      <aside id="palette" class="win docked">
        <div class="win-title">Tools</div>
        <div
          class="palette-tabs"
          id="palette-tabs"
          role="tablist"
          aria-label="Build categories"
          ${ref((el) => el && (tabs = el as HTMLElement))}
        ></div>
        <div class="palette-scroll" id="palette-scroll" ${ref((el) => el && (list = el as HTMLElement))}></div>
      </aside>
      <section id="stage" class="g-pocket-stage">
        ${canvasTemplate(w, h, scene.title, (ctx) =>
          paintScene({ ctx, lit: true, anim: 0, hour: GALLERY_HOUR, parkingUse: 0.7, recycleFill: 0.66 }, scene, facts),
        )}
      </section>`,
    grid,
  );
  const drawTop = () =>
    render(
      topBarTemplate(topView, {
        speed: (level: TopBarSpeed) => {
          topView = { ...topView, speed: level };
          drawTop();
        },
        mute: () => {
          topView = { ...topView, muted: !topView.muted };
          drawTop();
        },
      }),
      top,
    );
  drawTop();

  let active = "inspect";
  const palette = new ToolPalette({
    list,
    tabs,
    pinnedTitle: "Tools",
    tabMedia: media(TAB_MQ),
    stripMedia: media(STRIP_MQ),
    pick: (tool) => {
      active = tool.key;
      drawTools();
    },
  });
  const drawTools = () => palette.update({ pinned: PINNED, groups: groups(STARS, FUNDS), active });
  drawTools();

  const bulletin = renderDetached(
    doc,
    bulletinTemplate(() => void (bulletin.hidden = true)),
  ).elements[0] as HTMLElement;
  const els: Record<PocketId, HTMLElement> = { tower: tower.root, bulletin };
  const showBulletin = () => desk.show("bulletin");
  new MenuBar(menuHost, towerMenu(showBulletin), { altKeys: false });

  let soundOn = true;
  const taskbar = new DeskTaskbar(doc, {
    items: [{ id: "bulletin", label: "Bulletin" }],
    icon: ICON,
    now: () => CLOCK,
    task: (id) => desk.taskPressed(id as PocketId),
    start: (id) => id === "bulletin" && showBulletin(),
    sound: () => taskbar.setSound((soundOn = !soundOn)),
  });

  let area!: HTMLElement;
  render(
    html`<div id="desk" class="desk-area" ${ref((el) => el && (area = el as HTMLElement))}>
        ${[tower.root, bulletin]}
      </div>
      ${taskbar.root}`,
    app,
  );
  taskbar.start();

  const desk = new DeskManager<PocketId>({
    desk: area,
    order: ["tower", "bulletin"],
    // The pocket stylesheet fills the desk with each window, whatever its place.
    places: (dw, dh) => ({ tower: { x: 0, y: 0, w: dw, h: dh }, bulletin: { x: 0, y: 0, w: dw, h: dh } }),
    refreshed: (entries) => taskbar.render(entries),
  });
  const slot = (id: PocketId, label: string, rest: Partial<DeskSlot<PocketId>> = {}): DeskSlot<PocketId> => ({
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
  desk.add(slot("tower", "Sample Tower", { layer: "app", limits: TOWER_LIMITS }));
  desk.add(
    slot("bulletin", "Bulletin", {
      open: () => void (bulletin.hidden = false),
      close: () => void (bulletin.hidden = true),
    }),
  );
  desk.start();
  followScheme(doc);
}
