/**
 * The Tower in 3D camera: orbit around a target, zoom, and pan along the
 * tower, by mouse, touch and keyboard. The camera stays in front of the back
 * wall of the lot and above the bottom of the ground cut. There is no
 * inertia or easing, so reduced motion needs nothing extra.
 *
 * | Input | Mouse and trackpad | Touch | Keyboard |
 * | Orbit | Left drag | One-finger drag | Arrow keys |
 * | Zoom | Wheel | Pinch | Plus and minus |
 * | Pan | Right drag, Shift + drag | Two-finger drag | Shift + arrows |
 * | Reset | | | Home |
 */
import type { PerspectiveCamera } from "three";

/** Where the camera looks from, as an orbit around `target`. */
export interface Orbit {
  tx: number;
  ty: number;
  tz: number;
  /** Around the vertical axis; 0 looks straight at the open front. */
  theta: number;
  /** Down from straight up; a quarter turn is level. */
  phi: number;
  radius: number;
}

/** How far the camera may go. */
export interface OrbitLimits {
  readonly minX: number;
  readonly maxX: number;
  readonly minY: number;
  readonly maxY: number;
  readonly minRadius: number;
  readonly maxRadius: number;
  /** The lowest the camera itself may sit (the bottom of the ground cut). */
  readonly floorY: number;
}

const MAX_THETA = (80 * Math.PI) / 180;
const MIN_PHI = (12 * Math.PI) / 180;
const MAX_PHI = (100 * Math.PI) / 180;

/** The camera position for an orbit. */
export function orbitPosition(o: Orbit): [number, number, number] {
  const s = Math.sin(o.phi);
  return [
    o.tx + o.radius * s * Math.sin(o.theta),
    o.ty + o.radius * Math.cos(o.phi),
    o.tz + o.radius * s * Math.cos(o.theta),
  ];
}

/** Keeps an orbit inside its limits, in place. */
export function clampOrbit(o: Orbit, l: OrbitLimits): Orbit {
  o.theta = Math.max(-MAX_THETA, Math.min(MAX_THETA, o.theta));
  o.radius = Math.max(l.minRadius, Math.min(l.maxRadius, o.radius));
  o.tx = Math.max(l.minX, Math.min(l.maxX, o.tx));
  o.ty = Math.max(l.minY, Math.min(l.maxY, o.ty));
  o.phi = Math.max(MIN_PHI, Math.min(MAX_PHI, o.phi));
  // Below level, lift the camera back above the ground cut's bottom.
  const lowest = Math.acos(Math.max(-1, Math.min(1, (l.floorY - o.ty) / o.radius)));
  if (Number.isFinite(lowest)) o.phi = Math.min(o.phi, Math.max(MIN_PHI, lowest));
  return o;
}

/** A box to fit in frame, in world units. */
export interface FrameBox {
  readonly minX: number;
  readonly maxX: number;
  readonly minY: number;
  readonly maxY: number;
}

/**
 * The opening view: a front three-quarter view with `box` (the built tower;
 * the whole lot when omitted) in frame at the camera's `aspect`.
 */
export function homeOrbit(l: OrbitLimits, fovDeg: number, aspect: number, box: FrameBox = l): Orbit {
  const w = box.maxX - box.minX;
  const h = box.maxY - box.minY;
  const half = (fovDeg * Math.PI) / 360;
  const fitH = h / 2 / Math.tan(half);
  const fitW = w / 2 / (Math.tan(half) * aspect);
  return clampOrbit(
    {
      tx: (box.minX + box.maxX) / 2,
      ty: (box.minY + box.maxY) / 2,
      tz: -3.5,
      theta: 0.5,
      phi: 1.32,
      radius: Math.max(fitH, fitW) * 1.15,
    },
    l,
  );
}

/**
 * The camera's far plane for an orbit: past the far side of the lot and its
 * surroundings from wherever the camera stands, so a wide lot seen from far
 * back (a phone held upright) never clips away.
 */
export function farPlane(o: Orbit, l: OrbitLimits): number {
  return o.radius + (l.maxX - l.minX) + (l.maxY - l.minY) + SURROUNDINGS;
}

/** How far the lot's ground, street and neighbor blocks reach past the lot. */
const SURROUNDINGS = 400;

/** Wires pointer, wheel and key input on `el` to an orbit; returns the unhook. */
export function attachOrbitInput(
  el: HTMLElement,
  orbit: () => Orbit,
  limits: () => OrbitLimits,
  onChange: () => void,
  onReset: () => void,
): () => void {
  const pointers = new Map<number, { x: number; y: number }>();
  let pinch = 0;
  const pan = (o: Orbit, dx: number, dy: number): void => {
    const k = o.radius / 600;
    o.tx -= dx * k * Math.cos(o.theta);
    o.tz += dx * k * Math.sin(o.theta);
    o.ty += dy * k;
  };
  const apply = (): void => {
    clampOrbit(orbit(), limits());
    onChange();
  };
  const down = (e: PointerEvent): void => {
    el.setPointerCapture?.(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    pinch = 0;
  };
  const move = (e: PointerEvent): void => {
    const last = pointers.get(e.pointerId);
    if (!last) return;
    const dx = e.clientX - last.x;
    const dy = e.clientY - last.y;
    last.x = e.clientX;
    last.y = e.clientY;
    const o = orbit();
    if (pointers.size >= 2) {
      const [a, b] = [...pointers.values()];
      const d = Math.hypot(a!.x - b!.x, a!.y - b!.y);
      if (pinch > 0) o.radius *= pinch / d;
      pinch = d;
      pan(o, dx / 2, dy / 2);
    } else if (e.buttons === 2 || e.shiftKey) pan(o, dx, dy);
    else {
      o.theta -= dx * 0.006;
      o.phi -= dy * 0.006;
    }
    apply();
  };
  const up = (e: PointerEvent): void => {
    pointers.delete(e.pointerId);
    pinch = 0;
  };
  const wheel = (e: WheelEvent): void => {
    e.preventDefault();
    orbit().radius *= Math.exp(e.deltaY * 0.0015);
    apply();
  };
  const key = (e: KeyboardEvent): void => {
    const o = orbit();
    const step = 0.06;
    const shift = e.shiftKey;
    switch (e.key) {
      case "ArrowLeft":
        if (shift) pan(o, -40, 0);
        else o.theta += step;
        break;
      case "ArrowRight":
        if (shift) pan(o, 40, 0);
        else o.theta -= step;
        break;
      case "ArrowUp":
        if (shift) pan(o, 0, 40);
        else o.phi -= step;
        break;
      case "ArrowDown":
        if (shift) pan(o, 0, -40);
        else o.phi += step;
        break;
      case "+":
      case "=":
        o.radius *= 0.9;
        break;
      case "-":
      case "_":
        o.radius *= 1.1;
        break;
      case "Home":
        onReset();
        e.preventDefault();
        return;
      default:
        return;
    }
    e.preventDefault();
    apply();
  };
  const menu = (e: Event): void => e.preventDefault();
  el.addEventListener("pointerdown", down);
  el.addEventListener("pointermove", move);
  el.addEventListener("pointerup", up);
  el.addEventListener("pointercancel", up);
  el.addEventListener("wheel", wheel, { passive: false });
  el.addEventListener("keydown", key);
  el.addEventListener("contextmenu", menu);
  return () => {
    el.removeEventListener("pointerdown", down);
    el.removeEventListener("pointermove", move);
    el.removeEventListener("pointerup", up);
    el.removeEventListener("pointercancel", up);
    el.removeEventListener("wheel", wheel);
    el.removeEventListener("keydown", key);
    el.removeEventListener("contextmenu", menu);
  };
}

/** Points `camera` along an orbit. */
export function placeCamera(camera: PerspectiveCamera, o: Orbit): void {
  const [x, y, z] = orbitPosition(o);
  camera.position.set(x, y, z);
  camera.lookAt(o.tx, o.ty, o.tz);
}
