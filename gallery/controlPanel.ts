/**
 * The desk's Control Panel (`windows/desk/deskControlPanel`) on a patch of
 * desk. Each icon only says it was pressed, Sounds also flips its label the
 * way a game shows the sound's state, and the ✕ closes the window until the
 * button under it opens it again.
 */
import { html, render, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import { ControlPanel, type ControlIcon, type ControlItem } from "../lib/ui/desk/deskControlPanel.js";

const ITEMS: readonly ControlItem[] = [
  { icon: "display", label: "Display", hint: "Screen saver" },
  { icon: "appearance", label: "Appearance", hint: "Windows, menus and buttons" },
  { icon: "sounds", label: "Sounds: On", hint: "Sound on or off" },
  { icon: "settings", label: "Settings", hint: "Game settings" },
];

/** The site's app icon, beside the site's base. */
const ICON = `${import.meta.env.BASE_URL.replace(/\/?$/, "/")}favicon.png`;

const NAMES: Record<ControlIcon, string> = {
  display: "Display",
  appearance: "Appearance",
  sounds: "Sounds",
  settings: "Settings",
};

export function controlPanelDemo(): TemplateResult {
  let said = "Press an icon.";
  let soundOn = true;
  let line: HTMLElement | null = null;
  const draw = () => {
    if (line)
      render(
        html`<span class="g-control-said" role="status">${said}</span>
          <button type="button" class="btn" ?disabled=${panel.isOpen()} @click=${reopen}>
            Open Control Panel
          </button>`,
        line,
      );
  };
  const reopen = () => {
    panel.open();
    said = "Opened.";
    draw();
  };
  const panel = new ControlPanel(document, {
    items: ITEMS,
    closeLabel: "Close Control Panel",
    icon: ICON,
    picked: (icon) => {
      if (icon === "sounds") {
        soundOn = !soundOn;
        panel.setLabel("sounds", `Sounds: ${soundOn ? "On" : "Off"}`);
      }
      said = `${NAMES[icon]} pressed.`;
      draw();
    },
    closed: () => {
      said = "Closed.";
      draw();
    },
  });
  panel.open();
  return html`<div class="g-control">${panel.root}</div>
    <p class="g-control-line" ${ref((el) => {
      if (el instanceof HTMLElement && !line) {
        line = el;
        draw();
      }
    })}></p>`;
}
