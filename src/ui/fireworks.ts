/**
 * Pixel fireworks: a short show of rockets and bursts on a low-resolution
 * canvas scaled up without smoothing, the chunky 1990s pixel. A game sets it
 * off behind a dialog to celebrate something, such as a new version's
 * welcome. The canvas goes first inside the element the caller names (the
 * shared modal's `#modal` dialog), so it sits under the dialog's box and over
 * its dimmed backdrop; `styles/game/launch-fireworks.css` places it there.
 *
 * New rockets go up only for the first {@link LAUNCH_WINDOW_MS}, so the sky
 * clears on its own and the frame loop stops. With reduced motion on, one
 * still frame of bursts shows and nothing animates. The show never touches
 * anything outside its canvas; when it plays and how it is remembered are the
 * caller's.
 *
 * Cost: each frame steps and paints at most {@link MAX_SPARKS} sparks and the
 * few rockets in the air, and allocates only the sparks a new burst adds; the
 * loop ends once the sky is empty, the canvas leaves the page, or `stop` is
 * called.
 */
import { html } from "lit-html";
import { renderDetached } from "./detached";

/** New rockets go up only during this opening stretch, so the sky clears. */
export const LAUNCH_WINDOW_MS = 5_500;
/** One canvas pixel is this many CSS pixels: the chunky 1990s pixel. */
export const PIXEL = 4;
/** Live sparks never exceed this, however long a frame stalls. */
export const MAX_SPARKS = 480;
/** Sparks per burst. */
export const SPARKS_PER_BURST = 40;
/** Gravity, in canvas pixels per second squared. */
const GRAVITY = 42;
/** Time between rockets, in milliseconds. */
const LAUNCH_EVERY_MS = 300;
/** A frame step never exceeds this, so a stalled tab does not jump. */
const MAX_STEP_S = 0.05;

/** The burst colors: amber and cream plus four period brights. */
export const FIREWORK_COLORS = ["#ffc94a", "#e6dcc0", "#ff5050", "#50e0ff", "#ff6ad5", "#7cff6a"] as const;

/** A rocket on its way up. */
export interface Rocket {
  x: number;
  y: number;
  vy: number;
  /** The height it bursts at. */
  burstY: number;
  color: string;
}

/** One spark of a burst. */
export interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Seconds left; it starts near 1.4. */
  life: number;
  color: string;
}

/** The whole sky at one moment. */
export interface Sky {
  width: number;
  height: number;
  /** Milliseconds since the show began. */
  elapsedMs: number;
  /** Milliseconds since the last rocket went up. */
  sinceLaunchMs: number;
  rockets: Rocket[];
  sparks: Spark[];
}

/** An empty sky of `width` by `height` canvas pixels, ready for the first rocket. */
export function newSky(width: number, height: number): Sky {
  return { width, height, elapsedMs: 0, sinceLaunchMs: LAUNCH_EVERY_MS, rockets: [], sparks: [] };
}

/** Add one burst of sparks at (x, y), up to {@link MAX_SPARKS} live. */
export function burst(sky: Sky, x: number, y: number, color: string, rand: () => number): void {
  const room = Math.min(SPARKS_PER_BURST, MAX_SPARKS - sky.sparks.length);
  const speed = Math.min(sky.width, sky.height) * 0.3;
  for (let i = 0; i < room; i++) {
    const angle = (i / SPARKS_PER_BURST) * Math.PI * 2;
    // A spread of speeds fills the burst in, a chrysanthemum rather than a ring.
    const v = speed * (0.3 + rand() * 0.7);
    sky.sparks.push({ x, y, vx: Math.cos(angle) * v, vy: Math.sin(angle) * v, life: 1.1 + rand() * 0.4, color });
  }
}

/**
 * Advance the sky by `dtMs` (clamped, so a stalled tab does not jump): launch
 * a rocket on schedule during the launch window, lift rockets until they
 * burst, and age, move and drop sparks.
 */
export function stepSky(sky: Sky, dtMs: number, rand: () => number): void {
  const dt = Math.min(dtMs / 1000, MAX_STEP_S);
  sky.elapsedMs += dt * 1000;
  sky.sinceLaunchMs += dt * 1000;
  if (sky.elapsedMs <= LAUNCH_WINDOW_MS && sky.sinceLaunchMs >= LAUNCH_EVERY_MS) {
    sky.sinceLaunchMs = 0;
    sky.rockets.push({
      x: sky.width * (0.15 + rand() * 0.7),
      y: sky.height,
      vy: -sky.height * (0.85 + rand() * 0.2),
      burstY: sky.height * (0.15 + rand() * 0.35),
      color: FIREWORK_COLORS[Math.floor(rand() * FIREWORK_COLORS.length)] ?? FIREWORK_COLORS[0],
    });
  }
  // Both lists compact in place (a write index), so a frame allocates only
  // the sparks a burst adds.
  let keptRockets = 0;
  for (const r of sky.rockets) {
    r.y += r.vy * dt;
    if (r.y <= r.burstY) burst(sky, r.x, r.y, r.color, rand);
    else sky.rockets[keptRockets++] = r;
  }
  sky.rockets.length = keptRockets;
  let keptSparks = 0;
  for (const s of sky.sparks) {
    s.life -= dt;
    if (s.life <= 0) continue;
    s.vy += GRAVITY * dt;
    s.vx *= 0.985;
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    sky.sparks[keptSparks++] = s;
  }
  sky.sparks.length = keptSparks;
}

/** The sky is past its launch window with nothing left in the air. */
export function skyDone(sky: Sky): boolean {
  return sky.elapsedMs > LAUNCH_WINDOW_MS && sky.rockets.length === 0 && sky.sparks.length === 0;
}

/** A small fixed-seed generator, so the still frame is the same every time. */
function steadyRand(seed: number): () => number {
  let state = seed * 2_654_435_761;
  return () => {
    state = (Math.imul(state, 1_103_515_245) + 12_345) >>> 0;
    return state / 0x1_0000_0000;
  };
}

/** The still frame reduced motion shows: four bursts, laid out by hand. */
export function stillSky(width: number, height: number): Sky {
  const sky = newSky(width, height);
  const spots: Array<[number, number]> = [
    [0.2, 0.3],
    [0.45, 0.18],
    [0.7, 0.32],
    [0.86, 0.16],
  ];
  spots.forEach(([fx, fy], i) => {
    const color = FIREWORK_COLORS[i % FIREWORK_COLORS.length] ?? FIREWORK_COLORS[0];
    burst(sky, width * fx, height * fy, color, steadyRand(i + 1));
  });
  // Spread each burst into its ring, as it looks a moment after it pops.
  for (const s of sky.sparks) {
    s.x += s.vx * 0.35;
    s.y += s.vy * 0.35;
  }
  return sky;
}

/** Paint the sky: one canvas pixel per spark (a dim trail pixel behind each
 *  rocket), fading to half strength as the spark dies. */
export function drawSky(ctx: CanvasRenderingContext2D, sky: Sky): void {
  ctx.clearRect(0, 0, sky.width, sky.height);
  for (const r of sky.rockets) {
    ctx.fillStyle = r.color;
    ctx.fillRect(Math.round(r.x), Math.round(r.y), 1, 2);
  }
  for (const s of sky.sparks) {
    ctx.globalAlpha = s.life > 0.5 ? 1 : 0.5;
    ctx.fillStyle = s.color;
    ctx.fillRect(Math.round(s.x), Math.round(s.y), 1, 1);
  }
  ctx.globalAlpha = 1;
}

/** How a show plays. */
export interface FireworksOptions {
  /** One still frame, and nothing animates. */
  readonly reducedMotion: boolean;
  /** The screen's size in CSS pixels; the canvas is a {@link PIXEL}th of it. */
  readonly width: number;
  readonly height: number;
  readonly rand?: () => number;
  readonly raf?: (cb: FrameRequestCallback) => number;
}

/** A show that is playing. */
export interface Fireworks {
  /** The show's canvas. */
  readonly canvas: HTMLCanvasElement;
  /** End the show and take its canvas off the page. */
  stop(): void;
}

/** Set the fireworks off as the first child of `host`. */
export function playFireworks(doc: Document, host: Element, opts: FireworksOptions): Fireworks {
  const rand = opts.rand ?? Math.random;
  const raf = opts.raf ?? ((cb: FrameRequestCallback) => requestAnimationFrame(cb));
  const width = Math.max(1, Math.ceil(opts.width / PIXEL));
  const height = Math.max(1, Math.ceil(opts.height / PIXEL));
  const drawn = renderDetached(
    doc,
    html`<canvas class="launch-fireworks-sky" aria-hidden="true" width=${width} height=${height}></canvas>`,
  );
  const canvas = drawn.elements[0] as HTMLCanvasElement;
  host.prepend(canvas);
  let stopped = false;
  const show: Fireworks = {
    canvas,
    stop: () => {
      stopped = true;
      canvas.remove();
    },
  };
  const ctx = canvas.getContext("2d");
  if (!ctx) return show;
  ctx.imageSmoothingEnabled = false;
  if (opts.reducedMotion) {
    drawSky(ctx, stillSky(width, height));
    return show;
  }
  const sky = newSky(width, height);
  let last = -1;
  const tick = (now: number): void => {
    // The caller stopped it, or its host took the canvas off the page.
    if (stopped || !canvas.isConnected) return;
    stepSky(sky, last < 0 ? 0 : now - last, rand);
    last = now;
    drawSky(ctx, sky);
    if (!skyDone(sky)) raf(tick);
  };
  raf(tick);
  return show;
}
