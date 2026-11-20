/**
 * The "page not found" desk: a message box on the teal 1994 desk, with the
 * startup screen's sunrise skyline across its top and a taskbar along the
 * bottom of the screen. One tower in the skyline is missing a floor, tagged
 * 404. A site renders it into its 404 page's `#app`, under
 * `<body class="retro-page nf-page">`, with `styles/not-found.css`.
 *
 * The caller writes the words and names every place the page offers: the
 * message box's buttons (the first is the default), its ✕, and the taskbar's
 * start button. Each one is a link, and its `onPick` hears a click and a
 * middle click (which opens it in a new tab), so the caller can count picks
 * or close a tab another page opened instead of following the link. The
 * missing path is shown as text, which lit escapes.
 *
 * Cost: the page draws once, and again each minute for the tray clock
 * ({@link msToNextMinute}); lit then writes only the clock's text.
 */
import { html, nothing, type TemplateResult } from "lit-html";
import { iconTemplate, type IconName } from "./icons";

/** `MouseEvent.button` for the middle (wheel) button, the one that opens a
 *  link in a new tab; the right button's `auxclick` opens a menu instead. */
export const MIDDLE_BUTTON = 1;

/** How a link was picked. */
export type NotFoundPickHow = "click" | "middle";

/** A place the page offers. */
export interface NotFoundLink {
  readonly href: string;
  /** Its words; for the ✕, its spoken name. */
  readonly label: string;
  /** A stable name (`data-act`), for tests and for a page's own handlers. */
  readonly act?: string;
  /** Hears a click (the caller may cancel it with `preventDefault`) and a
   *  middle click. */
  readonly onPick?: (e: MouseEvent, how: NotFoundPickHow) => void;
}

/** What the page shows. */
export interface NotFoundDeskView {
  /** The message box's title bar, such as the site's name. */
  readonly title: string;
  /** The message's heading, such as "Floor 404 hasn't been built yet." */
  readonly heading: string;
  /** The missing path, such as "/help/changlog". */
  readonly path: string;
  /** Lines after "There is no page at …", such as "The link may be mistyped." */
  readonly lines?: readonly string[];
  /** The buttons, in order; the first is drawn as the default. */
  readonly links: readonly NotFoundLink[];
  /** The message box's ✕. */
  readonly close: NotFoundLink;
  /** The taskbar's start button. */
  readonly start: NotFoundLink;
  /** The icon in the title bar and on the start button; "brand" unless given. */
  readonly icon?: IconName;
  /** The taskbar's one task, such as "Page not found". */
  readonly task: string;
  /** The tray clock's text ({@link trayClock}). */
  readonly clock: string;
  /** A line above the message, such as a note a page opened from elsewhere
   *  fills in; nothing unless given. */
  readonly note?: TemplateResult;
}

/** The taskbar clock's text for `now`, as the 1995 tray showed it: "4:34 PM". */
export function trayClock(now: Date): string {
  const h = now.getHours();
  const m = String(now.getMinutes()).padStart(2, "0");
  return `${h % 12 || 12}:${m} ${h < 12 ? "AM" : "PM"}`;
}

/** How long from `now` until the clock's minute turns over, a little after
 *  it so the redraw reads the new minute. */
export function msToNextMinute(now: Date): number {
  return (60 - now.getSeconds()) * 1000 - now.getMilliseconds() + 50;
}

/** The Windows 95 warning icon of the message box, drawn on a 32 by 32 grid. */
const WARNING_ICON = html`<svg class="nf-icon" viewBox="0 0 32 32" width="32" height="32" aria-hidden="true">
  <path
    d="M15 2h2v2h1v3h1v3h1v3h1v3h1v3h1v3h1v3h1v3H5v-3h1v-3h1v-3h1v-3h1v-3h1v-3h1v-3h1V7h1V4h1z"
    fill="#000"
  />
  <path
    d="M15.5 5h1v3h1v3h1v3h1v3h1v3h1v3h1v2H7v-2h1v-3h1v-3h1v-3h1v-3h1v-3h1V8h1V5z"
    fill="#ffd400"
  />
  <path d="M15 10h2v9h-2zM15 21h2v2h-2z" fill="#000" />
</svg>`;

/** The sunrise skyline from the startup screen, with one tower missing a floor. */
const SKYLINE = html`<div class="nf-sky" aria-hidden="true">
  <span class="nf-star" style="left:12%;top:18%"></span>
  <span class="nf-star" style="left:34%;top:9%"></span>
  <span class="nf-star" style="left:71%;top:14%"></span>
  <span class="nf-star" style="left:88%;top:30%"></span>
  <span class="nf-sun"></span>
  <span class="nf-bldg" style="left:3%;width:15%;height:52%;--lit:0.35"></span>
  <span class="nf-bldg" style="left:20%;width:11%;height:70%;--lit:0.6"></span>
  <span class="nf-tower">
    <span class="nf-tower-top"></span>
    <span class="nf-gap"><span class="nf-tag">404</span></span>
    <span class="nf-tower-base"></span>
  </span>
  <span class="nf-bldg" style="left:63%;width:13%;height:62%;--lit:0.45"></span>
  <span class="nf-bldg" style="left:80%;width:17%;height:44%;--lit:0.3"></span>
</div>`;

/** A link's click and middle-click handlers. */
function picks(link: NotFoundLink) {
  const pick = link.onPick;
  if (!pick) return { click: nothing, aux: nothing };
  return {
    click: (e: MouseEvent) => pick(e, "click"),
    aux: (e: MouseEvent) => {
      if (e.button === MIDDLE_BUTTON) pick(e, "middle");
    },
  };
}

function button(link: NotFoundLink, primary: boolean): TemplateResult {
  const on = picks(link);
  return html`<a
    class=${primary ? "btn primary" : "btn"}
    href=${link.href}
    data-act=${link.act ?? nothing}
    @click=${on.click}
    @auxclick=${on.aux}
    >${link.label}</a
  >`;
}

/** The page: a message box on the desk, and the taskbar. */
export function notFoundDeskTemplate(view: NotFoundDeskView): TemplateResult {
  const icon = view.icon ?? "brand";
  const close = picks(view.close);
  const start = picks(view.start);
  return html`
    <div class="nf-desk">
      <main class="nf-win win" aria-labelledby="nf-heading">
        <div class="win-title">
          <span class="nf-title-icon" aria-hidden="true">${iconTemplate(icon, { size: 16 })}</span>
          <span class="nf-title-text">${view.title}</span>
          <a
            class="btn xs nf-close"
            href=${view.close.href}
            data-act=${view.close.act ?? nothing}
            aria-label=${view.close.label}
            @click=${close.click}
            @auxclick=${close.aux}
            >✕</a
          >
        </div>
        ${SKYLINE}
        <div class="nf-body">
          ${view.note ?? nothing}
          <div class="nf-msg">
            ${WARNING_ICON}
            <div>
              <h1 id="nf-heading">${view.heading}</h1>
              <p>There is no page at <code>${view.path}</code>.</p>
              ${(view.lines ?? []).map((line) => html`<p>${line}</p>`)}
            </div>
          </div>
          <nav class="nf-buttons" aria-label="Pages">${view.links.map((l, i) => button(l, i === 0))}</nav>
        </div>
      </main>
    </div>
    <footer class="nf-taskbar">
      <a
        class="nf-start"
        href=${view.start.href}
        data-act=${view.start.act ?? nothing}
        @click=${start.click}
        @auxclick=${start.aux}
        >${iconTemplate(icon, { size: 16 })}<span>${view.start.label}</span></a
      >
      <span class="nf-task" aria-hidden="true">${iconTemplate("warning", { size: 14 })}<span>${view.task}</span></span>
      <span class="nf-tray"><time>${view.clock}</time></span>
    </footer>
  `;
}
