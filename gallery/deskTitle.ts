/**
 * The title screen on the desk (`windows/desk/deskTitle` with
 * `styles/game/desk-title.css`), on a frame page of its own over the game's
 * whole stylesheet: the sample title screen (titleScreen.ts) in its window,
 * with the taskbar below. With `?phone` in the address, the title screen
 * wears `splash--mobile`, as the game's does when it first came up on a
 * phone-sized screen and the window has since grown to a computer's.
 */
import { html, render } from "lit-html";
import { DeskTitle } from "../lib/ui/desk/deskTitle.js";
import { titleScreenTemplate } from "../lib/ui/titleScreen/titleScreen.js";
import { sampleTitleView } from "./titleScreen";

/** The taskbar clock holds still, so every visit draws the same. */
const CLOCK = new Date(2026, 10, 20, 9, 15);
const ICON = `${import.meta.env.BASE_URL.replace(/\/?$/, "/")}favicon.png`;

export function mountDeskTitle(): void {
  const doc = document;
  const app = doc.getElementById("app")!;
  const host = doc.getElementById("desk-title")!;
  const phone = new URLSearchParams(location.search).has("phone");
  const say = (what: string) => (app.dataset.said = what);
  render(
    html`<div id="splash" class=${phone ? "splash--mobile" : ""}>${titleScreenTemplate(sampleTitleView(say))}</div>`,
    app,
  );
  new DeskTitle({
    host,
    title: "Verticopolis",
    icon: ICON,
    taskbar: { items: [], now: () => CLOCK, task: () => {}, start: () => {} },
  }).show();
}
