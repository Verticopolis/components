/**
 * The New Scenario dialog: a list box of scenarios on the left, the picked
 * one's details on the right, and Play and Cancel along the foot, as File >
 * New Game… worked in a 1994 program. It is a view for the shared modal
 * (`ModalShell` from `windows/uiModal`), drawn from the same entries as the
 * launch window (`windows/scenarioList`).
 *
 * The caller holds the state: which entry is picked. A press on a row, or the
 * arrow keys, Home and End in the list, ask the caller to pick; the caller
 * redraws with `ModalShell.render`, and the picked row scrolls into view
 * when the list scrolls. Enter in the list and the Play button
 * play the picked entry; a double-click on a row does the same, but the
 * button is always there, so nothing needs one.
 *
 * Entries the caller lists first (`lead`, such as a sandbox) carry their own
 * details, drawn by the caller.
 *
 * Cost: one pass over the entries per draw.
 */
import { html, nothing, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import { iconTemplate, type IconName } from "./icons";
import { scenarioDetailsTemplate, scenarioTrophiesTemplate, type ScenarioEntry } from "./scenarioList";
import type { ModalView } from "./uiModal";

/** An entry listed before the scenarios, with the caller's own details. */
export interface ScenarioLead {
  readonly id: string;
  readonly title: string;
  /** A word or two beside the title in the list, such as "Sandbox". */
  readonly note: string;
  readonly details: TemplateResult;
}

/** What the dialog shows. */
export interface NewScenario {
  /** The title bar's words; "New Scenario" unless given. */
  readonly title?: string;
  /** An icon before the title; the folder unless given. */
  readonly icon?: IconName;
  readonly lead?: readonly ScenarioLead[];
  readonly entries: readonly ScenarioEntry[];
  /** The picked entry's id: a lead's or a scenario's. */
  readonly picked: string;
}

/** What the dialog does. */
export interface NewScenarioActions {
  readonly pick: (id: string) => void;
  /** Play the picked entry. */
  readonly play: () => void;
  readonly cancel: () => void;
}

/** The option's element id, for the list's active descendant. */
const optionId = (id: string) => `sl-opt-${id}`;

/** Whether the picked entry can be played: a lead, or an open scenario. */
export function newScenarioCanPlay(state: NewScenario): boolean {
  if (state.lead?.some((l) => l.id === state.picked)) return true;
  const entry = state.entries.find((e) => e.id === state.picked);
  return entry !== undefined && entry.locked === null;
}

/** The entries' ids in list order. */
function ids(state: NewScenario): string[] {
  return [...(state.lead ?? []).map((l) => l.id), ...state.entries.map((e) => e.id)];
}

/** The id a list key moves to, or null for a key the list does not take. */
export function newScenarioKeyTarget(state: NewScenario, key: string): string | null {
  const all = ids(state);
  if (all.length === 0) return null;
  const at = all.indexOf(state.picked);
  switch (key) {
    case "ArrowDown":
      return at < 0 ? all[0]! : all[Math.min(all.length - 1, at + 1)]!;
    case "ArrowUp":
      return at < 0 ? all[0]! : all[Math.max(0, at - 1)]!;
    case "Home":
      return all[0]!;
    case "End":
      return all[all.length - 1]!;
    default:
      return null;
  }
}

/** Keep the picked row in view when a key moves the pick in a list that scrolls. */
const scrollNear = (el?: Element) => el?.scrollIntoView?.({ block: "nearest" });
const leave = () => {};

function option(
  id: string,
  title: string,
  side: TemplateResult,
  picked: boolean,
  playable: boolean,
  on: NewScenarioActions,
): TemplateResult {
  return html`<li
    id=${optionId(id)}
    class=${picked ? "sl-option selected" : "sl-option"}
    role="option"
    aria-selected=${picked ? "true" : "false"}
    ${ref(picked ? scrollNear : leave)}
    @click=${() => on.pick(id)}
    @dblclick=${() => {
      on.pick(id);
      if (playable) on.play();
    }}
  >
    <span class="sl-option-name">${title}</span>${side}
  </li>`;
}

/** The dialog as a view for `ModalShell.open` and `ModalShell.render`. */
export function newScenarioView(state: NewScenario, on: NewScenarioActions): ModalView {
  const canPlay = newScenarioCanPlay(state);
  const lead = state.lead ?? [];
  const leadPicked = lead.find((l) => l.id === state.picked);
  const entryPicked = state.entries.find((e) => e.id === state.picked);
  let details: TemplateResult | typeof nothing = nothing;
  if (leadPicked)
    details = html`<div class="sl-details"><h3 class="sl-h">${leadPicked.title}</h3>${leadPicked.details}</div>`;
  else if (entryPicked) details = scenarioDetailsTemplate(entryPicked);
  const keys = (ev: KeyboardEvent) => {
    if (ev.key === "Enter") {
      ev.preventDefault();
      if (canPlay) on.play();
      return;
    }
    const to = newScenarioKeyTarget(state, ev.key);
    if (to === null) return;
    ev.preventDefault();
    if (to !== state.picked) on.pick(to);
  };
  const active = ids(state).includes(state.picked) ? optionId(state.picked) : nothing;
  return {
    title: html`${iconTemplate(state.icon ?? "folder", { size: 16 })}${state.title ?? "New Scenario"}`,
    body: html`<div class="sl-dialog">
        <ul
          class="sl-listbox well"
          role="listbox"
          aria-label="Scenarios"
          tabindex="0"
          aria-activedescendant=${active}
          @keydown=${keys}
        >
          ${lead.map((l) =>
            option(l.id, l.title, html`<span class="sl-note">${l.note}</span>`, l.id === state.picked, true, on),
          )}
          ${state.entries.map((e) =>
            option(
              e.id,
              e.title,
              e.locked === null ? scenarioTrophiesTemplate(e) : html`<span class="sl-note">Locked</span>`,
              e.id === state.picked,
              e.locked === null,
              on,
            ),
          )}
        </ul>
        <div class="sl-pane">${details}</div>
      </div>
      <div class="modal-actions modal-footer">
        <button type="button" class="btn primary" data-act="play" ?disabled=${!canPlay} @click=${on.play}>
          Play
        </button>
        <button type="button" class="btn" data-act="cancel" @click=${on.cancel}>Cancel</button>
      </div>`,
  };
}
