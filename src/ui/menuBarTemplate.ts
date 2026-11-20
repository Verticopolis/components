/**
 * The Win95 menu bar's markup as a lit template, drawn from a plain model:
 * the bar, its titles, their menus, and the items, separators and submenus
 * inside them. {@link MenuBar} renders it and binds its own handlers to the
 * titles and popups, so a page that uses the model writes no menu markup and
 * wires no element listeners of its own.
 *
 * The markup is the one `styles/menu-bar.css` styles and the one pages wrote
 * by hand before: a `.mb-menu` per title, a `.mb-title` button with
 * `aria-controls` naming its `.mb-pop`, `.mb-item` buttons (or links) inside,
 * `.mb-sep` rules, and a `.mb-sub` holding a `.mb-sub-title` and its
 * `.mb-subpop`.
 *
 * Cost: rendered once, and again only when the page calls
 * {@link MenuBar.render} with a changed model (as a menu opens, say). Nothing
 * runs per frame.
 */
import { html, nothing, type TemplateResult } from "lit-html";
import { Directive, directive, type ElementPart } from "lit-html/directive.js";
import { ifDefined } from "lit-html/directives/if-defined.js";
import { repeat } from "lit-html/directives/repeat.js";

/** A label with one underlined character, as a 1995 menu shows the key that
 *  picks it. `mnemonic` is the index of that character in `label`. */
interface Labelled {
  readonly label: string;
  /** Index of the underlined character in `label`; none when left out. */
  readonly mnemonic?: number;
}

/** What every entry of a menu may carry for the page's own wiring. */
interface EntryBase {
  readonly id?: string;
  /** Classes added after the entry's own (`mb-desktop-only`, say). */
  readonly className?: string;
  readonly hidden?: boolean;
  /** `data-*` attributes, keyed without the `data-` prefix. */
  readonly data?: Readonly<Record<string, string>>;
}

/** An item the player picks. */
export interface MenuItemModel extends EntryBase, Labelled {
  readonly kind?: "item";
  /** The keyboard shortcut shown at the item's right edge (`Ctrl+S`). */
  readonly shortcut?: string;
  /** A check box item when set: its `aria-checked`. */
  readonly checked?: boolean;
  /** With `checked`, one of a group that only one may hold (a radio item). */
  readonly radio?: boolean;
  /** Grayed out: shown, never picked. */
  readonly disabled?: boolean;
  /** A link item (`<a>`) going here; a button otherwise. */
  readonly href?: string;
  readonly target?: string;
  readonly rel?: string;
  /** Runs on the item's click, before the bar closes the menu. */
  readonly onPick?: (e: MouseEvent) => void;
  /** The tooltip over the item (its `title`). */
  readonly title?: string;
  /** Drawn in place of the underlined label when set, for a line with parts
   *  of its own (a recent file's number and name, say). */
  readonly content?: TemplateResult;
}

/** A line between groups of items. */
export interface MenuSeparatorModel extends EntryBase {
  readonly kind: "separator";
}

/** An item that opens a submenu beside it (File > Open Recent). */
export interface SubmenuModel extends EntryBase, Labelled {
  readonly kind: "submenu";
  /** The submenu title's id; required, since it names its popup. */
  readonly id: string;
  /** The popup's id; `<id>-menu` when left out. */
  readonly popupId?: string;
  /** Grayed out: the submenu never opens. */
  readonly disabled?: boolean;
  readonly items: readonly (MenuItemModel | MenuSeparatorModel)[];
}

/** Any entry of a top-level menu. */
export type MenuEntryModel = MenuItemModel | MenuSeparatorModel | SubmenuModel;

/** A title on the bar and its menu. */
export interface MenuModel extends Labelled {
  /** The title's id; it names the menu's popup. */
  readonly id: string;
  /** The popup's id; `<id>-menu` when left out. */
  readonly popupId?: string;
  /** Classes added to the `.mb-menu` wrapper (`mb-desk-only`, say). */
  readonly className?: string;
  /** Hides the whole menu, title and all (the title screen's tower menus). */
  readonly hidden?: boolean;
  readonly items: readonly MenuEntryModel[];
}

/** The whole bar. */
export interface MenuBarModel {
  /** The `<nav>`'s id. */
  readonly id?: string;
  /** The `<nav>`'s accessible name ("Game menu"). */
  readonly label: string;
  /** Classes added after `menubar`. */
  readonly className?: string;
  /** Draws the app icon at the bar's left (`.menubar-brand`). */
  readonly brand?: boolean;
  readonly menus: readonly MenuModel[];
}

/** The handlers the bar binds to each title and popup. They are the same
 *  functions on every render, so lit never swaps a listener. */
export interface MenuBarHandlers {
  readonly titleClick: (e: MouseEvent) => void;
  readonly titlePointerEnter: (e: PointerEvent) => void;
  readonly titleKeyDown: (e: KeyboardEvent) => void;
  readonly menuKeyDown: (e: KeyboardEvent) => void;
  readonly menuClick: (e: MouseEvent) => void;
  readonly menuPointerDown: (e: PointerEvent) => void;
  readonly menuPointerOver: (e: PointerEvent) => void;
}

/** The popup id a title or submenu title controls. */
export const popupIdOf = (m: { readonly id: string; readonly popupId?: string }): string => m.popupId ?? `${m.id}-menu`;

const classes = (own: string, extra?: string) => (extra ? `${own} ${extra}` : own);

/** `label` with its mnemonic character underlined. */
export function labelTemplate({ label, mnemonic }: Labelled): TemplateResult | string {
  if (mnemonic === undefined || mnemonic < 0 || mnemonic >= label.length) return label;
  return html`${label.slice(0, mnemonic)}<u>${label[mnemonic]}</u>${label.slice(mnemonic + 1)}`;
}

/** Sets each `data` entry as a `data-*` attribute on the element it sits on,
 *  and takes off any a later render dropped. */
class DataAttrs extends Directive {
  private keys: readonly string[] = [];
  render(_data: EntryBase["data"]) {
    return nothing;
  }
  override update(part: ElementPart, [data]: [EntryBase["data"]]) {
    const next = data ?? {};
    for (const k of this.keys) if (!(k in next)) part.element.removeAttribute(`data-${k}`);
    for (const [k, v] of Object.entries(next)) part.element.setAttribute(`data-${k}`, v);
    this.keys = Object.keys(next);
    return nothing;
  }
}
const dataAttrs = directive(DataAttrs);

function separatorTemplate(s: MenuSeparatorModel): TemplateResult {
  return html`<hr class=${classes("mb-sep", s.className)} id=${ifDefined(s.id)} ?hidden=${!!s.hidden} />`;
}

/** An item's click handler: its `onPick`, and none while it is grayed, so
 *  neither a click nor its underlined key runs it. */
const pickOf = (item: MenuItemModel) => (item.disabled ? nothing : (item.onPick ?? nothing));

/** A checked item's role: one of a group, or a check box of its own. */
const checkRole = (item: MenuItemModel) => (item.radio ? "menuitemradio" : "menuitemcheckbox");

function itemTemplate(item: MenuItemModel): TemplateResult {
  const role = item.checked === undefined ? "menuitem" : checkRole(item);
  const checked = item.checked === undefined ? nothing : String(item.checked);
  const disabled = item.disabled ? "true" : nothing;
  const content = html`${item.content ?? labelTemplate(item)}${item.shortcut ? html`<kbd>${item.shortcut}</kbd>` : nothing}`;
  if (item.href !== undefined) {
    return html`<a
      role=${role}
      class=${classes("mb-item", item.className)}
      id=${ifDefined(item.id)}
      href=${item.href}
      target=${ifDefined(item.target)}
      rel=${ifDefined(item.rel)}
      title=${ifDefined(item.title)}
      aria-checked=${checked}
      aria-disabled=${disabled}
      ?hidden=${!!item.hidden}
      @click=${pickOf(item)}
      ${dataAttrs(item.data)}
      >${content}</a
    >`;
  }
  return html`<button
    type="button"
    role=${role}
    class=${classes("mb-item", item.className)}
    id=${ifDefined(item.id)}
    title=${ifDefined(item.title)}
    aria-checked=${checked}
    aria-disabled=${disabled}
    ?hidden=${!!item.hidden}
    @click=${pickOf(item)}
    ${dataAttrs(item.data)}
  >${content}</button>`;
}

function submenuTemplate(sub: SubmenuModel): TemplateResult {
  const popup = popupIdOf(sub);
  return html`<div class=${classes("mb-sub", sub.className)} role="none" ?hidden=${!!sub.hidden}>
    <button
      type="button"
      role="menuitem"
      class="mb-item mb-sub-title"
      id=${sub.id}
      aria-haspopup="menu"
      aria-expanded="false"
      aria-controls=${popup}
      aria-disabled=${sub.disabled ? "true" : nothing}
    >${labelTemplate(sub)}</button>
    <div class="mb-pop mb-subpop" id=${popup} role="menu" aria-labelledby=${sub.id} hidden>
      ${sub.items.map(entryTemplate)}
    </div>
  </div>`;
}

function entryTemplate(entry: MenuEntryModel): TemplateResult {
  if (entry.kind === "separator") return separatorTemplate(entry);
  if (entry.kind === "submenu") return submenuTemplate(entry);
  return itemTemplate(entry);
}

function menuTemplate(menu: MenuModel, on: MenuBarHandlers): TemplateResult {
  const popup = popupIdOf(menu);
  return html`<div class=${classes("mb-menu", menu.className)} ?hidden=${!!menu.hidden}>
    <button
      type="button"
      class="mb-title"
      id=${menu.id}
      aria-haspopup="menu"
      aria-expanded="false"
      aria-controls=${popup}
      @click=${on.titleClick}
      @pointerenter=${on.titlePointerEnter}
      @keydown=${on.titleKeyDown}
    >${labelTemplate(menu)}</button>
    <div
      class="mb-pop"
      id=${popup}
      role="menu"
      aria-labelledby=${menu.id}
      hidden
      @keydown=${on.menuKeyDown}
      @click=${on.menuClick}
      @pointerdown=${on.menuPointerDown}
      @pointerover=${on.menuPointerOver}
    >
      ${menu.items.map(entryTemplate)}
    </div>
  </div>`;
}

/** The menu bar for `model`, with `on` bound to its titles and popups. */
export function menuBarTemplate(model: MenuBarModel, on: MenuBarHandlers): TemplateResult {
  return html`<nav id=${ifDefined(model.id)} class=${classes("menubar", model.className)} aria-label=${model.label}>
    ${model.brand ? html`<span class="menubar-brand" aria-hidden="true"></span>` : nothing}
    ${repeat(
      model.menus,
      (m) => m.id,
      (m) => menuTemplate(m, on),
    )}
  </nav>`;
}
