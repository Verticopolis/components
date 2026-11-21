import { html, nothing, render, type TemplateResult } from "lit-html";
import { classMap } from "lit-html/directives/class-map.js";
import { repeat } from "lit-html/directives/repeat.js";
import { iconTemplate, type IconName } from "../icons";
import { loadFolded, PALETTE_FOLDED_CLASS, saveFolded } from "./paletteFolds";
import { pressKeys, type PressKeys } from "./pressKeys";
import { PaletteNews, shownGroups, unlockedCount, validOpen } from "./paletteNews";

/**
 * The game's Tools window: the pinned tools (Inspect, Bulldoze) and one
 * section per build category, each tool a swatch, a name and a price. On a
 * desktop the sections stack under their headers, and a header folds its
 * category (kept between visits). On a phone a tab bar shows one category at
 * a time, and a tab whose category just gained tools carries a "new" pip
 * until it is opened. The look is `styles/game/tools-stage.css`, with the
 * phone's in the media sheets and `desk-pocket.css`.
 *
 * The game owns the two elements and hands them in: the list,
 * `<div class="palette-scroll" id="palette-scroll">`, and on a page with the
 * phone tabs, `<div class="palette-tabs" id="palette-tabs" role="tablist"
 * aria-label="Build categories">`. It calls {@link ToolPalette.update} with
 * the tools as they stand (their names, prices, and which are locked, out of
 * reach of the funds, or picked), on every pass that changes them. A locked
 * tool is hidden, as in the 1994 game; one the funds cannot reach shows dimmed.
 *
 * Every tool keeps its element across updates (keyed by its key), so the
 * focus, and a class the game adds itself (the Getting Started pulse), stay
 * on it. The ids and data attributes stay as the game's stylesheets and its
 * Getting Started steps name them: `data-kind` or `data-tool` and
 * `data-group` on a tool, `pal-panel-<title>` and `pal-tab-<title>`.
 *
 * Cost: an update renders both elements; lit compares each value and writes
 * only what changed. The game updates when its lock or funds key changes, not
 * on every pass.
 */

/** One tool's button. */
export interface PaletteTool {
  /** The tool's key, unique in the window: a room's kind, or a tool's name. */
  readonly key: string;
  /** Whether the key is a room or piece to build (`data-kind`) or a tool
   *  such as Inspect (`data-tool`). */
  readonly attr: "kind" | "tool";
  readonly name: string;
  /** The price, such as "$40K" or "$5K/tile"; none for a tool that costs nothing. */
  readonly cost?: string;
  /** The swatch's color. */
  readonly color: string;
  /** An icon before the name. */
  readonly icon?: IconName;
  /** What the tool does: the button's accessible description and the status
   *  bar's hint. */
  readonly description: string;
  /** The spoken name, such as "Office, $40K". */
  readonly label: string;
  /** The tool sits under its category's "Modern" sub-band. */
  readonly modern?: boolean;
  /** Not yet unlocked: hidden. */
  readonly locked?: boolean;
  /** Unlocked but out of reach of the funds: dimmed. */
  readonly unaffordable?: boolean;
}

/** A build category: its title (one word) and its tools in order. */
export interface PaletteGroup {
  readonly title: string;
  readonly tools: readonly PaletteTool[];
}

export interface PaletteView {
  /** The tools that are always shown, above the categories. */
  readonly pinned: readonly PaletteTool[];
  readonly groups: readonly PaletteGroup[];
  /** The picked tool's key. */
  readonly active: string | null;
}

export interface ToolPaletteOptions {
  /** The game's list element (`.palette-scroll`). */
  readonly list: HTMLElement;
  /** The game's tab bar (`.palette-tabs`), on a page that has one. */
  readonly tabs?: HTMLElement | null;
  /** The pinned tools' header. */
  readonly pinnedTitle?: string;
  /** A press on a tool. */
  pick(tool: PaletteTool): void;
  /** The mouse pointer or the focus came to rest on a tool, or left it (null). */
  hint?(tool: PaletteTool | null): void;
  /** A category folded or opened: the list is shorter or longer. */
  folded?(): void;
  /** Where the folds are kept, and under which key. Without it nothing folds
   *  across visits. */
  readonly foldStore?: { readonly key: string; readonly storage: Pick<Storage, "getItem" | "setItem"> | null };
  /** Matches where the tabs show: there the sections are tab panels. */
  readonly tabMedia?: MediaQueryList | null;
  /** Matches where the tabs are one row that scrolls sideways: there the
   *  open tab is kept in view. */
  readonly stripMedia?: MediaQueryList | null;
}

/** A category's tab and panel ids. */
export const tabId = (title: string): string => `pal-tab-${title.toLowerCase()}`;
export const panelId = (title: string): string => `pal-panel-${title.toLowerCase()}`;
/** The id of a tool's description. */
export const descriptionId = (key: string): string => `pal-desc-${key}`;

export class ToolPalette {
  private view: PaletteView = { pinned: [], groups: [], active: null };
  private open: string | null = null;
  private readonly folds: Set<string>;
  private readonly news = new PaletteNews();
  private readonly keys = new Map<string, PressKeys>();
  private readonly mediaWatch: (() => void)[] = [];
  private shownKey = "";

  constructor(private readonly options: ToolPaletteOptions) {
    const store = options.foldStore;
    this.folds = store ? loadFolded(store.key, store.storage) : new Set();
    for (const [mq, onChange] of [
      [options.tabMedia, () => this.draw()],
      [options.stripMedia, () => this.revealOpenTab()],
    ] as const) {
      if (!mq) continue;
      mq.addEventListener("change", onChange);
      this.mediaWatch.push(() => mq.removeEventListener("change", onChange));
    }
  }

  /** Show the tools as they stand. Answers whether a tool came into view or
   *  left it (one unlocked or locked), so the game can refit the window. */
  update(view: PaletteView): boolean {
    this.view = view;
    const groups = shownGroups(view.groups);
    this.open = this.options.tabs ? validOpen(groups, this.open) : null;
    this.news.note(view.groups, this.open);
    const shown = view.groups.map((g) => g.tools.map((t) => (t.locked ? "" : t.key)).join(",")).join("|");
    const changed = shown !== this.shownKey;
    this.shownKey = shown;
    this.draw();
    return changed;
  }

  /** The category whose tab is open, on a page with tabs. */
  openGroup(): string | null {
    return this.open;
  }

  /** Open the category `title` on the tab bar: its pip goes, the list starts
   *  at its first tool, and a tab bar that scrolls brings its tab into view.
   *  A category with no tool shown, or a page with no tabs, keeps the tab
   *  that is open. */
  openTab(title: string): void {
    const tabs = this.options.tabs;
    if (!tabs || !shownGroups(this.view.groups).some((g) => g.title === title)) return;
    this.open = title;
    this.news.opened(title);
    this.draw();
    const scroller = this.options.list.querySelector<HTMLElement>(".pal-groups");
    if (scroller) {
      scroller.scrollLeft = 0;
      scroller.scrollTop = 0;
    }
    this.revealOpenTab();
  }

  /** Fold the category `title`, or open it if it is folded. */
  toggleFold(title: string): void {
    if (this.folds.has(title)) this.folds.delete(title);
    else this.folds.add(title);
    const store = this.options.foldStore;
    if (store) saveFolded(store.key, this.folds, store.storage);
    this.draw();
    this.options.folded?.();
  }

  /** Stop following the media queries. */
  dispose(): void {
    for (const stop of this.mediaWatch.splice(0)) stop();
  }

  private draw(): void {
    const tabsShown = !!this.options.tabs && (this.options.tabMedia?.matches ?? false);
    render(this.listTemplate(tabsShown), this.options.list);
    if (this.options.tabs) render(this.tabsTemplate(), this.options.tabs);
  }

  private pressKeysFor(id: string, press: () => void): PressKeys {
    let keys = this.keys.get(id);
    if (!keys) {
      keys = pressKeys(press);
      this.keys.set(id, keys);
    }
    return keys;
  }

  private toolTemplate(tool: PaletteTool, group?: string): TemplateResult {
    const { pick, hint } = this.options;
    const keys = this.pressKeysFor(`tool:${tool.key}`, () => pick(this.toolOf(tool.key) ?? tool));
    const enter = (e: PointerEvent) => {
      if (e.pointerType === "mouse") hint?.(tool);
    };
    const leave = (e: PointerEvent) => {
      if (e.pointerType === "mouse") hint?.(null);
    };
    // One line: a space between the spans would show in the inline layouts.
    return html`<div class=${classMap({ "pal-item": true, "pal-mod": !!tool.modern, active: this.view.active === tool.key, locked: !!tool.locked, unaffordable: !tool.locked && !!tool.unaffordable })} data-kind=${tool.attr === "kind" ? tool.key : nothing} data-tool=${tool.attr === "tool" ? tool.key : nothing} data-group=${group ?? nothing} tabindex="0" role="button" aria-label=${tool.label} aria-describedby=${descriptionId(tool.key)} @click=${() => pick(tool)} @keydown=${keys.keydown} @keyup=${keys.keyup} @blur=${() => {
      keys.blur();
      hint?.(null);
    }} @focus=${() => hint?.(tool)} @pointerenter=${enter} @pointerleave=${leave}><span class="pal-swatch" style="background: ${tool.color}"></span><span class="pal-name">${tool.icon ? iconTemplate(tool.icon, { size: 14, className: "pal-ic" }) : nothing}${tool.name}</span>${tool.cost ? html`<span class="pal-cost">${tool.cost}</span>` : nothing}<span class="pal-desc" id=${descriptionId(tool.key)} hidden>${tool.description}</span></div>`;
  }

  /** The tool under `key` in the view drawn last. */
  private toolOf(key: string): PaletteTool | undefined {
    for (const t of this.view.pinned) if (t.key === key) return t;
    for (const g of this.view.groups) for (const t of g.tools) if (t.key === key) return t;
    return undefined;
  }

  private groupTemplate(group: PaletteGroup, tabsShown: boolean): TemplateResult {
    const title = group.title;
    const folded = this.folds.has(title);
    const keys = this.pressKeysFor(`fold:${title}`, () => this.toggleFold(title));
    const classic = group.tools.filter((t) => !t.modern);
    const modern = group.tools.filter((t) => t.modern);
    const modernShown = modern.some((t) => !t.locked);
    return html`<section
      class=${classMap({ "pal-group": true, "tab-active": this.open === title, [PALETTE_FOLDED_CLASS]: folded })}
      data-group=${title}
      id=${panelId(title)}
      role=${tabsShown ? "tabpanel" : nothing}
      aria-labelledby=${tabsShown ? tabId(title) : nothing}
      ?hidden=${unlockedCount(group) === 0}
    >
      <div
        class="pal-group-title"
        data-group=${title}
        tabindex="0"
        role="button"
        aria-label=${`${title} tools`}
        aria-expanded=${folded ? "false" : "true"}
        @click=${() => this.toggleFold(title)}
        @keydown=${keys.keydown}
        @keyup=${keys.keyup}
        @blur=${keys.blur}
      >
        ${title}
      </div>
      ${repeat(
        classic,
        (t) => t.key,
        (t) => this.toolTemplate(t, title),
      )}
      ${
        modern.length > 0
          ? html`<div class="pal-group-title pal-sub" data-sub-group=${title} ?hidden=${!modernShown}>Modern</div>`
          : nothing
      }
      ${repeat(
        modern,
        (t) => t.key,
        (t) => this.toolTemplate(t, title),
      )}
    </section>`;
  }

  private listTemplate(tabsShown: boolean): TemplateResult {
    return html`<div class="pal-pinned">
        <div class="pal-group-title">${this.options.pinnedTitle ?? "Tools"}</div>
        ${repeat(
          this.view.pinned,
          (t) => t.key,
          (t) => this.toolTemplate(t),
        )}
      </div>
      <div class="pal-groups">
        ${repeat(
          this.view.groups,
          (g) => g.title,
          (g) => this.groupTemplate(g, tabsShown),
        )}
      </div>`;
  }

  private tabsTemplate(): TemplateResult {
    return html`${repeat(
      this.view.groups,
      (g) => g.title,
      (g) => {
        const selected = this.open === g.title;
        return html`<button
          type="button"
          class=${classMap({ "pal-tab": true, "has-new": this.news.has(g.title) })}
          data-group=${g.title}
          id=${tabId(g.title)}
          role="tab"
          aria-selected=${selected ? "true" : "false"}
          aria-controls=${panelId(g.title)}
          tabindex=${selected ? 0 : -1}
          ?hidden=${unlockedCount(g) === 0}
          @click=${() => this.openTab(g.title)}
          @keydown=${(e: KeyboardEvent) => this.onTabKey(g.title, e)}
        >
          ${g.title}
        </button>`;
      },
    )}`;
  }

  /** The tab list's keys: Left and Right step to the previous and next shown
   *  tab (wrapping), Home and End jump to the first and last, and the tab
   *  reached opens and takes the focus. A handled key stops here, so the
   *  arrow does not also move a cursor behind the window. */
  private onTabKey(title: string, e: KeyboardEvent): void {
    if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;
    const titles = shownGroups(this.view.groups).map((g) => g.title);
    const at = titles.indexOf(title);
    if (at < 0) return;
    let next: string | undefined;
    if (e.key === "ArrowLeft") next = titles[(at - 1 + titles.length) % titles.length];
    else if (e.key === "ArrowRight") next = titles[(at + 1) % titles.length];
    else if (e.key === "Home") next = titles[0];
    else if (e.key === "End") next = titles[titles.length - 1];
    if (next === undefined) return;
    e.preventDefault();
    e.stopPropagation();
    this.openTab(next);
    this.options.tabs?.ownerDocument.getElementById(tabId(next))?.focus();
  }

  /** Where the tabs are a sideways strip, scroll the open tab into it. Only
   *  the strip scrolls (scrollIntoView could move the page too), by whole
   *  pixels, since WebKit drops a part pixel and would leave the tab cut. */
  private revealOpenTab(): void {
    const bar = this.options.tabs;
    if (!bar || !this.open) return;
    if (this.options.stripMedia && !this.options.stripMedia.matches) return;
    const tab = bar.ownerDocument.getElementById(tabId(this.open));
    if (!tab) return;
    const strip = bar.getBoundingClientRect();
    const box = tab.getBoundingClientRect();
    if (box.width === 0 || strip.width === 0) return;
    if (box.left < strip.left) bar.scrollLeft -= Math.ceil(strip.left - box.left);
    else if (box.right > strip.right) bar.scrollLeft += Math.ceil(box.right - strip.right);
  }
}
