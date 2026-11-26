import { render, type TemplateResult } from "lit-html";
import type { FacilityKind } from "../render/renderModel";

/**
 * The inspect card's window and its ✕ latch. The game owns the `#inspector`
 * element on its stage (the styles in `styles/game/tools-stage.css` dress it);
 * {@link InspectPanel} renders a card body there and pins it beside its
 * facility, and {@link InspectController} decides which card shows for a
 * pick and keeps a card the player closed from popping back up under the
 * pointer. The card bodies are in `inspectCard.ts`.
 */

/** A facility a card describes. */
export interface InspectTarget {
  readonly type: "unit" | "transport";
  readonly id: number;
}

/** What the pointer is over, as the scene picks it. A floor or lobby tile
 *  shows no card. */
export interface InspectPick extends InspectTarget {
  readonly kind: FacilityKind;
}

/** The world cell a card is pinned beside: the facility's right edge, its
 *  left edge and its top floor. */
export interface InspectAnchor {
  readonly x: number;
  readonly left: number;
  readonly floor: number;
}

/** A card to show: its body and where it pins. */
export interface InspectShown {
  readonly body: TemplateResult;
  readonly anchor: InspectAnchor;
}

/** A facility's on-screen rect, its top edge. */
export interface ScreenRect {
  readonly x: number;
  readonly y: number;
  readonly w: number;
}

/** The class a card takes while it holds a Help link. */
export const HAS_HELP_CLASS = "has-help";

/** Where a card of `size` goes beside `rect`: off the facility's right side,
 *  or its left when the right would push the card back over the room, then
 *  kept on screen with an 8px margin. */
export function inspectPlacement(
  rect: ScreenRect,
  size: { readonly w: number; readonly h: number },
  viewW: number,
  viewH: number,
): { left: number; top: number } {
  const gap = 8;
  let left = rect.x + rect.w + 12;
  if (left + size.w > viewW - gap) left = rect.x - size.w - 12;
  return {
    left: Math.max(gap, Math.min(left, viewW - size.w - gap)),
    top: Math.max(gap, Math.min(rect.y, viewH - size.h - gap)),
  };
}

/** The `#inspector` window: shows, hides, pins and marks a peek. */
export class InspectPanel {
  private size = { w: 0, h: 0 };

  constructor(private readonly el: HTMLElement) {}

  /** Whether a card is showing. */
  get open(): boolean {
    return !this.el.classList.contains("hidden");
  }

  /** Show a card body, or hide the window. A hidden window keeps its last
   *  card, so the next show patches it in place, and drops the peek mark. */
  show(body: TemplateResult | null): void {
    if (!body) {
      this.el.classList.add("hidden");
      this.el.classList.remove("peek");
      return;
    }
    this.el.classList.remove("hidden");
    render(body, this.el);
    this.el.classList.toggle(HAS_HELP_CLASS, this.el.querySelector("a.help-topic") !== null);
    this.size = { w: this.el.offsetWidth, h: this.el.offsetHeight };
  }

  /** Mark the card as a long-press peek: it closes when the finger lifts, so
   *  the styles hide its ✕. */
  peek(on: boolean): void {
    this.el.classList.toggle("peek", on);
  }

  /** Pin the card beside a facility's screen rect. */
  pin(rect: ScreenRect, viewW: number, viewH: number): void {
    const { left, top } = inspectPlacement(rect, this.size, viewW, viewH);
    const s = this.el.style;
    s.left = `${Math.round(left)}px`;
    s.top = `${Math.round(top)}px`;
    s.right = s.bottom = "auto";
  }

  /** Let the card fall back to its docked place. Costs nothing when it is
   *  not pinned, so a frame loop can call it every frame. */
  unpin(): void {
    const s = this.el.style;
    if (!s.left && !s.top) return;
    s.left = s.top = s.right = s.bottom = "";
  }
}

/** What the controller needs from the game. */
export interface InspectDeps {
  /** The card for a facility, or null when it shows none (gone, or a kind
   *  with no card). Read on every pick, so a swapped tower is picked up. */
  card(target: InspectTarget, fresh: boolean): InspectShown | null;
  /** Show a body, or hide the window ({@link InspectPanel.show}). */
  show(body: TemplateResult | null): void;
  /** The cell the shown card pins beside, or null; the game pins the panel
   *  to it each frame. */
  setAnchor(anchor: InspectAnchor | null): void;
}

const same = (a: InspectTarget | null, b: InspectTarget): boolean => a !== null && a.type === b.type && a.id === b.id;

/**
 * Which card shows for a pick, and the ✕ latch: a card the player closed
 * stays closed while hover picks keep landing on the same facility, and
 * through the empty or floor picks pointer jitter makes. Picking another
 * facility spends the latch, and so do a tap or a long-press (fresh intent,
 * {@link resetLatch}) and a new tower ({@link clear}).
 */
export class InspectController {
  private target: InspectTarget | null = null;
  private dismissed: InspectTarget | null = null;
  private shown: InspectPick | null = null;

  constructor(private readonly deps: InspectDeps) {}

  /** The facility the shown card describes, or null. */
  get current(): InspectTarget | null {
    return this.target;
  }

  /** Show the card for a pick, or hide it for no pick or a floor tile. */
  inspect(p: InspectPick | null): void {
    if (!p || p.kind === "floor" || p.kind === "lobby") {
      this.hide();
      return;
    }
    if (same(this.dismissed, p)) return;
    this.dismissed = null;
    const fresh = !same(this.target, p);
    const card = this.deps.card({ type: p.type, id: p.id }, fresh);
    if (!card) {
      this.hide();
      return;
    }
    this.deps.setAnchor(card.anchor);
    this.target = { type: p.type, id: p.id };
    this.shown = p;
    this.deps.show(card.body);
  }

  /** Hide the card, keeping any ✕ latch. */
  hide(): void {
    this.deps.setAnchor(null);
    this.target = null;
    this.shown = null;
    this.deps.show(null);
  }

  /** The tower changed in place (an undo or redo step): read the card again
   *  for a facility that still `stands`, hide it for one that went. */
  followStep(stands: (target: InspectTarget) => boolean): void {
    if (this.dismissed && !stands(this.dismissed)) this.dismissed = null;
    const shown = this.shown;
    if (!shown) return;
    if (stands(shown)) this.inspect(shown);
    else this.hide();
  }

  /** Hide the card and drop the latch: a new tower (ids restart) or a tap. */
  clear(): void {
    this.dismissed = null;
    this.hide();
  }

  /** The ✕: close the card and latch it closed for this facility. */
  dismiss(): void {
    this.dismissed = this.target;
    this.hide();
  }

  /** Drop the latch without hiding: a tap or long-press is fresh intent. */
  resetLatch(): void {
    this.dismissed = null;
  }
}
