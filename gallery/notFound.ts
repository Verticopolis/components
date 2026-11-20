/**
 * The "page not found" desk (`notFoundDeskTemplate` from
 * `windows/notFoundDesk`) on a page of its own
 * (site/src/pages/frames/not-found.astro), with made-up words and places. A
 * pick stays on the page and the taskbar's task says what was picked, since
 * the frame has nowhere to go. The tray clock moves on the minute.
 */
import { render } from "lit-html";
import {
  msToNextMinute,
  notFoundDeskTemplate,
  trayClock,
  type NotFoundLink,
  type NotFoundPickHow,
} from "../lib/ui/notFoundDesk.js";

/** Draw the desk into the frame page's `#app`. */
export function mountNotFound(): void {
  const root = document.getElementById("app");
  if (!root) return;
  let task = "Page not found";
  const place = (act: string, label: string): NotFoundLink => ({
    act,
    label,
    href: "#",
    onPick: (e: MouseEvent, how: NotFoundPickHow) => {
      e.preventDefault();
      task = how === "middle" ? `${label} (new tab)` : label;
      draw();
    },
  });
  const draw = () =>
    render(
      notFoundDeskTemplate({
        title: "Verticopolis components",
        heading: "Floor 404 hasn't been built yet.",
        path: "/controls/elevator-music/",
        lines: ["The link may be mistyped, or the page may have moved."],
        links: [place("gallery", "Browse the gallery"), place("game", "Play the game"), place("docs", "Read the docs")],
        close: place("close", "Close and go to the gallery"),
        start: place("start", "Verticopolis"),
        task,
        clock: trayClock(new Date()),
      }),
      root,
    );
  draw();
  const tick = () => {
    draw();
    setTimeout(tick, msToNextMinute(new Date()));
  };
  setTimeout(tick, msToNextMinute(new Date()));
  (window as unknown as { galleryReady?: boolean }).galleryReady = true;
}
