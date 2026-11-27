/**
 * Stairs and escalators of the Tower in 3D: a flight of real steps from the
 * lower landing on one side of its tiles to the upper landing on the other,
 * the run the side view draws (`sprites/transport.ts`, `sprites/escalator.ts`)
 * and its climbers follow (`climbPath.ts`), in the side view's colors. A
 * flight over more than one story turns back each story.
 */
import type { RenderTransport } from "../render/renderModel";
import { RUN_FOOT_PX, RUN_HEAD_PX } from "../render/climbPath";
import { TILE } from "../render/scale";
import { BoxWriter, FACE } from "./boxWriter";
import type { Rgb } from "./looks3d";

/** The depth a flight's steps span, as shares of the room's depth from the open front. */
export const FLIGHT_NEAR = 0.44;
export const FLIGHT_FAR = 0.8;

interface FlightLook {
  readonly steps: number;
  readonly body: Rgb;
  readonly tread: Rgb;
  readonly rail: Rgb;
  /** The side panels an escalator's handrail runs on; stairs have posts. */
  readonly panel: Rgb | null;
}

const STAIRS: FlightLook = { steps: 6, body: [138, 116, 84], tread: [237, 230, 210], rail: [90, 62, 40], panel: null };
const ESCALATOR: FlightLook = {
  steps: 10,
  body: [110, 116, 124],
  tread: [154, 160, 168],
  rail: [26, 29, 36],
  panel: [138, 142, 150],
};
/** A tread's thickness, and the stringer under it. */
const TREAD = 0.08;
const BODY = 0.45;
const RAIL_H = 1.0;
const RAIL_T = 0.1;

/**
 * Writes flight `t`'s steps for its stories in floors `f0` to `f1` (a band's
 * share), each story rising `story` units from floor height `yAt(floor)`,
 * between depths `-depth * FLIGHT_FAR` and `-depth * FLIGHT_NEAR`.
 */
export function writeFlight(
  solid: BoxWriter,
  t: RenderTransport,
  f0: number,
  f1: number,
  yAt: (floor: number) => number,
  story: number,
  depth: number,
): void {
  const look = t.kind === "escalator" ? ESCALATOR : STAIRS;
  const foot = t.x + RUN_FOOT_PX / TILE;
  const head = t.x + t.width - RUN_HEAD_PX / TILE;
  const run = (head - foot) / look.steps;
  const rise = story / look.steps;
  const zFar = -depth * FLIGHT_FAR;
  const zNear = -depth * FLIGHT_NEAR;
  for (let fl = Math.max(f0, t.bottom); fl <= Math.min(f1, t.top - 1); fl++) {
    const rightward = (fl - t.bottom) % 2 === 0;
    const base = yAt(fl);
    for (let i = 0; i < look.steps; i++) {
      const a = rightward ? foot + i * run : head - (i + 1) * run;
      const top = base + (i + 1) * rise;
      solid.box(a, top - rise - BODY, zFar, a + run, top - TREAD, zNear, look.body, FACE.back);
      solid.box(a, top - TREAD, zFar, a + run, top, zNear, look.tread, FACE.back);
      // The handrail on the open side, on posts (stairs) or a side panel (escalator).
      const railY = top + RAIL_H;
      solid.box(a, railY, zNear - RAIL_T, a + run, railY + RAIL_T, zNear, look.rail, 0);
      if (look.panel) {
        for (const z of [zNear - 0.05, zFar]) solid.box(a, top, z, a + run, railY, z + 0.05, look.panel, FACE.back);
      } else if (i % 2 === 0) solid.box(a, top, zNear - RAIL_T, a + RAIL_T, railY, zNear, look.rail, FACE.back);
    }
  }
}
