/**
 * The update box: "a newer version is ready", with what is new in it, the
 * build it is, and two buttons, Later and Update now. It is a view for the
 * shared modal (`ModalShell` from `windows/uiModal`), so it closes on the ✕,
 * Escape and a press beside it like every other dialog; a caller that reads
 * those as Later watches the dialog, as it does for any modal.
 *
 * The caller writes the words and knows the notes (from its own version
 * file); the box draws them. One release's notes stay a short list up to
 * `shortNotes` lines and go in a scrolling well past that, and the notes of
 * several skipped versions always go in the well, newest first, so a long
 * log never pushes the buttons away. Later carries `autofocus`, so the box
 * never opens with the focus inside the notes.
 *
 * The look is `styles/game/dialogs.css` (`.whatsnew`, `.build-id`).
 *
 * Cost: nothing runs until the box opens; it is drawn once.
 */
import { html, nothing, type TemplateResult } from "lit-html";
import type { MessageParagraph } from "./messageBox";
import type { ModalView } from "./uiModal";

/** One version's notes. */
export interface ReleaseNotes {
  readonly version: string;
  readonly notes: readonly string[];
}

/** What the box says. */
export interface UpdateBoxView {
  /** The title bar's words, such as "Update available". */
  readonly title: string;
  /** A bold line above the text naming what changed, such as "Game update". */
  readonly kind?: string;
  /** The paragraphs that say what Update now and Later do. */
  readonly text: readonly MessageParagraph[];
  /** The incoming version, such as "4.15.0". */
  readonly version?: string;
  /** The incoming version's own notes. */
  readonly notes: readonly string[];
  /** Every version the player skipped, newest first. Two or more (or one that
   *  is not the incoming version) are drawn as the log, in place of `notes`. */
  readonly releases?: readonly ReleaseNotes[];
  /** The version the player last saw, for the log's heading. */
  readonly since?: string;
  /** Older versions were left out of `releases`. */
  readonly more?: boolean;
  /** How many of the incoming notes show as a plain list before they go in
   *  the scrolling well. */
  readonly shortNotes: number;
  /** A link under the notes to every release's notes, opened in a new tab. */
  readonly allNotesHref?: string;
  /** Fine print at the foot, such as "Build 4.15.0 · 1a2b3c4". */
  readonly buildLines?: readonly string[];
  /** The two buttons' words; "Later" and "Update now" unless given. */
  readonly laterLabel?: string;
  readonly updateLabel?: string;
}

/** What the two buttons do. */
export interface UpdateBoxActions {
  later(): void;
  update(): void;
}

const LOG_TITLE_ID = "whatsnew-title";

/** The well a long list scrolls in, labeled by the heading above it. */
function well(heading: string, content: TemplateResult): TemplateResult {
  return html`<div class="whatsnew"><h3 class="win-title sm" id=${LOG_TITLE_ID}>${heading}</h3><div
      class="well whatsnew-log"
      tabindex="0"
      role="region"
      aria-labelledby=${LOG_TITLE_ID}
    >${content}</div></div>`;
}

const list = (notes: readonly string[]) => html`<ul>${notes.map((n) => html`<li>${n}</li>`)}</ul>`;

/** The skipped versions' log, or undefined when only the incoming version's
 *  notes are there to show. */
function skippedLog(view: UpdateBoxView): TemplateResult | undefined {
  const releases = view.releases ?? [];
  const several = releases.length >= 2 || (releases.length === 1 && releases[0].version !== view.version);
  if (!several) return undefined;
  const heading = view.since ? `What's new since ${view.since}` : "What's new";
  return well(
    heading,
    html`${releases.map((r) => html`<h4 class="whatsnew-ver">${r.version}</h4>${list(r.notes)}`)}${
      view.more ? html`<p class="whatsnew-more">Earlier updates are not listed here.</p>` : nothing
    }`,
  );
}

/** The incoming version's notes: a short list, or the well when long. */
function incomingNotes(view: UpdateBoxView): TemplateResult | typeof nothing {
  if (view.notes.length === 0) return nothing;
  if (view.notes.length <= view.shortNotes)
    return html`<div class="whatsnew"><h3 class="win-title sm">What's new</h3>${list(view.notes)}</div>`;
  return well("What's new", list(view.notes));
}

/** The "All release notes" link. */
function allNotesLink(href: string): TemplateResult {
  return html`<p class="whatsnew-all"><a href=${href} target="_blank" rel="noopener noreferrer" data-act="release-notes">All release notes<span class="visually-hidden"> (opens in a new tab)</span></a></p>`;
}

/** The box as a view for `ModalShell.open`. */
export function updateBoxView(view: UpdateBoxView, actions: UpdateBoxActions): ModalView {
  const notes = skippedLog(view) ?? incomingNotes(view);
  const link = notes !== nothing && view.allNotesHref ? allNotesLink(view.allNotesHref) : nothing;
  const kind = view.kind ? html`<p class="update-kind"><strong>${view.kind}</strong></p>` : nothing;
  return {
    title: view.title,
    body: html`
      ${kind} ${view.text.map((p) => html`<p>${p}</p>`)} ${notes} ${link}
      ${(view.buildLines ?? []).map((line) => html`<p class="build-id">${line}</p>`)}
      <div class="modal-actions modal-footer">
        <button type="button" class="btn" data-act="later" autofocus @click=${() => actions.later()}>${view.laterLabel ?? "Later"}</button>
        <button type="button" class="btn primary" data-act="update" @click=${() => actions.update()}>${view.updateLabel ?? "Update now"}</button>
      </div>
    `,
  };
}
