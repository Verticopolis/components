/**
 * The overview MAP window's view picker (#343 S9): one dropdown under the
 * title bar, "View" and a select with one option per view in `MAP_VIEWS`. It
 * took the place of S6's tab row when the Traffic and Occupancy views brought
 * the views to six, too many for a row of text tabs on the phone card (owner,
 * 2026-11-10). It is a native select, so the browser gives it its keys, its
 * name for a screen reader and its touch picker.
 *
 * A choice made with a pointer gives focus back to what held it before the
 * press (the map, or nothing), so a mouse or touch user keeps the game's keys
 * and a focused map keeps its arrow keys. The window draws it with
 * `template()`, under its title bar.
 */
import { html, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import { DEFAULT_MAP_VIEW, MAP_VIEWS, type MapViewEntry, type MapViewId } from "../render/overviewMap/views";

/** The ids the CSS and the tests name. */
export const MAP_PICKER_DOM = {
  root: "overview-map-views",
  select: "overview-map-picker",
} as const;

export class MapViewPicker {
  private rootEl: HTMLLabelElement | null = null;
  private selectEl: HTMLSelectElement | null = null;
  private selectedView: MapViewId = DEFAULT_MAP_VIEW;
  /** A pointer press on the select is under way: what held focus before it,
   *  or undefined while no press is. */
  private focusBefore: Element | null | undefined = undefined;
  private readonly onPointerDown = () => {
    const select = this.selectEl;
    if (this.focusBefore === undefined && select)
      this.focusBefore = select.ownerDocument.activeElement === select ? null : select.ownerDocument.activeElement;
  };
  private readonly onChange = () => this.changed();
  // A press that chose nothing (the open list dismissed, or the chosen view
  // picked again) leaves focus on the select; once focus leaves it, or a key
  // is pressed on it, the press is forgotten, so the next choice from the
  // keyboard keeps focus here.
  private readonly forgetPress = () => (this.focusBefore = undefined);
  private readonly rootRef = (el: Element | undefined) => {
    this.rootEl = el instanceof HTMLLabelElement ? el : null;
  };
  private readonly selectRef = (el: Element | undefined) => {
    this.selectEl = el instanceof HTMLSelectElement ? el : null;
  };

  /** `onSelect` hears every change of view, from a pointer or a key. */
  constructor(
    private readonly onSelect: (view: MapViewId) => void,
    private readonly views: ReadonlyArray<MapViewEntry> = MAP_VIEWS,
  ) {}

  /** The dropdown: "View" and a select with one option per view. */
  template(): TemplateResult {
    return html`<label id=${MAP_PICKER_DOM.root} class="overview-map-views" ${ref(this.rootRef)}
      ><span class="overview-map-views-label">View</span
      ><select
        id=${MAP_PICKER_DOM.select}
        class="field overview-map-picker"
        .value=${this.selectedView}
        @pointerdown=${this.onPointerDown}
        @change=${this.onChange}
        @blur=${this.forgetPress}
        @keydown=${this.forgetPress}
        ${ref(this.selectRef)}
      >
        ${this.views.map(
          (view) => html`<option value=${view.id} ?selected=${view.id === this.selectedView}>${view.label}</option>`,
        )}
      </select></label
    >`;
  }

  /** The drawn label, once the window has drawn it. */
  get root(): HTMLLabelElement | null {
    return this.rootEl;
  }

  /** The drawn select, once the window has drawn it. */
  get select(): HTMLSelectElement | null {
    return this.selectEl;
  }

  /** The selected view. */
  get selected(): MapViewId {
    return this.selectedView;
  }

  private changed(): void {
    const select = this.selectEl;
    if (!select) return;
    const view = this.views.find((entry) => entry.id === select.value)?.id;
    const before = this.focusBefore;
    this.focusBefore = undefined;
    if (before !== undefined) this.giveFocusBack(select, before);
    if (!view || view === this.selectedView) return;
    this.selectedView = view;
    this.onSelect(view);
  }

  /** Focus goes back to what held it before a pointer press, when that is
   *  still on the page and can take it; otherwise the select lets go. */
  private giveFocusBack(select: HTMLSelectElement, before: Element | null): void {
    if (
      before instanceof HTMLElement &&
      before !== select &&
      before.isConnected &&
      before !== before.ownerDocument.body
    ) {
      before.focus({ preventScroll: true });
      return;
    }
    select.blur();
  }
}
