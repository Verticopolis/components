import type * as ex from "excalibur";

/**
 * Tearing down an Excalibur engine whose clock is already stopped.
 *
 * `Engine.dispose()` runs `stop()`, and `stop()` does nothing unless the clock
 * runs. The renderer stops the clock on its own in two places: the
 * context-loss handler (`TowerEngine.ts`, which now calls the public
 * `Engine.stop()`, so it stops the texture collector too) and the screen
 * saver's frame hold (`frameHold.ts`, which stops only the clock). A context
 * lost during a hold therefore reaches `dispose()` with the collector still
 * running, and its `requestIdleCallback` loop would keep the dead engine alive
 * for the rest of the page.
 *
 * Excalibur 1.0 has no public way to stop the collector, so this reaches its
 * private `_garbageCollector`. `engineTeardown.test.ts` builds a real
 * Excalibur engine and checks the collector stops, so an Excalibur upgrade
 * that renames or reshapes the field fails that test instead of leaking.
 */

interface CollectorHandle {
  readonly isRunning: boolean;
  stop(): void;
}

/** The engine's texture collector, or `undefined` when this Excalibur
 *  version does not have one where 1.0 keeps it. */
export function textureCollector(engine: ex.Engine): CollectorHandle | undefined {
  const gc = (engine as unknown as { _garbageCollector?: Partial<CollectorHandle> })._garbageCollector;
  return gc && typeof gc.stop === "function" ? (gc as CollectorHandle) : undefined;
}

/** Stop the texture collector and the browser listeners, then dispose. Each
 *  step is idempotent, so a running engine (whose `dispose()` stops both
 *  itself) tears down the same way. Safe on a lost context: GL calls on one
 *  are no-ops. */
export function teardownEngine(engine: ex.Engine): void {
  textureCollector(engine)?.stop();
  engine.browser.clear();
  engine.dispose();
}
