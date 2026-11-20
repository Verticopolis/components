import type { GameMode, RenderWorld } from "../render/renderModel";
import { FACILITY_PRESENTATION } from "./facilityPresentation";
import type { ViewWorld } from "./viewWorld";

/** What the check reads from an engine's catalog. Kinds are plain strings:
 *  a catalog from another build may list kinds this one has no art for, and
 *  that is what the check refuses. */
export interface CheckedCatalog {
  readonly mode: GameMode;
  readonly world: Pick<RenderWorld, "lotWidth" | "minFloor" | "maxFloor"> & {
    readonly groundFloorStructure: string;
  };
  readonly facilities: readonly { readonly key: string }[];
}

/** The world fields the view is sized from (`viewWorld.ts`). */
const VIEW_WORLD_FIELDS: readonly (keyof ViewWorld)[] = ["lotWidth", "minFloor", "maxFloor"];

/** The facility kinds this build draws: the ones the UI has a color and a
 *  description for. */
const DRAWN_KINDS: ReadonlySet<string> = new Set(Object.keys(FACILITY_PRESENTATION));

/** Refuses binding catalogs this build cannot draw. Each mode's catalog must
 *  list exactly the facility kinds the UI has a color and a description for
 *  (`FACILITY_PRESENTATION`), and lay the ground floor with one of them; and
 *  the two modes must state the same lot and floor range, because the view
 *  binds one world for the page's life (`viewWorld.ts`) while a new game can
 *  change the mode. The error names the kinds or the field that differ. The
 *  check reads only what the frontend draws, so the shipped game carries
 *  none of the TypeScript engine's tables (#921). The app hands it to the
 *  engine's boot as `checkCatalogs`. */
export function refuseForeignCatalogs(catalogs: Readonly<Record<GameMode, CheckedCatalog>>): void {
  for (const c of Object.values(catalogs)) refuseUndrawnKinds(c);
  for (const field of VIEW_WORLD_FIELDS) {
    if (catalogs.classic.world[field] !== catalogs.modern.world[field]) {
      throw new Error(
        `the Rust engine's classic and modern catalogs state different worlds (${field}), and the view draws one world for the page`,
      );
    }
  }
}

/** Refuses a catalog that lists other kinds than this build draws, or lays
 *  the ground floor with one it does not. `readCatalog` already refuses a
 *  kind listed twice. */
function refuseUndrawnKinds(c: CheckedCatalog): void {
  const keys = c.facilities.map((f) => f.key);
  const listed = new Set<string>(keys);
  const extra = keys.filter((k) => !DRAWN_KINDS.has(k));
  const missing = [...DRAWN_KINDS].filter((k) => !listed.has(k));
  if (extra.length > 0 || missing.length > 0) {
    const parts = [
      extra.length > 0 ? `unknown ${extra.join(", ")}` : "",
      missing.length > 0 ? `missing ${missing.join(", ")}` : "",
    ];
    throw new Error(
      `the Rust engine's ${c.mode} catalog lists other facility kinds than this build draws (${parts.filter(Boolean).join("; ")})`,
    );
  }
  if (!DRAWN_KINDS.has(c.world.groundFloorStructure)) {
    throw new Error(
      `the Rust engine's ${c.mode} catalog lays the ground floor with a kind this build does not draw (${c.world.groundFloorStructure})`,
    );
  }
}
