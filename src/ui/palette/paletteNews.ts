import type { PaletteGroup } from "./toolPalette";

/** How many of a category's tools are unlocked. */
export function unlockedCount(group: PaletteGroup): number {
  let n = 0;
  for (const t of group.tools) if (!t.locked) n++;
  return n;
}

/** The categories with a tool shown, in order: the others have no tab. */
export function shownGroups(groups: readonly PaletteGroup[]): PaletteGroup[] {
  return groups.filter((g) => unlockedCount(g) > 0);
}

/** `open` when it is still a shown category, else the first shown one, so a
 *  phone's tab bar never opens an empty category. */
export function validOpen(shown: readonly PaletteGroup[], open: string | null): string | null {
  return shown.some((g) => g.title === open) ? open : (shown[0]?.title ?? null);
}

/**
 * The tab bar's "new" pips: a category whose unlocked count grew since the
 * last update gets one, unless its tab is open, and keeps it until the tab
 * opens. The first update only takes the counts, so the tools a tower starts
 * with never pip.
 */
export class PaletteNews {
  private readonly counts = new Map<string, number>();
  private readonly pips = new Set<string>();

  note(groups: readonly PaletteGroup[], open: string | null): void {
    for (const g of groups) {
      const count = unlockedCount(g);
      const before = this.counts.get(g.title);
      if (before !== undefined && count > before && g.title !== open) this.pips.add(g.title);
      if (count === 0) this.pips.delete(g.title);
      this.counts.set(g.title, count);
    }
  }

  opened(title: string): void {
    this.pips.delete(title);
  }

  has(title: string): boolean {
    return this.pips.has(title);
  }
}
