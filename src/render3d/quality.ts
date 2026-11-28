/**
 * Quality tiers for the Tower in 3D. A tier is chosen when the window opens
 * and steps down one at a time, never up, when frames run long: the 90th
 * percentile frame over 20 ms for 2 seconds.
 */

export type Tier = "low" | "medium" | "high";

export interface TierSettings {
  /** The most device pixels per CSS pixel the canvas draws at. */
  readonly maxPixelRatio: number;
  /** The most people drawn. */
  readonly people: number;
}

export const TIERS: Readonly<Record<Tier, TierSettings>> = {
  low: { maxPixelRatio: 1, people: 800 },
  medium: { maxPixelRatio: 1.5, people: 2000 },
  high: { maxPixelRatio: 2, people: 2000 },
};

/** The tier a device starts on: phones low, coarse or small screens medium, the rest high. */
export function startTier(device: {
  readonly coarsePointer: boolean;
  readonly shortSide: number;
  readonly cores: number;
}): Tier {
  if (device.coarsePointer && device.shortSide < 600) return "low";
  if (device.coarsePointer || device.cores <= 4) return "medium";
  return "high";
}

/** The tier one step down, or the same tier at the bottom. */
export function stepDown(t: Tier): Tier {
  return t === "high" ? "medium" : "low";
}

const WINDOW_MS = 2000;
const LONG_FRAME_MS = 20;

/**
 * Frame times over a sliding two-second window: the percentiles the gate
 * records, and the step-down signal.
 */
export class FrameClock {
  private readonly times: number[] = [];
  private readonly stamps: number[] = [];
  private longSince = -1;

  /** Records a frame of `ms` that ended at `now`; returns whether to step down. */
  record(ms: number, now: number): boolean {
    this.times.push(ms);
    this.stamps.push(now);
    while (this.stamps.length && now - this.stamps[0]! > WINDOW_MS) {
      this.stamps.shift();
      this.times.shift();
    }
    if (this.percentile(90) > LONG_FRAME_MS) {
      if (this.longSince < 0) this.longSince = now;
      if (now - this.longSince >= WINDOW_MS) {
        this.longSince = -1;
        this.times.length = 0;
        this.stamps.length = 0;
        return true;
      }
    } else this.longSince = -1;
    return false;
  }

  /** The `p`th percentile of the window's frame times, 0 when empty. */
  percentile(p: number): number {
    if (!this.times.length) return 0;
    const sorted = [...this.times].sort((a, b) => a - b);
    return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))]!;
  }
}
