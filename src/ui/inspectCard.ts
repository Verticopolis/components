import { html, nothing, type TemplateResult } from "lit-html";
import type { FacilityKind, RenderCatalog, UnitState } from "../render/renderModel";
import { catalogFacility, catalogOpenAt } from "../render/catalogIndex";
import { isCommercialKind, isElevatorKind } from "../presentation/viewKinds";
import { floorTag } from "./format";

/**
 * The inspect card: the small window that names the facility under the
 * pointer (or under a long-press) and says how it is doing. These are its
 * bodies, pure functions of the facility's facts, the catalog and the hour.
 * The game hands over the facts its simulation reports and the problem lines
 * it words from them (`lines`); the card draws the rest. See
 * `inspectPanel.ts` for the window that shows them and keeps a closed card
 * closed.
 */

/** A room's facts, as the game's simulation reports them. */
export interface InspectUnit {
  readonly kind: FacilityKind;
  readonly floor: number;
  readonly state: UnitState;
  readonly satisfaction: number;
  /** The people inside a tenant room. */
  readonly occupants: number;
  /** The customers inside a shop or venue now, or null. */
  readonly customersIn: number | null;
  /** The household a room carries, when its kind sizes its own. */
  readonly residents: number | null;
  /** An office's workers still on their way in, or null. */
  readonly workersComing: number | null;
  /** The player's name for the room; the catalog name when never renamed. */
  readonly label: string;
  /** A shop's specific name ("Chinese Cafe"), or null. */
  readonly subtype: string | null;
  /** Why a room on notice is leaving, or null. */
  readonly vacateReason: string | null;
}

/** A shaft's facts, as the game's simulation reports them. */
export interface InspectTransport {
  readonly kind: FacilityKind;
  readonly bottom: number;
  readonly top: number;
  readonly cars: number;
}

/** What a card's title bar carries besides the title. */
export interface InspectCardOptions {
  /** The ✕, shown where the card has no hover-away to dismiss it (coarse
   *  pointers; the styles hide it elsewhere and on a long-press peek). */
  readonly close?: () => void;
}

/** The states a room is rented in. */
const TENANTED: ReadonlySet<UnitState> = new Set<UnitState>(["occupied", "vacating"]);

/** A state in plain words, where the bare state would read as jargon. */
export function statusText(u: Pick<InspectUnit, "state" | "vacateReason">): string {
  switch (u.state) {
    case "vacating":
      return u.vacateReason === "relocation" ? "on notice (household relocating)" : "on notice (tenant leaving)";
    case "dirty":
      return "dirty (awaiting housekeeping)";
    case "infested":
      return "cockroach infested";
    case "asleep":
      return "occupied (guest asleep)";
    default:
      return u.state;
  }
}

/** The people a tenant room counts against its full count, with an office's
 *  workers still on their way in ("4/6, 2 on the way"). */
export function occupantsText(occupants: number, full: number, workersComing: number | null): string {
  const coming = workersComing !== null && workersComing > 0 ? `, ${workersComing} on the way` : "";
  return `${occupants}/${full}${coming}`;
}

/** A passenger elevator's average load as a card line, red near capacity.
 *  `advises` adds the fix to the warning (a mode that advises fixes). No
 *  reading (a service elevator, stairs, escalators) adds no line. */
export function loadLines(load: number | null | undefined, near: boolean, advises: boolean): TemplateResult[] {
  if (load === undefined || load === null || !Number.isFinite(load)) return [];
  const fix = advises ? "; consider more cars or a parallel shaft" : "";
  return [
    html`<div style="color:${near ? "var(--bad)" : "var(--good)"}">Avg load: ${Math.round(load * 100)}% full${
      near ? `. Near capacity${fix}.` : ""
    }</div>`,
  ];
}

function closeX(close: (() => void) | undefined): TemplateResult | typeof nothing {
  if (!close) return nothing;
  return html`<button type="button" class="insp-close btn xs" aria-label="Close" @click=${close}>✕</button>`;
}

/** A room's card: its title, floor, status, people, the game's problem lines
 *  and its satisfaction. */
export function unitCardTemplate(
  u: InspectUnit,
  catalog: RenderCatalog,
  hour: number,
  lines: readonly TemplateResult[],
  opts: InspectCardOptions = {},
): TemplateResult {
  const f = catalogFacility(catalog, u.kind);
  const title = u.subtype ?? f.name;
  // A label shows only as a real rename, never repeating the title.
  const labelIsExtra = u.label !== f.name && u.label !== title;
  // Shops and venues count their live customers, closed or not; tenant rooms
  // count the people inside against the room's full count.
  const closed = TENANTED.has(u.state) && !catalogOpenAt(f, hour);
  let people: TemplateResult | typeof nothing = nothing;
  if ((isCommercialKind(u.kind) && f.population > 0) || f.attendance !== null) {
    people = html`<div>Customers: ${u.customersIn ?? 0}${closed ? " (closed)" : ""}</div>`;
  } else if (f.population) {
    const full = f.ownHousehold === true && u.residents != null ? u.residents : f.population;
    people = html`<div>Occupants: ${occupantsText(u.occupants, full, u.workersComing)}</div>`;
  }
  const label = labelIsExtra ? html`${u.label}<br />` : nothing;
  const floor = u.floor >= 1 ? `Floor ${u.floor}` : `B${1 - u.floor}`;
  const satisfaction = `Satisfaction: ${Math.round(u.satisfaction * 100)}%`;
  return html`<h4 class="win-title">${title}${closeX(opts.close)}</h4><div>${label}${floor}</div><div>Status: ${statusText(
    u,
  )}</div>${people}${lines}<div>${satisfaction}</div>`;
}

/** A shaft's card: its name, the floors it serves, an elevator's cars and
 *  the game's lines (its load). */
export function transportCardTemplate(
  t: InspectTransport,
  catalog: RenderCatalog,
  lines: readonly TemplateResult[],
  opts: InspectCardOptions = {},
): TemplateResult {
  const f = catalogFacility(catalog, t.kind);
  return html`<h4 class="win-title">${f.name}${closeX(opts.close)}</h4><div>Serves floors ${floorTag(t.bottom)}–${floorTag(
    t.top,
  )}</div>${isElevatorKind(t.kind) ? html`<div>Cars: ${t.cars}</div>` : nothing}${lines}`;
}

/** The card a refused build shows in the same window. */
export function refusalCardTemplate(reason: string, opts: InspectCardOptions = {}): TemplateResult {
  return html`<h4 class="win-title">Can't build here${closeX(opts.close)}</h4><div class="preview-refuse">${reason}</div>`;
}
