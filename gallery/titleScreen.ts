/**
 * The game's title screen (`windows/titleScreen/titleScreen`) in a frame on
 * the page, with sample buttons and every corner shown. The buttons and the
 * corners do nothing here but say which was pressed.
 */
import { html, render, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import { titleScreenTemplate, type TitleScreenView } from "../lib/ui/titleScreen/titleScreen.js";

/** The sample title screen: its buttons and corners only call `say` with
 *  what was pressed, and the mute corner calls `toggleMute`. The desk title
 *  screen frame (deskTitle.ts) shows it too. */
export function sampleTitleView(say: (what: string) => void, muted = false, toggleMute = () => {}): TitleScreenView {
  const press = (what: string) => () => say(`${what} pressed.`);
  return {
    premise: "Build a tower, one floor at a time, and keep its people happy.",
    actions: [
      { id: "continue", label: "Continue", icon: "play", look: "primary", onPress: press("Continue") },
      { id: "load", label: "Open Tower…", icon: "folder", onPress: press("Open Tower…") },
      { id: "new", label: "New Tower", icon: "plus", onPress: press("New Tower") },
      { id: "help", label: "How to Play", icon: "help", look: "ghost", onPress: press("How to Play") },
    ],
    attribution: "Sample small print along the bottom.",
    version: "v0.0.0 (gallery)",
    badge: "★ Ground floor",
    mute: {
      muted,
      label: "Mute sound",
      onToggle: toggleMute,
    },
    install: {
      label: "Install",
      name: "Install the game",
      title: "A sample install button.",
      onPress: press("Install"),
    },
    sponsor: {
      href: "#",
      label: "Sponsor",
      title: "A sample sponsor link.",
      onOpen: (e) => {
        e.preventDefault();
        press("Sponsor")();
      },
    },
  };
}

/** The title screen in a 16:10 frame, and a line that says what was pressed. */
export function titleScreenDemo(): TemplateResult {
  let root: HTMLElement | null = null;
  let said = "Press a button.";
  let muted = false;
  const say = (what: string) => {
    said = what;
    draw();
  };
  const toggleMute = () => {
    muted = !muted;
    say(muted ? "Muted." : "Sound on.");
  };
  const view = (): TitleScreenView => sampleTitleView(say, muted, toggleMute);
  function draw(): void {
    if (!root) return;
    render(
      html`<div id="splash">${titleScreenTemplate(view())}</div><p class="g-title-said" role="status">${said}</p>`,
      root,
    );
  }
  const made = (el?: Element) => {
    if (el instanceof HTMLElement && el !== root) {
      root = el;
      draw();
    }
  };
  return html`<div class="g-title" ${ref(made)}></div>`;
}
