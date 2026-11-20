import { html, nothing, type SVGTemplateResult, type TemplateResult } from "lit-html";
import { classMap } from "lit-html/directives/class-map.js";
import "../../styles/game/file-dialog.css";
import type { ModalShell } from "../uiModal";
import { fileSizeText } from "./fileDialogTemplate";
import type { FileNote } from "./fileDialogTypes";
import { fileIcon } from "./fileIcons";

/**
 * Previous Versions: the earlier versions a folder keeps of one file, newest
 * first, from right-click > Previous versions… in the Open and Save As
 * windows. The window takes the place of the one it was opened from, the way
 * Windows' own Previous Versions does, and closing it (Cancel, the ✕, Esc or
 * a click beside it) puts that window back as the player left it. Open hands
 * the picked version to the caller; what it does with it (a new file beside
 * the old one) is the caller's.
 */

/** One earlier version of the file. */
export interface FileVersion {
  /** Where its bytes are kept. */
  readonly key: string;
  /** When the file held these bytes, in milliseconds since 1970. */
  readonly at: number;
  readonly size: number;
  /** How it came to be, for the How column: "Saved by you", "Autosaved". */
  readonly how: string;
}

export interface VersionsCtx {
  /** The file's name. */
  readonly name: string;
  /** Its versions, newest first. */
  readonly versions: readonly FileVersion[];
  /** The mark each row's file icon shows (`fileIcons.ts`). */
  readonly mark: SVGTemplateResult;
  /** The line above the list: what Open does. */
  readonly intro: string;
  /** The list's line when there are no versions yet. */
  readonly empty: string;
  /** Open version `v`. A note says why it couldn't; null once opened (the
   *  caller closes the window). */
  open(v: FileVersion): Promise<FileNote | null>;
  /** Put back the window this one was opened from. Without it, closing
   *  this window closes it. */
  back?(): void;
}

/** When a version was written, the way Windows lists one: "Today, 3:04 PM". */
export function versionWhen(at: number, now = Date.now()): string {
  const d = new Date(at);
  const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  const day = new Date(now);
  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (sameDay(d, day)) return `Today, ${time}`;
  day.setDate(day.getDate() - 1);
  if (sameDay(d, day)) return `Yesterday, ${time}`;
  return `${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}, ${time}`;
}

const TITLE = "Previous Versions";

/** Open the Previous Versions window in `shell`. */
export function showVersionsDialog(shell: ModalShell, ctx: VersionsCtx): void {
  const state = { selected: ctx.versions[0]?.key ?? null, busy: false, line: null as FileNote | null };
  const picked = () => ctx.versions.find((v) => v.key === state.selected) ?? null;
  // Every way out but Open goes back to the window this one came from. Not
  // while a version is opening: that closes this window on its own.
  const dismiss = (): void => {
    if (state.busy) return;
    if (ctx.back) ctx.back();
    else shell.close();
  };

  async function open(v: FileVersion | null): Promise<void> {
    if (!v || state.busy) return;
    state.busy = true;
    draw();
    const note = await ctx.open(v);
    state.busy = false;
    // Opened: the window closed as the file came in.
    if (!note) return;
    state.line = note;
    draw();
  }

  const handlers: VersionsHandlers = {
    select: (key) => {
      state.selected = key;
      draw();
    },
    open,
    cancel: dismiss,
    picked,
  };
  const body = () => versionsTemplate(ctx, state, handlers);
  const box = shell.open({ title: TITLE, body: body() });
  function draw(): void {
    if (box.isConnected) shell.render({ title: TITLE, body: body() });
  }
  // Esc and the ✕. A browser may refuse to keep the dialog open on an Esc
  // with no click or key since the last one it kept; that Esc closes.
  const dialog = shell.dialog;
  dialog.oncancel = (e) => {
    if (!e.cancelable) return shell.close();
    e.preventDefault();
    dismiss();
  };
  // A click beside the window.
  dialog.onclick = (e) => {
    if (e.target === dialog) dismiss();
  };
  box.querySelector<HTMLElement>(".pv-row.selected")?.focus();
}

interface VersionsHandlers {
  select(key: string): void;
  open(v: FileVersion | null): void;
  cancel(): void;
  picked(): FileVersion | null;
}

function versionsTemplate(
  ctx: VersionsCtx,
  state: { selected: string | null; busy: boolean; line: FileNote | null },
  h: VersionsHandlers,
): TemplateResult {
  const rows = ctx.versions.map(
    (v) => html`<button type="button" role="option" aria-selected=${v.key === state.selected ? "true" : "false"}
      class=${classMap({ "fd-row": true, "pv-row": true, selected: v.key === state.selected })}
      @click=${() => h.select(v.key)} @dblclick=${() => h.open(v)}>
      ${fileIcon(ctx.mark)}
      <span class="fd-cell">${versionWhen(v.at)}</span>
      <span class="fd-cell pv-how">${v.how}</span>
      <span class="fd-cell fd-size-cell">${fileSizeText(v.size)}</span>
    </button>`,
  );
  return html`<div class="pv">
    <p class="pv-intro">${ctx.intro}</p>
    <div class="fd-list well">
      <div class="fd-rows pv-rows" role="listbox" aria-label="Previous versions of ${ctx.name}">
        ${rows.length > 0 ? rows : html`<div class="fd-empty">${ctx.empty}</div>`}
      </div>
    </div>
    ${state.line ? html`<p class=${`fd-line fd-line-${state.line.kind}`} role="alert">${state.line.text}</p>` : nothing}
    <div class="pv-buttons">
      <button type="button" class="btn primary" ?disabled=${!h.picked() || state.busy} @click=${() => h.open(h.picked())}>Open</button>
      <button type="button" class="btn" @click=${h.cancel}>Cancel</button>
    </div>
  </div>`;
}
