import { html, render } from "lit-html";
import { afterEach, describe, expect, it, vi } from "vitest";
import { titleScreenTemplate, type TitleScreenView } from "./titleScreen";
import { SKYLINE_BUILDINGS, SKYLINE_WINDOWS } from "./titleSkyline";

function draw(v: TitleScreenView) {
  render(html`<div id="splash"></div>`, document.body);
  const root = document.getElementById("splash")!;
  render(titleScreenTemplate(v), root);
  return root;
}

afterEach(() => render(html``, document.body));

describe("the title screen", () => {
  it("draws the skyline, the lettering and the premise", () => {
    const root = draw({ premise: "Build up.", actions: [] });
    expect(root.querySelectorAll(".splash-skyline path")).toHaveLength(SKYLINE_BUILDINGS.length);
    expect(root.querySelectorAll(".splash-skyline rect")).toHaveLength(SKYLINE_WINDOWS.length);
    expect(root.querySelector(".splash-word")!.getAttribute("aria-label")).toBe("Verticopolis");
    expect(root.querySelector(".splash-word text")!.textContent).toBe("VERTICOPOLIS");
    expect(root.querySelector(".splash-premise")!.textContent).toBe("Build up.");
  });

  it("draws the buttons in order with their looks, and each runs its own action", () => {
    const go = vi.fn();
    const help = vi.fn();
    const root = draw({
      actions: [
        { id: "continue", label: "Continue", icon: "play", look: "primary", onPress: go },
        { id: "help", label: "How to Play", look: "ghost", onPress: help },
      ],
    });
    const buttons = [...root.querySelectorAll<HTMLButtonElement>(".splash-actions button")];
    expect(buttons.map((b) => [b.dataset.splash, b.className, b.textContent])).toEqual([
      ["continue", "splash-btn primary", "Continue"],
      ["help", "splash-btn ghost", "How to Play"],
    ]);
    expect(buttons[0]!.querySelector("svg")).not.toBeNull();
    buttons[1]!.click();
    expect(help).toHaveBeenCalledOnce();
    expect(go).not.toHaveBeenCalled();
  });

  it("leaves out each corner it is not given", () => {
    const root = draw({ actions: [] });
    for (const sel of [
      ".splash-premise",
      ".splash-attrib",
      ".splash-version",
      ".splash-founder",
      ".splash-mute",
      ".splash-install",
      ".splash-sponsor",
    ])
      expect(root.querySelector(sel), sel).toBeNull();
  });

  it("draws the corners it is given, the mute as a toggle with a steady name", () => {
    const toggle = vi.fn();
    const install = vi.fn();
    const open = vi.fn();
    const root = draw({
      actions: [],
      attribution: "Original code and art.",
      version: "v1.2.3",
      badge: "★ Ground floor",
      mute: { muted: true, label: "Mute sound", onToggle: toggle },
      install: { label: "Install", name: "Install the game", title: "Play offline.", onPress: install },
      sponsor: { href: "https://example.test/sponsor", label: "Sponsor", title: "Tip jar.", onOpen: open },
    });
    expect(root.querySelector(".splash-attrib")!.textContent).toBe("Original code and art.");
    expect(root.querySelector(".splash-version")!.textContent).toBe("v1.2.3");
    expect(root.querySelector(".splash-founder")!.textContent).toBe("★ Ground floor");
    const mute = root.querySelector<HTMLButtonElement>(".splash-mute")!;
    expect([mute.getAttribute("aria-pressed"), mute.getAttribute("aria-label")]).toEqual(["true", "Mute sound"]);
    expect(mute.querySelector("svg")!.dataset.icon).toBe("mute");
    mute.click();
    expect(toggle).toHaveBeenCalledOnce();
    const inst = root.querySelector<HTMLButtonElement>(".splash-install")!;
    expect([inst.getAttribute("aria-label"), inst.title, inst.textContent]).toEqual([
      "Install the game",
      "Play offline.",
      "Install",
    ]);
    inst.click();
    expect(install).toHaveBeenCalledOnce();
    const link = root.querySelector<HTMLAnchorElement>(".splash-sponsor")!;
    expect([link.href, link.target, link.rel]).toEqual([
      "https://example.test/sponsor",
      "_blank",
      "noopener noreferrer",
    ]);
    link.addEventListener("click", (e) => e.preventDefault());
    link.click();
    expect(open).toHaveBeenCalledOnce();
  });

  it("hears a middle-click on the sponsor link, and never a right-click", () => {
    const open = vi.fn();
    const root = draw({ actions: [], sponsor: { href: "#", label: "Sponsor", title: "Tip jar.", onOpen: open } });
    const link = root.querySelector<HTMLAnchorElement>(".splash-sponsor")!;
    link.dispatchEvent(new MouseEvent("auxclick", { button: 2, bubbles: true }));
    expect(open).not.toHaveBeenCalled();
    const middle = new MouseEvent("auxclick", { button: 1, bubbles: true });
    link.dispatchEvent(middle);
    expect(open).toHaveBeenCalledExactlyOnceWith(middle);
  });
});
