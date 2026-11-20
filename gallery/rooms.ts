/**
 * The gallery's room cells: one per kind and one per named variant, each
 * posed the way a player would most often see it. A room with business hours
 * is drawn at an hour it is open, and a room that fills with visitors holds a
 * busy but readable crowd instead of its full capacity.
 */
import type { FacilityKind, RenderFacility } from "../lib/render/renderModel.js";
import { drawRoomPortrait } from "../lib/render/roomPortrait.js";
import type { DrawCtx } from "../lib/render/sprites.js";

/** The evening hour every cell is drawn at when the room is open then. */
export const GALLERY_HOUR = 19;

/** The share of a visitor room's capacity the gallery shows inside it. */
const VISITOR_SHARE = 0.3;

/** At most one visitor per this many columns of room, so a narrow shop shows
 *  a few browsers spread out instead of a crowd at its door. */
const COLUMNS_PER_VISITOR = 4;

/** Sprite magnification, a whole multiple so world pixels stay square blocks. */
const MAG = 3;

/** Kinds drawn as the tower's structure rather than as a room. */
const STRUCTURE = new Set<FacilityKind>(["lobby", "floor"]);

export interface RoomCell {
  label: string;
  /** The hour this cell is drawn at. */
  hour: number;
  draw(d: DrawCtx, w: number, h: number): void;
}

/** `GALLERY_HOUR` when the room is open then, else the open hour nearest to
 *  it (the later one on a tie), so no cell shows a closed shutter. */
export function openHourFor(f: Pick<RenderFacility, "openHours">): number {
  const hours = f.openHours;
  if (!hours || hours[GALLERY_HOUR]) return GALLERY_HOUR;
  for (let step = 1; step <= 12; step++) {
    const later = (GALLERY_HOUR + step) % 24;
    if (hours[later]) return later;
    const earlier = (GALLERY_HOUR - step + 24) % 24;
    if (hours[earlier]) return earlier;
  }
  return GALLERY_HOUR;
}

/** How many people the cell shows. Homes, hotel rooms and offices show their
 *  full household or staff. A room that fills with visitors (a shop, a
 *  restaurant, a venue with a show) shows a share of its capacity, capped by
 *  its width, so its furniture stays in view. */
export function galleryOccupants(f: RenderFacility): number {
  const capacity = f.population > 0 ? f.population : (f.attendance ?? 0);
  const visitors = f.commercial || f.leaseAmenity || (f.population === 0 && capacity > 0);
  if (!visitors) return capacity;
  const share = Math.round(capacity * VISITOR_SHARE);
  return Math.max(1, Math.min(share, Math.floor(f.width / COLUMNS_PER_VISITOR)));
}

/** Every room in the catalog, in its own order, with each named variant after
 *  its base kind. Lobbies, bare floors and shafts are left to the scenes
 *  (`scenes.ts`), which show them across several floors. */
export function roomCells(facilities: readonly RenderFacility[]): RoomCell[] {
  const byKey = new Map(facilities.map((f) => [f.key, f]));
  const facts = (kind: FacilityKind): RenderFacility => {
    const f = byKey.get(kind);
    if (!f) throw new Error(`The gallery's catalog has no ${kind}.`);
    return f;
  };
  return facilities.flatMap((f): RoomCell[] => {
    const kind = f.key;
    if (f.transport || STRUCTURE.has(kind)) return [];
    const hour = openHourFor(f);
    const occupants = galleryOccupants(f);
    const cell = (label: string, subtype?: string): RoomCell => ({
      label,
      hour,
      draw: (d, w, h) =>
        drawRoomPortrait(d, facts, kind, { state: "occupied", occupants, subtype }, 0, 0, w, h, 0, MAG),
    });
    return [cell(f.name), ...(f.subtypes ?? []).map((name) => cell(`${f.name}: ${name}`, name))];
  });
}
