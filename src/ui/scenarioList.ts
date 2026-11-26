/**
 * Scenario lists: the pieces a game draws its scenarios with, and the launch
 * window that lists them as numbered rows.
 *
 * A scenario here is what the caller says it is: a title, a few facts (its
 * rules, its length), a brief, its goals with three marks each, the best
 * result kept so far (none, Goal, Better or Best) and, when it is not open
 * yet, why. The list never reads a save or a simulation; the caller works
 * the entries out and draws them again when they change.
 *
 * The same entries fill both ways in: the launch window
 * ({@link scenarioLaunchTemplate}), one large window a game can open on, and
 * the New Scenario dialog (`windows/newScenario`), a list box beside the
 * picked scenario's details. Every action is a button or a single press, so
 * nothing needs a double-click.
 *
 * The look is `styles/game/scenario-list.css`, which this module imports.
 *
 * Cost: nothing runs until a template is drawn; drawing is one pass over the
 * entries.
 */
import "../styles/game/scenario-list.css";
import { html, nothing, type TemplateResult } from "lit-html";
import { iconTemplate, type IconName } from "./icons";

/** The best result kept: 0 before a win, then Goal, Better and Best. */
export type ScenarioTier = 0 | 1 | 2 | 3;

/** The three marks' names, in order. */
export const SCENARIO_TIER_NAMES = ["Goal", "Better", "Best"] as const;

/** One mark of a goal, such as "At most 25%", and whether the best run reached it. */
export interface ScenarioMark {
  readonly text: string;
  readonly earned: boolean;
}

/** One goal: its name and its Goal, Better and Best marks, in that order. A
 *  goal with fewer marks leaves the later cells empty. */
export interface ScenarioGoal {
  readonly label: string;
  readonly marks: readonly ScenarioMark[];
}

/** One fact about a scenario, such as Rules: Classic. */
export interface ScenarioFact {
  readonly label: string;
  readonly value: string;
}

/** A scenario as the lists draw it. */
export interface ScenarioEntry {
  readonly id: string;
  readonly title: string;
  /** Such as Rules and Length; the rows join the values on one line. */
  readonly facts: readonly ScenarioFact[];
  /** The situation, a sentence or two. */
  readonly brief: string;
  readonly best: ScenarioTier;
  /** Why it is not open yet, as a sentence; null when it is open. */
  readonly locked: string | null;
  readonly goals: readonly ScenarioGoal[];
}

/** The best result in words: "Best result: Better", "Not finished yet" or "Locked". */
export function scenarioBestText(entry: Pick<ScenarioEntry, "best" | "locked">): string {
  if (entry.locked !== null) return "Locked";
  return entry.best === 0 ? "Not finished yet" : `Best result: ${SCENARIO_TIER_NAMES[entry.best - 1]}`;
}

/** The three marks as trophies, the earned ones lit, with the best mark's
 *  name beside them so the result never rests on color alone. */
export function scenarioTrophiesTemplate(entry: Pick<ScenarioEntry, "best" | "locked">): TemplateResult {
  const word = entry.best === 0 ? "Not won yet" : SCENARIO_TIER_NAMES[entry.best - 1];
  return html`<span class="scn-trophies" role="img" aria-label=${scenarioBestText(entry)}
    ><span class="scn-trophy-row" aria-hidden="true"
      >${SCENARIO_TIER_NAMES.map(
        (name, i) =>
          html`<span class=${entry.best > i ? "scn-trophy on" : "scn-trophy"} title=${name}
            >${iconTemplate("trophy", { size: 16 })}</span
          >`,
      )}</span
    ><span class="scn-trophy-word" aria-hidden="true">${word}</span></span
  >`;
}

/** The goals as a table: each goal's name, then its Goal, Better and Best
 *  marks, with a tick on each one the best run reached. */
export function scenarioGoalsTemplate(goals: readonly ScenarioGoal[]): TemplateResult {
  return html`<table class="scn-goals">
    <thead>
      <tr>
        <th scope="col"><span class="scn-hidden">Goal</span></th>
        ${SCENARIO_TIER_NAMES.map((n) => html`<th scope="col">${n}</th>`)}
      </tr>
    </thead>
    <tbody>
      ${goals.map(
        (g) =>
          html`<tr>
            <th scope="row">${g.label}</th>
            ${SCENARIO_TIER_NAMES.map((_, i) => {
              const m = g.marks[i];
              if (!m) return html`<td></td>`;
              return html`<td class=${m.earned ? "earned" : nothing}>
                <span class="scn-tick" aria-hidden="true">${m.earned ? "✓" : ""}</span>${m.text}${
                  m.earned ? html`<span class="scn-hidden"> (reached)</span>` : nothing
                }
              </td>`;
            })}
          </tr>`,
      )}
    </tbody>
  </table>`;
}

/** A scenario's details: its title, facts and best result, then the
 *  situation and the goals, or why it is not open yet. */
export function scenarioDetailsTemplate(entry: ScenarioEntry): TemplateResult {
  return html`<div class="scn-details">
    <h3 class="scn-h">${entry.title}</h3>
    <dl class="scn-facts">
      ${entry.facts.map((f) => html`<dt>${f.label}</dt><dd>${f.value}</dd>`)}
      <dt>Result</dt>
      <dd>${entry.locked === null ? scenarioTrophiesTemplate(entry) : "Locked"}</dd>
    </dl>
    ${
      entry.locked !== null
        ? html`<p class="scn-lock">${entry.locked}</p>`
        : html`<fieldset class="scn-group">
            <legend>Situation</legend>
            <p>${entry.brief}</p>
          </fieldset>
          <fieldset class="scn-group">
            <legend>Goals</legend>
            ${scenarioGoalsTemplate(entry.goals)}
          </fieldset>`
    }
  </div>`;
}

/** What the rows do. */
export interface ScenarioRowsActions {
  /** The row's Play button. */
  readonly play: (id: string) => void;
}

function row(entry: ScenarioEntry, n: number, on: ScenarioRowsActions): TemplateResult {
  const locked = entry.locked !== null;
  return html`<li class=${locked ? "scn-row locked" : "scn-row"}>
    <span class="scn-num" aria-hidden="true">${n}</span>
    <div class="scn-main">
      <div class="scn-head">
        <b class="scn-title">${entry.title}</b>
        <span class="scn-meta">${entry.facts.map((f) => f.value).join(" · ")}</span>
      </div>
      <p class="scn-brief">${locked ? entry.locked : entry.brief}</p>
    </div>
    <div class="scn-side">
      ${
        locked
          ? html`<span class="scn-locked">Locked</span>`
          : html`${scenarioTrophiesTemplate(entry)}<button
              type="button"
              class="btn primary"
              aria-label=${`Play ${entry.title}`}
              @click=${() => on.play(entry.id)}
            >
              Play
            </button>`
      }
    </div>
  </li>`;
}

/** The scenarios as numbered rows on a well, each with its brief, its
 *  trophies and a Play button, or why it is not open yet. */
export function scenarioRowsTemplate(entries: readonly ScenarioEntry[], on: ScenarioRowsActions): TemplateResult {
  return html`<ol class="scn-rows well">
    ${entries.map((e, i) => row(e, i + 1, on))}
  </ol>`;
}

/** What the launch window shows. */
export interface ScenarioLaunch {
  /** The title bar's words. */
  readonly title: string;
  /** An icon before the title (`windows/icons`). */
  readonly icon?: IconName;
  /** The heading over the rows, such as "Choose a scenario". */
  readonly heading: string;
  readonly entries: readonly ScenarioEntry[];
  /** What sits under the rows, such as a sandbox's buttons; nothing when left out. */
  readonly foot?: TemplateResult;
}

/** The launch window: one large window with a heading, the numbered rows
 *  and the caller's foot. The caller places it (over a bare desk, say). */
export function scenarioLaunchTemplate(launch: ScenarioLaunch, on: ScenarioRowsActions): TemplateResult {
  return html`<section class="win scn-launch" aria-labelledby="scn-launch-title">
    <div class="win-title">
      ${launch.icon ? iconTemplate(launch.icon, { size: 16 }) : nothing}<span id="scn-launch-title">${launch.title}</span>
    </div>
    <div class="scn-launch-body">
      <h2 class="scn-launch-h">${launch.heading}</h2>
      ${scenarioRowsTemplate(launch.entries, on)}
      ${launch.foot ? html`<div class="scn-foot">${launch.foot}</div>` : nothing}
    </div>
  </section>`;
}
