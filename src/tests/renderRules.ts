import type { RenderRules, UnitState } from "../render/renderModel";

/**
 * The rules the tests hand the renderer in place of a game's: people are in a
 * room that is settled, asleep, moving in or on notice, and a room runs unless
 * it is being built, burning or burned out. The zoom limits are the tests' own.
 */
const PRESENT: ReadonlySet<UnitState> = new Set(["occupied", "asleep", "moving_in", "vacating"]);
const INERT: ReadonlySet<UnitState> = new Set(["construction", "fire", "gutted"]);

export const TEST_ZOOM = { min: 0.06, max: 3 } as const;

export const testRules: RenderRules = {
  isPresent: (unit) => PRESENT.has(unit.state),
  isOperational: (unit) => !INERT.has(unit.state),
  viewZoom: TEST_ZOOM,
};
