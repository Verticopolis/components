import { html, nothing, type TemplateResult } from "lit-html";
import type { FacilityKind, RenderCatalog } from "../render/renderModel";
import { catalogFacility } from "../render/catalogIndex";
import { editorActionRow, editorCardTemplate, editorFact } from "./editorCard";
import { floorTag, groupDigits } from "./format";

/**
 * The shaft's editor card: its floors, an elevator's cars, capacity and
 * stops, and the buttons the game offers (cars, schedule, extend, sell). A
 * pure function of the shaft's facts and the catalog; each button calls the
 * game's `act` with its action, and the game runs the command.
 */

/** A button the card can carry. */
export type ShaftEditAction = "removecar" | "addcar" | "schedule" | "extendDown" | "extendUp" | "sell";

/** One floor of an elevator's run, as the game's simulation reports it. */
export interface ShaftStop {
  readonly floor: number;
  /** Whether the cars stop there. */
  readonly served: boolean;
  /** Whether the floor is a lobby. */
  readonly lobby: boolean;
}

/** A shaft's facts, as the game's simulation reports them. */
export interface ShaftEditorFacts {
  readonly id: number;
  readonly kind: FacilityKind;
  readonly bottom: number;
  readonly top: number;
  readonly cars: number;
  /** Riders per trip. */
  readonly capacity: number;
  /** Every floor of an elevator's run; empty for stairs and escalators. */
  readonly stops: readonly ShaftStop[];
}

/** What the game gives the card besides the facts. */
export interface ShaftEditorOptions {
  /** The buttons the game offers. The car, schedule and extend buttons show
   *  on an elevator only, since the catalog lists a car limit for no other
   *  kind. */
  readonly offers: ReadonlySet<ShaftEditAction>;
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

/** True below the ground lobby (floor 1): B1 is floor 0. */
const isBasement = (floor: number): boolean => floor < 1;

/** The stops line. An express stops at the lobbies and at every basement
 *  floor it passes (the 1994 rule), so it reads a fixed policy, counting any
 *  of those the player turned off; other elevators count the floors they
 *  skip. */
export function stopsText(kind: FacilityKind, stops: readonly ShaftStop[]): string {
  if (kind === "elevatorExpress") {
    const policy = stops.some((s) => isBasement(s.floor)) ? "lobbies and basements" : "lobbies and sky lobbies";
    const skipped = stops.filter((s) => !s.served && (s.lobby || isBasement(s.floor))).length;
    return skipped ? `${policy} (${skipped} skipped)` : policy;
  }
  const skipped = stops.filter((s) => !s.served).length;
  return skipped ? `skips ${skipped} floor${skipped === 1 ? "" : "s"}` : "all floors";
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
  const button = (action: ShaftEditAction, label: string, disabled = false, danger = false) =>
    html`<button type="button" class=${danger ? "btn danger" : "btn"} data-act=${action} ?disabled=${disabled} @click=${() => opts.act(action)}>${label}</button>`;

  const facts: TemplateResult[] = [
    editorFact("Serves floors", `${floorTag(t.bottom)} – ${floorTag(t.top)}`, "serves"),
    editorFact("Height", `${t.top - t.bottom + 1} floors`, "height"),
  ];
  const actions: TemplateResult[] = [];
  if (maxCars !== null) {
    facts.push(editorFact("Cars", `${t.cars} / ${maxCars} max`, "cars"));
    facts.push(editorFact("Capacity", `${t.capacity} riders/trip`, "capacity"));
    facts.push(editorFact("Stops", stopsText(t.kind, t.stops), "stops"));
    if (offers.has("removecar") || offers.has("addcar")) {
      actions.push(
        editorActionRow(
          html`${offers.has("removecar") ? button("removecar", "– Car", t.cars <= 1) : nothing}${
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
    close: opts.close,
  });
}
