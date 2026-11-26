import { html, nothing, type TemplateResult } from "lit-html";
import { keyed } from "lit-html/directives/keyed.js";

/**
 * The editor card's frame: the window a game opens on the facility the player
 * picked, with a title bar and its ✕, a grid of facts, an optional block of
 * problem lines and rows of action buttons. The game renders it into its
 * `#editor` element (the styles in `styles/game/editor-sidebar.css` dress
 * it). The bodies are built from these pieces, the shaft's in
 * `shaftEditor.ts`.
 */

/** One fact in the card's grid. `field` marks a cell that carries a live
 *  value, for tests and tools. */
export function editorFact(label: string | TemplateResult, value: unknown, field?: string): TemplateResult {
  return html`<span class="k">${label}</span><span class="v" data-field=${field ?? nothing}>${value}</span>`;
}

/** One row of the card's action buttons. */
export function editorActionRow(inner: TemplateResult): TemplateResult {
  return html`<div class="ed-row">${inner}</div>`;
}

/** What makes up an editor card. */
export interface EditorCard {
  /** The facility the card describes (`unit:7`, `transport:3`): a new key
   *  draws the card afresh, so no input or button carries over from the last
   *  facility. */
  readonly key: string;
  readonly title: string;
  readonly facts: readonly TemplateResult[];
  /** A full-width block under the facts (the problem lines), or nothing. */
  readonly block?: TemplateResult | typeof nothing;
  readonly actions: readonly TemplateResult[];
  /** The ✕ in the title bar. */
  close(): void;
}

/** The editor card. */
export function editorCardTemplate(card: EditorCard): TemplateResult {
  const close = html`<button type="button" class="btn xs" aria-label="Close" @click=${() => card.close()}>✕</button>`;
  const body = html`<h4 class="win-title">${card.title}${close}</h4><div class="ed-stats kv">${card.facts}</div>`;
  return html`${keyed(card.key, html`${body}${card.block ?? nothing}${card.actions}`)}`;
}
