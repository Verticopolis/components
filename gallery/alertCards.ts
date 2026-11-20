/**
 * Alert cards and the update box: a sample crash card and wait card
 * (`AlertCard` from `windows/alertCard`), and sample update boxes
 * (`updateBoxView` from `windows/updateBox`) opened in the package's one
 * modal dialog. The words are made up for the gallery; a game writes its own.
 * The wait card has no buttons, so the gallery takes it down after a few
 * seconds, as a game does when its wait ends.
 */
import { html, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import { AlertCard, type AlertCardView } from "../lib/ui/alertCard.js";
import { ModalShell } from "../lib/ui/uiModal.js";
import { updateBoxView, type UpdateBoxView } from "../lib/ui/updateBox.js";

const CRASH_ID = "g-crash-card";
const WAIT_ID = "g-wait-card";
/** How long the sample wait lasts. */
const WAIT_MS = 3_000;

function openCrashCard(): void {
  if (document.getElementById(CRASH_ID)) return;
  let card: AlertCard | null = null;
  const view = (status: string, busy = false): AlertCardView => ({
    title: "The program stopped",
    kind: "alert",
    text: [
      "The graphics driver reset while the program was running.",
      "Your tower was saved. Nothing is lost.",
      "A report helps fix this. Nothing is sent anywhere until you attach it to a bug report yourself.",
    ],
    status,
    buttons: [
      { label: "Download report", act: "download", disabled: busy, onPress: pack },
      {
        label: html`Report a bug<span class="visually-hidden"> (opens in a new tab)</span>`,
        act: "report",
        href: "https://github.com/Verticopolis/components/issues/new",
      },
      { label: "Close", act: "reload", primary: true, onPress: () => card?.close() },
    ],
    focus: "reload",
  });
  // A pretend report: busy for a moment, then ready.
  function pack(): void {
    card?.update(view("Packing the report…", true));
    setTimeout(() => card?.update(view("The report is ready. Check your downloads.")), 800);
  }
  card = new AlertCard(document, CRASH_ID, view(""));
}

function openWaitCard(): void {
  if (document.getElementById(WAIT_ID)) return;
  const card = new AlertCard(document, WAIT_ID, {
    title: "Recovering graphics",
    kind: "wait",
    text: ["The device reset the graphics. They are restarting, which takes a few seconds. Your tower is safe."],
  });
  setTimeout(() => card.close(), WAIT_MS);
}

const NOTES = ["Saves are faster on a large tower.", "The map remembers where it was.", "A new cinema look."];

/** The sample update boxes, each opened by its own button. */
const UPDATES: readonly { button: string; view: UpdateBoxView }[] = [
  {
    button: "An update…",
    view: {
      title: "Update available",
      kind: "Game update",
      text: [
        "A newer version is ready. Update now saves your tower and reloads onto it.",
        "Or keep playing: it applies next time you reopen.",
      ],
      version: "2.1.0",
      notes: NOTES,
      shortNotes: 3,
      allNotesHref: "https://github.com/Verticopolis/components/releases",
      buildLines: ["Build 2.1.0 · 1a2b3c4"],
    },
  },
  {
    button: "An update after several versions…",
    view: {
      title: "Update available",
      text: [
        "A newer version is ready. Update now saves your tower and reloads onto it.",
        "Or keep playing: it applies next time you reopen.",
      ],
      version: "2.1.0",
      notes: NOTES,
      releases: [
        { version: "2.1.0", notes: NOTES },
        { version: "2.0.2", notes: ["Fixes a stuck elevator car."] },
        { version: "2.0.1", notes: ["Fixes the Tools window on a short phone.", "Clearer funds color."] },
      ],
      since: "2.0.0",
      more: true,
      shortNotes: 3,
      buildLines: ["Build 2.1.0 · 1a2b3c4"],
    },
  },
];

/** The buttons that open each sample, and the dialog the update boxes open in. */
export function alertCards(): TemplateResult {
  let shell: ModalShell | null = null;
  const made = (el?: Element) => {
    if (el instanceof HTMLDialogElement && !shell)
      shell = new ModalShell(el, { gameStopped: () => false, toast: () => undefined });
  };
  const openUpdate = (view: UpdateBoxView) => {
    const box = shell;
    if (!box) return;
    box.open(updateBoxView(view, { later: () => box.close(), update: () => box.close() }));
  };
  return html`<div class="g-row">
      <button type="button" class="btn" @click=${openCrashCard}>A crash card…</button>
      <button type="button" class="btn" @click=${openWaitCard}>A wait card…</button>
      ${UPDATES.map((u) => html`<button type="button" class="btn" @click=${() => openUpdate(u.view)}>${u.button}</button>`)}
    </div>
    <dialog id="modal" ${ref(made)}></dialog>`;
}
