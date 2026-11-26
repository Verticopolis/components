import { html, nothing, type TemplateResult } from "lit-html";
import type { FacilityKind, RenderCatalog } from "../render/renderModel";
import { catalogFacility } from "../render/catalogIndex";
import { editorActionRow, editorCardTemplate, editorFact } from "./editorCard";
import { floorTag, groupDigits } from "./format";

/**
 * The shaft's editor card: its floors, an elevator's cars, capacity and
 * stops, and the buttons the game offers (cars, schedule, extend, sell). A
 * pure function of the shaft's facts, the catalog and the game's options;
 * each button calls the game's `act` with its action, and the game runs the
 * command. The rules stay the game's: it words the stops line and says which
 * offered buttons are off.
 */

/** A button the card can carry. */
export type ShaftEditAction = "removecar" | "addcar" | "schedule" | "extendDown" | "extendUp" | "sell";

/** A shaft's facts, as the game's simulation reports them. */
export interface ShaftEditorFacts {
  readonly id: number;
  readonly kind: FacilityKind;
  readonly bottom: number;
  readonly top: number;
  readonly cars: number;
  /** Riders per trip. */
  readonly capacity: number;
}

/** What the game gives the card besides the facts. */
export interface ShaftEditorOptions {
  /** The buttons the game offers. The car, schedule and extend buttons show
   *  on an elevator only, since the catalog lists a car limit for no other
   *  kind. */
  readonly offers: ReadonlySet<ShaftEditAction>;
  /** Offered buttons the game turns off (`removecar` at the game's fewest
   *  cars, for one). `addcar` is also off at the catalog's car limit. */
  readonly disabled?: ReadonlySet<ShaftEditAction>;
  /** The elevator's stops line, worded by the game (its stop rules are the
   *  game's), or null to leave it out. */
  readonly stops: string | null;
  /** Runs a button's action. */
  act(action: ShaftEditAction): void;
  /** The ✕. */
  close(): void;
  /** What the player gets back for selling the shaft, or null to leave the
   *  line out. */
  readonly resale: number | null;
  /** The game's problem lines for the shaft, drawn under its facts. */
  readonly lines?: readonly TemplateResult[];
}

/** The shaft's editor card. */
export function shaftEditorTemplate(
  t: ShaftEditorFacts,
  catalog: RenderCatalog,
  opts: ShaftEditorOptions,
): TemplateResult {
  const f = catalogFacility(catalog, t.kind);
  const maxCars = f.maxCars;
  const offers = opts.offers;
  const off = opts.disabled;
  const button = (action: ShaftEditAction, label: string, atLimit = false, danger = false) =>
    html`<button type="button" class=${danger ? "btn danger" : "btn"} data-act=${action} ?disabled=${atLimit || (off?.has(action) ?? false)} @click=${() => opts.act(action)}>${label}</button>`;

  const facts: TemplateResult[] = [
    editorFact("Serves floors", `${floorTag(t.bottom)} – ${floorTag(t.top)}`, "serves"),
    editorFact("Height", `${t.top - t.bottom + 1} floors`, "height"),
  ];
  const actions: TemplateResult[] = [];
  if (maxCars !== null) {
    facts.push(editorFact("Cars", `${t.cars} / ${maxCars} max`, "cars"));
    facts.push(editorFact("Capacity", `${t.capacity} riders/trip`, "capacity"));
    if (opts.stops !== null) facts.push(editorFact("Stops", opts.stops, "stops"));
    if (offers.has("removecar") || offers.has("addcar")) {
      actions.push(
        editorActionRow(
          html`${offers.has("removecar") ? button("removecar", "– Car") : nothing}${
            offers.has("addcar") ? button("addcar", "+ Car", t.cars >= maxCars) : nothing
          }`,
        ),
      );
    }
    if (offers.has("schedule")) actions.push(editorActionRow(button("schedule", "Schedule…")));
    if (offers.has("extendDown") || offers.has("extendUp")) {
      actions.push(
        editorActionRow(
          html`${offers.has("extendDown") ? button("extendDown", "▼ Extend down") : nothing}${
            offers.has("extendUp") ? button("extendUp", "▲ Extend up") : nothing
          }`,
        ),
      );
    }
  }
  if (opts.resale !== null) facts.push(editorFact("Resale value", `$${groupDigits(opts.resale)}`));
  if (offers.has("sell")) actions.push(editorActionRow(button("sell", "Sell / Bulldoze", false, true)));

  const lines = opts.lines ?? [];
  return editorCardTemplate({
    key: `transport:${t.id}`,
    title: f.name,
    facts,
    block: lines.length ? html`<div class="ed-diagnostics" data-field="diagnostics">${lines}</div>` : nothing,
    actions,
    close: () => opts.close(),
  });
}
