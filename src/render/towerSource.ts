import type { GameMode, RenderCatalog, RenderRules } from "./renderModel";

/**
 * Each tower's source (Verticopolis/web#921): where the renderer reads the
 * tower's catalog and the engine's rules, so the values come from whichever
 * engine runs the tower. The app sets one on every tower it runs
 * (`useTowerSource`). Kept beside the tower rather than on it: nothing here is
 * saved, and the engine never reads it.
 *
 * A tower with no source set reads the fallback, which only tests and
 * hand-built towers register. With no fallback a read throws, so a shipped
 * tower whose source was never set fails loudly.
 */
export interface TowerSource {
  /** The catalog of `mode`, read once per mode and kept. */
  readonly catalog: (mode: GameMode) => RenderCatalog;
  readonly rules: RenderRules;
}

interface Handle {
  /** Null reads the fallback. */
  source: TowerSource | null;
  read: Map<GameMode, RenderCatalog>;
}

const handles = new WeakMap<object, Handle>();
let fallback: TowerSource | null = null;

function handleOf(tower: object): Handle {
  let h = handles.get(tower);
  if (!h) {
    h = { source: null, read: new Map() };
    handles.set(tower, h);
  }
  return h;
}

function sourceOf(h: Handle, what: string): TowerSource {
  const source = h.source ?? fallback;
  if (!source)
    throw new Error(
      `no source is set for this tower's ${what}: the app sets one on every tower it runs (useTowerSource)`,
    );
  return source;
}

/** The catalog of `mode` (the tower's own by default) from the tower's
 *  source, read once and kept. */
export function towerCatalog(tower: { readonly mode: GameMode }, mode: GameMode = tower.mode): RenderCatalog {
  return catalogOn(tower, mode);
}

/** The catalog of `mode` from the source set on `key` (a tower, or the engine
 *  the game holds), read once and kept. */
export function catalogOn(key: object, mode: GameMode): RenderCatalog {
  const h = handleOf(key);
  let c = h.read.get(mode);
  if (!c) {
    c = sourceOf(h, `${mode} catalog`).catalog(mode);
    h.read.set(mode, c);
  }
  return c;
}

/** The engine's rules for the tower. */
export function towerRules(tower: object): RenderRules {
  return sourceOf(handleOf(tower), "rules").rules;
}

/** Read the tower's catalog and rules from `source` from now on, or from the
 *  fallback when `source` is null. */
export function useTowerSource(tower: object, source: TowerSource | null): void {
  const h = handleOf(tower);
  h.source = source;
  h.read.clear();
}

/** The source a tower with none set reads (see the module doc): for tests and
 *  hand-built towers. */
export function useFallbackSource(source: TowerSource | null): void {
  fallback = source;
}
