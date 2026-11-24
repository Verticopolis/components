import { fitRect, parseLayout, type DeskRect, type DeskWindowId } from "./deskGeometry";
import { DESK_ACTIVE_CLASS, DeskWindow, type DeskChange, type DeskWindowSpec } from "./deskWindow";
import { runWindowCommand, windowMenuState, type WindowMenuHandlers } from "./deskWindowMenu";
import type { TaskEntry } from "./deskTaskbar";
import { read, write, type Store } from "./deskStore";

/**
 * The desk's window manager: it keeps the windows a page puts on the 1994
 * desk in step with each other and with the taskbar. It gives the focus and
 * stacks the windows in the order they were pressed (a maximized app window
 * stays under the small ones), runs a taskbar press and the window menu,
 * opens each window at its place (the saved one, or the page's own), keeps
 * the small windows off a maximized app window's menu bar, pulls the windows
 * back onto the desk when the browser window shrinks, and notices when the
 * page opens or closes one of them its own way.
 *
 * The page keeps what is its own: which elements become windows, how each
 * opens and closes, the taskbar's Start menu, and what it counts.
 *
 * Cost: nothing per frame. A resize settles once per animation frame; a
 * press, a change or an open-state change rebuilds the taskbar's few entries.
 */

/** A window for the manager: a {@link DeskWindowSpec} without the two
 *  callbacks, which the manager fills in. */
export type DeskSlot<Id extends string = DeskWindowId> = Omit<DeskWindowSpec<Id>, "changed" | "pressed">;

/** What a press on a window's taskbar button did: brought it to the front,
 *  minimized the front window, or brought a minimized one back. */
export type DeskTaskResult = "front" | "min" | "restore";

/** What a taskbar button press does to its window: a minimized one comes
 *  back, the front one minimizes, any other comes to the front. */
export function deskTaskResult(minimized: boolean, inFront: boolean): DeskTaskResult {
  if (minimized) return "restore";
  return inFront ? "min" : "front";
}

/** Where the manager remembers the windows' places and a maximized app
 *  window between visits. */
export interface DeskMemory {
  readonly store: Store | null;
  /** The key for the places, a JSON object of {@link DeskRect}s by id. */
  readonly layoutKey: string;
  /** The key for the id of the maximized app window ("" for none). */
  readonly maxKey: string;
}

export interface DeskManagerOptions<Id extends string = DeskWindowId> {
  /** The desk the windows sit on; its client size bounds them. */
  readonly desk: HTMLElement;
  /** Every window the page may put on the desk, in the taskbar's order. A
   *  window not named here has no button and no saved place. */
  readonly order: readonly Id[];
  /** Where each window opens on a desk `w` by `h`, when no place is saved. */
  readonly places: (w: number, h: number) => Partial<Record<Id, DeskRect>>;
  /** Where places and the maximize are kept; without it nothing is kept. */
  readonly memory?: DeskMemory;
  /** The element at the top of an app window (its menu bar) that small
   *  windows step below while that window is maximized; without it, they
   *  stay where they are. */
  readonly chrome?: (id: Id) => HTMLElement | null;
  /** The taskbar's entries changed: draw them (`DeskTaskbar.render`). */
  readonly refreshed: (entries: readonly TaskEntry[]) => void;
  /** A taskbar press and what it did. */
  readonly tasked?: (id: Id, result: DeskTaskResult) => void;
  /** A window changed by the player (never by the saved maximize coming
   *  back as the windows open). */
  readonly changed?: (id: Id, what: DeskChange) => void;
}

/** What the manager hears on each window: the page opening or closing it. */
const WATCHED: MutationObserverInit = { attributes: true, attributeFilter: ["hidden", "class"] };

/** A window the maximized app window pushed down: where it was and where it went. */
interface Stepped {
  readonly from: DeskRect;
  readonly to: DeskRect;
}

export class DeskManager<Id extends string = DeskWindowId> {
  private readonly wins = new Map<Id, DeskWindow<Id>>();
  /** Whether each window was open when last seen, to notice the page's own opens and closes. */
  private readonly wasOpen = new Map<Id, boolean>();
  private readonly stepped = new Map<Id, Stepped>();
  private current: DeskWindow<Id> | null = null;
  private z = 100;
  /** True while the saved maximize comes back, which is not the player's doing. */
  private restoring = false;
  private resizeFrame: number | null = null;
  private watcher: MutationObserver | null = null;

  constructor(private readonly opts: DeskManagerOptions<Id>) {}

  /** Put window `slot` on the desk under the manager. Small windows stack
   *  above the app windows in the order they were added. A window added
   *  after `start()` is heard from then on. */
  add(slot: DeskSlot<Id>): DeskWindow<Id> {
    const id = slot.id;
    const win = new DeskWindow<Id>({
      ...slot,
      changed: (what) => this.heard(id, what),
      pressed: () => this.focus(this.wins.get(id) ?? null),
    });
    this.wins.set(id, win);
    this.wasOpen.set(id, slot.isOpen());
    slot.el.style.zIndex = slot.layer === "tool" ? String(++this.z) : "1";
    this.watcher?.observe(slot.el, WATCHED);
    if (this.watcher) this.refresh();
    return win;
  }

  /** Window `id`, if the desk holds it. */
  get(id: Id): DeskWindow<Id> | undefined {
    return this.wins.get(id);
  }

  /** The window that has the focus, or null. */
  get active(): DeskWindow<Id> | null {
    return this.current;
  }

  /** Open every window at its place: the saved one, or the page's own,
   *  fitted to the desk; then maximize the app window that was maximized.
   *  Starts hearing the browser window's size and the windows' open state. */
  start(): void {
    this.layOut();
    const view = this.opts.desk.ownerDocument.defaultView;
    view?.addEventListener("resize", this.onResize);
    const watcher = new MutationObserver(() => this.sync());
    // The open state now, since a window may have opened or closed since it was added.
    for (const [id, w] of this.wins) {
      this.wasOpen.set(id, w.spec.isOpen());
      watcher.observe(w.spec.el, WATCHED);
    }
    this.watcher = watcher;
    const app = [...this.wins.values()].find((w) => w.spec.layer === "app") ?? null;
    this.focus(app, false);
  }

  /** Put every window back at its place and size, the way the desk first
   *  opened (an Arrange Windows command). Closed windows stay closed. */
  arrange(): void {
    const { desk, places } = this.opts;
    const first = places(desk.clientWidth, desk.clientHeight);
    for (const [id, win] of this.wins) {
      if (win.maximized) win.toggleMax();
      if (win.minimized) win.restore();
      const at = first[id];
      if (at) win.place(fitRect(at, desk.clientWidth, desk.clientHeight, win.spec.limits));
    }
    this.stepped.clear();
    this.save();
    this.focus(this.current);
  }

  /** Bring window `id` up: opened the page's way if it is closed, back from
   *  the taskbar if minimized, and in front. */
  show(id: Id): void {
    const w = this.wins.get(id);
    if (!w) return;
    if (!w.spec.isOpen()) w.spec.open?.();
    this.bringUp(id);
  }

  /** Back from the taskbar if minimized, and in front. */
  bringUp(id: Id): void {
    const w = this.wins.get(id);
    if (!w) return;
    w.restore();
    this.focus(w);
  }

  /** A press on window `id`'s taskbar button. */
  taskPressed(id: Id): void {
    const w = this.wins.get(id);
    if (!w) return;
    const result = deskTaskResult(w.minimized, w === this.current);
    this.opts.tasked?.(id, result);
    if (result === "restore") this.bringUp(id);
    else if (result === "min") w.minimize();
    else this.focus(w);
  }

  /** The window menu's handlers, for the taskbar's `windowMenu` option. */
  windowMenu(
    heard?: Pick<WindowMenuHandlers, "opened"> & { picked?: (id: string, command: string) => void },
  ): WindowMenuHandlers {
    return {
      state: (id) => windowMenuState(this.wins.get(id as Id), this.current),
      run: (id, command) => {
        heard?.picked?.(id, command);
        runWindowCommand(this.wins.get(id as Id), command, (w) =>
          w.minimized ? this.bringUp(w.spec.id) : this.focus(w),
        );
      },
      opened: heard?.opened,
    };
  }

  /** The id of the window whose title bar holds `target`, for a right-click
   *  that opens its window menu. */
  titleBarOf(target: EventTarget | null): Id | null {
    const t = target instanceof Element ? target : null;
    if (!t?.closest(".win-title") || t.closest("button")) return null;
    const el = t.closest(".desk-win");
    for (const [id, w] of this.wins) if (w.spec.el === el) return id;
    return null;
  }

  /** Give `win` the focus (null for none); `raise` false keeps its place in
   *  the stack. Windows stack in the order they were pressed; a maximized app
   *  window stays under the small ones. */
  focus(win: DeskWindow<Id> | null, raise = true): void {
    if (win && (win.minimized || !win.spec.isOpen())) win = null;
    // An app window's place moves on a maximize or a restore even with the focus.
    if (win && raise && (win !== this.current || win.spec.layer === "app")) {
      win.spec.el.style.zIndex = String(win.spec.layer === "app" && win.maximized ? 0 : ++this.z);
    }
    this.current = win;
    for (const w of this.wins.values()) w.spec.el.classList.toggle(DESK_ACTIVE_CLASS, w === win);
    this.refresh();
  }

  /** Rebuild the taskbar's entries from the windows' state, and name each
   *  open window's title-bar buttons after its label (a renamed tower). */
  refresh(): void {
    const entries: TaskEntry[] = [];
    for (const id of this.opts.order) {
      const w = this.wins.get(id);
      if (!w || !w.spec.isOpen()) continue;
      w.relabel();
      entries.push({ id, label: w.spec.label(), active: w === this.current, minimized: w.minimized });
    }
    this.opts.refreshed(entries);
  }

  /** Notice the windows the page opened or closed its own way: one just
   *  opened comes up in front, and the focus leaves one just closed. */
  sync(): void {
    let changed = false;
    for (const [id, w] of this.wins) {
      const open = w.spec.isOpen();
      if (open === this.wasOpen.get(id)) continue;
      this.wasOpen.set(id, open);
      changed = true;
      if (open) this.bringUp(id);
      else if (w === this.current) this.focusNext();
    }
    if (changed) this.refresh();
  }

  /** Take every window off the manager: the desk's buttons come off them,
   *  and nothing is heard any more. The page puts its elements back. */
  dispose(): void {
    const view = this.opts.desk.ownerDocument.defaultView;
    view?.removeEventListener("resize", this.onResize);
    if (this.resizeFrame !== null) view?.cancelAnimationFrame(this.resizeFrame);
    this.resizeFrame = null;
    this.watcher?.disconnect();
    this.watcher = null;
    for (const w of this.wins.values()) w.dispose();
    this.wins.clear();
    this.wasOpen.clear();
    this.stepped.clear();
    this.current = null;
  }

  private layOut(): void {
    const { desk, places, memory } = this.opts;
    const w = desk.clientWidth;
    const h = desk.clientHeight;
    const saved: Partial<Record<Id, DeskRect>> = memory
      ? parseLayout(read(memory.store, memory.layoutKey), this.opts.order)
      : {};
    const first = places(w, h);
    for (const [id, win] of this.wins) {
      const at = saved[id] ?? first[id];
      if (at) win.place(fitRect(at, w, h, win.spec.limits));
    }
    const max = memory ? read(memory.store, memory.maxKey) : null;
    const win = max ? this.wins.get(max as Id) : undefined;
    if (win?.spec.canMax && !win.maximized) {
      this.restoring = true;
      win.toggleMax();
      this.restoring = false;
    }
  }

  private save(): void {
    const memory = this.opts.memory;
    if (!memory) return;
    const out: Partial<Record<Id, DeskRect>> = {};
    for (const [id, win] of this.wins) if (win.spec.isOpen() && !win.minimized) out[id] = win.rect();
    const old = parseLayout(read(memory.store, memory.layoutKey), this.opts.order);
    write(memory.store, memory.layoutKey, JSON.stringify({ ...old, ...out }));
  }

  /** The topmost window still showing gets the focus. */
  private focusNext(): void {
    let best: DeskWindow<Id> | null = null;
    for (const w of this.wins.values()) {
      if (w.minimized || !w.spec.isOpen()) continue;
      if (!best || Number(w.spec.el.style.zIndex || 0) > Number(best.spec.el.style.zIndex || 0)) best = w;
    }
    this.focus(best);
  }

  private heard(id: Id, what: DeskChange): void {
    const win = this.wins.get(id);
    if (what === "move" || what === "resize") this.save();
    const app = win?.spec.layer === "app";
    if (app && (what === "max" || what === "unmax") && this.opts.memory) {
      const { store, maxKey } = this.opts.memory;
      write(store, maxKey, what === "max" ? id : "");
    }
    if (app && what === "max") this.stepDown(id);
    if (app && what === "unmax" && this.stepped.size) {
      this.stepBack();
      this.save();
    }
    if (this.restoring) return;
    this.opts.changed?.(id, what);
    if (what === "min") this.focusNext();
    else if (what === "restore" || what === "max" || what === "unmax") this.focus(win ?? null);
    else this.refresh();
  }

  /** A maximized app window keeps its title bar and menus in reach: a small
   *  window over them steps down below its menu bar. */
  private stepDown(id: Id): void {
    const desk = this.opts.desk;
    const bar = this.opts.chrome?.(id);
    if (!bar) return;
    const top = bar.getBoundingClientRect().bottom - desk.getBoundingClientRect().top + 2;
    for (const [other, win] of this.wins) {
      // A maximized small window already fills the desk, over the app window's menu bar on purpose.
      if (win.spec.layer !== "tool" || !win.spec.isOpen() || win.minimized || win.maximized) continue;
      const r = win.rect();
      if (r.y >= top) continue;
      win.place(fitRect({ ...r, y: top }, desk.clientWidth, desk.clientHeight, win.spec.limits));
      this.stepped.set(other, { from: r, to: win.rect() });
    }
  }

  /** The app window is back to its size: the windows it pushed go back up,
   *  unless the player has moved them since. */
  private stepBack(): void {
    for (const [id, { from, to }] of this.stepped) {
      const win = this.wins.get(id);
      const now = win?.rect();
      if (win && now && now.x === to.x && now.y === to.y) win.place(from);
    }
    this.stepped.clear();
  }

  /** The browser window changed size: pull every window back onto the desk,
   *  once per frame at most. A maximized window already fills it. */
  private readonly onResize = (): void => {
    const view = this.opts.desk.ownerDocument.defaultView;
    if (!view || this.resizeFrame !== null) return;
    this.resizeFrame = view.requestAnimationFrame(() => {
      this.resizeFrame = null;
      const desk = this.opts.desk;
      for (const win of this.wins.values()) {
        if (win.maximized || !win.spec.isOpen()) continue;
        const now = win.rect();
        const fit = fitRect(now, desk.clientWidth, desk.clientHeight, win.spec.limits);
        if (fit.x !== now.x || fit.y !== now.y || fit.w !== now.w || fit.h !== now.h) win.place(fit);
      }
    });
  };
}
