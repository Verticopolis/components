/** Test reads for the Map's Eval and Pricing views (#343 S8). */
import type { EvalTier, RenderRoomTiers, RentTier } from "../renderModel";

/** A read with one row per `[id, eval, rent]`, each room's anchor at
 *  `anchor(id)` (floor 2 and x equal to the id unless given). */
export function tiersOf(
  rows: ReadonlyArray<readonly [number, EvalTier, RentTier]>,
  anchor: (id: number) => readonly [number, number] = (id) => [2, id],
): RenderRoomTiers {
  return {
    size: rows.length,
    id: (i) => rows[i][0],
    floor: (i) => anchor(rows[i][0])[0],
    x: (i) => anchor(rows[i][0])[1],
    evalTier: (i) => rows[i][1],
    rentTier: (i) => rows[i][2],
  };
}
