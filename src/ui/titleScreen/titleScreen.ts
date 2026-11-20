/**
 * The game's title screen ("Metropolis Dusk"): an art-deco skyline and a
 * setting sun under an indigo to coral dusk sky, the VERTICO/POLIS wordmark
 * and its tagline, a premise line, a column of buttons, and the small print
 * in the corners. The caller hands in everything a game says or does here:
 * the premise, the buttons, the small print, and the optional mute, install
 * and sponsor corners. The caller renders the template into its own `#splash`
 * container, which `styles/game/splash.css` styles.
 *
 * The wordmark and tagline are SVG `<text>` with `textLength`, so they fit
 * any screen with no web font. The sky, sun and skyline are decorative
 * (`aria-hidden`); the two lettering SVGs carry `role="img"` and a label.
 *
 * Whitespace: no whitespace goes inside a `<text>` or `<tspan>` (it would
 * shift the fitted lettering) or inside a button (it would change its text).
 * The whitespace between elements is harmless because the container and
 * `.splash-actions` are flex and the lettering is block.
 */
import { html, nothing, svg, type TemplateResult } from "lit-html";
import "../../styles/game/splash.css";
import { iconTemplate, type IconName } from "../icons";
import {
  SKYLINE_BUILDINGS,
  SKYLINE_VIEWBOX,
  SKYLINE_WINDOWS,
  SKYLINE_WINDOW_COLOR,
  SKYLINE_WINDOW_SIZE,
} from "./titleSkyline";

/** One of the title screen's buttons. */
export interface TitleAction {
  /** Its `data-splash` code: "continue", "load", "new", "help". */
  readonly id: string;
  readonly label: string;
  readonly icon?: IconName;
  /** "primary" is the one amber plate and "ghost" the quiet one; absent, the
   *  button wears the plain plate. */
  readonly look?: "primary" | "ghost";
  onPress(): void;
}

/** The mute toggle in the top-right corner. Its name stays the same, and
 *  `aria-pressed` carries the state, as a toggle button's does. */
export interface TitleMute {
  readonly muted: boolean;
  /** "Mute sound". */
  readonly label: string;
  /** Without one the button draws but does nothing. */
  readonly onToggle?: (e: Event) => void;
}

/** The install button beside the mute. */
export interface TitleInstall {
  /** The words beside its glyph: "Install". */
  readonly label: string;
  /** Its accessible name: "Install Verticopolis". */
  readonly name: string;
  /** Its tooltip. */
  readonly title: string;
  onPress(): void;
}

/** The sponsor link in the top-left corner, opened in a new tab. */
export interface TitleSponsor {
  readonly href: string;
  readonly label: string;
  readonly title: string;
  /** Hears a click, a keyboard Enter, or a middle-click (an `auxclick` with
   *  any other button, a right-click among them, is not heard). */
  readonly onOpen?: (e: MouseEvent) => void;
}

export interface TitleScreenView {
  /** The line under the tagline. */
  readonly premise?: string;
  /** The buttons, top to bottom (also their Tab order). */
  readonly actions: readonly TitleAction[];
  /** The small print along the bottom. */
  readonly attribution?: string;
  /** The version line in the bottom-right corner. */
  readonly version?: string;
  /** A small gold badge in the bottom-left corner. */
  readonly badge?: string;
  readonly mute?: TitleMute;
  readonly install?: TitleInstall;
  readonly sponsor?: TitleSponsor;
}

/** The dusk sky, the stars, the sun and the skyline. */
export function titleSceneTemplate(): TemplateResult {
  return html`<div class="splash-stars" aria-hidden="true"></div>
    <div class="splash-sun" aria-hidden="true"></div>
    <svg class="splash-skyline" aria-hidden="true" viewBox=${SKYLINE_VIEWBOX} preserveAspectRatio="xMidYMax slice">
      <g class="buildings" stroke-width="1">${SKYLINE_BUILDINGS.map((d) => svg`<path d=${d} />`)}</g>
      <g fill=${SKYLINE_WINDOW_COLOR}>${SKYLINE_WINDOWS.map(
        ([x, y]) => svg`<rect x=${x} y=${y} width=${SKYLINE_WINDOW_SIZE.width} height=${SKYLINE_WINDOW_SIZE.height} />`,
      )}</g>
    </svg>`;
}

/** The VERTICO/POLIS wordmark and the tagline under it. */
export function wordmarkTemplate(): TemplateResult {
  return html`<svg class="splash-word" viewBox="0 0 400 66" role="img" aria-label="Verticopolis">
      <text x="194" y="52" text-anchor="middle" textLength="380" lengthAdjust="spacingAndGlyphs"><tspan class="a">VERTICO</tspan><tspan class="b">POLIS</tspan></text><text class="tm" x="386" y="24">™</text>
    </svg>
    <svg class="splash-tag" viewBox="0 0 360 20" role="img" aria-label="the vertical metropolis">
      <text x="180" y="15" text-anchor="middle" textLength="330" lengthAdjust="spacingAndGlyphs">THE VERTICAL METROPOLIS</text>
    </svg>`;
}

function actionButton(a: TitleAction): TemplateResult {
  const cls = a.look ? `splash-btn ${a.look}` : "splash-btn";
  return html`<button class=${cls} data-splash=${a.id} @click=${() => a.onPress()}>${a.icon ? iconTemplate(a.icon, { size: 14 }) : nothing}${a.label}</button>`;
}

/** A middle-click opens the sponsor link in a new tab; a right-click or any
 *  other button's `auxclick` opens nothing, so it is not heard. */
function middleClick(e: MouseEvent, sponsor: TitleSponsor): void {
  if (e.button === 1) sponsor.onOpen?.(e);
}

/** The whole title screen. The corners come last, so the reading and Tab
 *  order runs title, premise, buttons, then the corners. */
export function titleScreenTemplate(v: TitleScreenView): TemplateResult {
  const { mute, install, sponsor } = v;
  return html`${titleSceneTemplate()}
    <div class="splash-brand">
      ${wordmarkTemplate()}
      ${v.premise ? html`<p class="splash-premise">${v.premise}</p>` : nothing}
    </div>
    <div class="splash-actions">${v.actions.map(actionButton)}</div>
    ${v.attribution ? html`<p class="splash-attrib">${v.attribution}</p>` : nothing}
    ${v.version ? html`<p class="splash-version">${v.version}</p>` : nothing}
    ${v.badge ? html`<p class="splash-founder">${v.badge}</p>` : nothing}
    ${mute ? html`<button class="splash-mute" data-splash="mute" aria-pressed=${mute.muted ? "true" : "false"} aria-label=${mute.label} @click=${mute.onToggle}>${iconTemplate(mute.muted ? "mute" : "sound", { size: 16 })}</button>` : nothing}
    ${install ? html`<button class="splash-install" data-splash="install" aria-label=${install.name} title=${install.title} @click=${() => install.onPress()}>${iconTemplate("install", { size: 14 })}${install.label}</button>` : nothing}
    ${sponsor ? html`<a class="splash-sponsor" data-splash="sponsor" href=${sponsor.href} target="_blank" rel="noopener noreferrer" title=${sponsor.title} @click=${sponsor.onOpen} @auxclick=${(e: MouseEvent) => middleClick(e, sponsor)}>${iconTemplate("heart", { size: 14 })}${sponsor.label}</a>` : nothing}`;
}
