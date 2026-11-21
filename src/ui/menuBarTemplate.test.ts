import { afterEach, describe, expect, it, vi } from "vitest";
import { html } from "lit-html";
import { MenuBar, type MenuBarModel } from "./menuBar";
import { markupOf } from "./testing/litTestUtils";

const bars: MenuBar[] = [];

afterEach(() => {
  for (const bar of bars.splice(0)) bar.close(false);
  document.body.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  document.body.innerHTML = "";
});

function mount(model: MenuBarModel, onOpen?: (menu: HTMLElement) => void) {
  document.body.innerHTML = `<div id="host"></div>`;
  const host = document.getElementById("host")!;
  const bar = new MenuBar(host, model, { onOpen });
  bars.push(bar);
  const $ = (id: string) => document.getElementById(id) as HTMLElement;
  return { bar, host, $ };
}

const pick = vi.fn();

/** One of everything a menu can hold. */
const FULL: MenuBarModel = {
  id: "bar",
  label: "Game menu",
  className: "extra",
  brand: true,
  menus: [
    {
      id: "mb-file",
      label: "File",
      mnemonic: 0,
      items: [
        { id: "new", label: "New…", onPick: pick },
        { id: "open", label: "Open…", shortcut: "Ctrl+O" },
        {
          kind: "submenu",
          id: "recent",
          label: "Open Recent",
          items: [
            { id: "r1", label: "1 Sky Mall", mnemonic: 0 },
            { id: "none", label: "No recent towers", disabled: true },
          ],
        },
        { kind: "separator", id: "sep", className: "mb-install-sep", hidden: true },
        { id: "install", label: "Install app", hidden: true },
      ],
    },
    {
      id: "mb-window",
      label: "Window",
      mnemonic: 0,
      className: "mb-desk-only",
      items: [
        { id: "tools", label: "Tools", checked: true, data: { "desk-win": "tools" } },
        { id: "light", label: "Light", checked: false, radio: true },
        { id: "status", label: "Status Bar", checked: false, className: "mb-desktop-only" },
      ],
    },
    {
      id: "mb-help",
      label: "Help",
      mnemonic: 0,
      items: [{ id: "sponsor", label: "Sponsor", href: "https://example.com/", target: "_blank", rel: "noopener" }],
    },
  ],
};

describe("menuBarTemplate", () => {
  it("draws the bar, its titles and their popups with the menu bar's classes and ARIA", () => {
    const { host, $ } = mount(FULL);
    const nav = host.querySelector("nav")!;
    expect(nav.id).toBe("bar");
    expect(nav.className).toBe("menubar extra");
    expect(nav.getAttribute("aria-label")).toBe("Game menu");
    expect(nav.firstElementChild!.matches("span.menubar-brand[aria-hidden='true']")).toBe(true);

    const title = $("mb-file");
    expect(title.matches("button.mb-title[type='button']")).toBe(true);
    expect(title.parentElement!.className).toBe("mb-menu");
    expect(title.getAttribute("aria-haspopup")).toBe("menu");
    expect(title.getAttribute("aria-expanded")).toBe("false");
    expect(title.getAttribute("aria-controls")).toBe("mb-file-menu");
    expect(markupOf(title, "inner")).toBe("<u>F</u>ile");

    const pop = $("mb-file-menu");
    expect(pop.className).toBe("mb-pop");
    expect(pop.getAttribute("role")).toBe("menu");
    expect(pop.getAttribute("aria-labelledby")).toBe("mb-file");
    expect(pop.hidden).toBe(true);
    expect($("mb-window").parentElement!.className).toBe("mb-menu mb-desk-only");
  });

  it("draws plain, shortcut, checked, radio, grayed, hidden, link and data items", () => {
    const { $ } = mount(FULL);
    expect($("new").outerHTML).toMatch(/^<button type="button" role="menuitem" class="mb-item" id="new">/);
    expect($("new").textContent).toBe("New…");
    expect($("open").querySelector("kbd")!.textContent).toBe("Ctrl+O");
    expect($("open").textContent).toBe("Open…Ctrl+O");
    expect($("tools").getAttribute("role")).toBe("menuitemcheckbox");
    expect($("tools").getAttribute("aria-checked")).toBe("true");
    expect($("tools").dataset.deskWin).toBe("tools");
    expect($("light").getAttribute("role")).toBe("menuitemradio");
    expect($("light").getAttribute("aria-checked")).toBe("false");
    expect($("status").className).toBe("mb-item mb-desktop-only");
    expect($("new").hasAttribute("aria-checked")).toBe(false);
    expect($("none").getAttribute("aria-disabled")).toBe("true");
    expect($("new").hasAttribute("aria-disabled")).toBe(false);
    expect($("install").hidden).toBe(true);
    expect($("sep").matches("hr.mb-sep.mb-install-sep[hidden]")).toBe(true);
    const link = $("sponsor") as HTMLAnchorElement;
    expect(link.tagName).toBe("A");
    expect(link.className).toBe("mb-item");
    expect(link.getAttribute("href")).toBe("https://example.com/");
    expect(link.target).toBe("_blank");
    expect(link.rel).toBe("noopener");
  });

  it("draws an item's tooltip and its own content in place of the label, and a later render changes both", () => {
    const line = (name: string, where: string): MenuBarModel => ({
      label: "Game menu",
      menus: [
        {
          id: "mb-file",
          label: "File",
          items: [
            { id: "recent-1", label: name, title: where, content: html`<u>1</u><span class="name">${name}</span>` },
          ],
        },
      ],
    });
    const { $, bar } = mount(line("Harmony", "In My Towers"));
    expect($("recent-1").title).toBe("In My Towers");
    expect($("recent-1").querySelector("u")!.textContent).toBe("1");
    expect($("recent-1").querySelector(".name")!.textContent).toBe("Harmony");
    bar.render(line("Skyline", "In the linked folder"));
    expect($("recent-1").title).toBe("In the linked folder");
    expect($("recent-1").textContent).toBe("1Skyline");
  });

  it("draws a submenu as a sub title and its popup, and a mnemonic inside it", () => {
    const { $ } = mount(FULL);
    const sub = $("recent");
    expect(sub.parentElement!.matches("div.mb-sub[role='none']")).toBe(true);
    expect(sub.className).toBe("mb-item mb-sub-title");
    expect(sub.getAttribute("aria-controls")).toBe("recent-menu");
    expect(sub.getAttribute("aria-expanded")).toBe("false");
    const pop = $("recent-menu");
    expect(pop.className).toBe("mb-pop mb-subpop");
    expect(pop.getAttribute("aria-labelledby")).toBe("recent");
    expect(pop.hidden).toBe(true);
    expect($("r1").querySelector("u")!.textContent).toBe("1");
  });

  it("runs an item's onPick on its click, and the bar closes the menu after it", () => {
    pick.mockReset();
    const { bar, $ } = mount(FULL);
    bar.open($("mb-file") as HTMLButtonElement, false);
    pick.mockImplementation(() => expect(bar.current()).toBe($("mb-file")));
    $("new").click();
    expect(pick).toHaveBeenCalledOnce();
    expect(bar.current()).toBeNull();
  });

  it("opens a model's submenu from the keyboard and picks its line by its underlined key", () => {
    const { bar, $ } = mount(FULL);
    bar.open($("mb-file") as HTMLButtonElement, false);
    $("recent").focus();
    $("recent").dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true }));
    expect($("recent-menu").hidden).toBe(false);
    expect(document.activeElement).toBe($("r1"));
    const picked = vi.fn();
    $("r1").addEventListener("click", picked);
    $("r1").dispatchEvent(new KeyboardEvent("keydown", { key: "1", bubbles: true, cancelable: true }));
    expect(picked).toHaveBeenCalledOnce();
    expect(bar.current()).toBeNull();
  });

  it("a later render changes only what the model changed and leaves an open menu open", () => {
    const { bar, $ } = mount(FULL);
    bar.open($("mb-window") as HTMLButtonElement, false);
    const tools = $("tools");
    const window = FULL.menus[1]!;
    bar.render({
      ...FULL,
      menus: [
        FULL.menus[0]!,
        {
          ...window,
          items: [
            { id: "tools", label: "Tools", checked: false },
            { id: "light", label: "Light", checked: true, radio: true },
            { id: "status", label: "Status Bar", checked: false, hidden: true },
          ],
        },
        FULL.menus[2]!,
      ],
    });
    expect($("tools")).toBe(tools);
    expect(tools.getAttribute("aria-checked")).toBe("false");
    expect(tools.hasAttribute("data-desk-win")).toBe(false);
    expect($("light").getAttribute("aria-checked")).toBe("true");
    expect($("status").hidden).toBe(true);
    expect($("mb-window-menu").hidden).toBe(false);
    expect($("mb-window").getAttribute("aria-expanded")).toBe("true");
    expect(bar.current()).toBe($("mb-window"));
  });

  it("a render's onOpen can redraw the menu before it shows", () => {
    let sound = false;
    const model = (): MenuBarModel => ({
      label: "Sample",
      menus: [{ id: "opts", label: "Options", items: [{ id: "sound", label: "Sound", checked: sound }] }],
    });
    document.body.innerHTML = `<div id="host"></div>`;
    const bar: MenuBar = new MenuBar(document.getElementById("host")!, model(), {
      onOpen: () => bar.render(model()),
    });
    bars.push(bar);
    sound = true;
    document.getElementById("opts")!.click();
    expect(document.getElementById("sound")!.getAttribute("aria-checked")).toBe("true");
  });

  it("never runs a grayed item's onPick, by click or by its underlined key", () => {
    const onPick = vi.fn();
    const { bar, $ } = mount({
      label: "Sample",
      menus: [
        {
          id: "f",
          label: "File",
          items: [
            { id: "gray", label: "1 Gray", mnemonic: 0, disabled: true, onPick },
            { id: "ok", label: "OK" },
          ],
        },
      ],
    });
    bar.open($("f") as HTMLButtonElement, true);
    $("gray").click();
    $("ok").dispatchEvent(new KeyboardEvent("keydown", { key: "1", bubbles: true, cancelable: true }));
    expect(onPick).not.toHaveBeenCalled();
    expect(bar.current()).toBe($("f"));
  });

  it("with two bars on a page, Alt and a letter open only one, and a bar with altKeys off never answers", () => {
    const model = (id: string): MenuBarModel => ({
      label: id,
      menus: [{ id: `${id}-file`, label: "File", mnemonic: 0, items: [{ label: "New" }] }],
    });
    document.body.innerHTML = `<div id="a"></div><div id="b"></div><div id="c"></div>`;
    const first = new MenuBar(document.getElementById("a")!, model("a"));
    const second = new MenuBar(document.getElementById("b")!, model("b"));
    const quiet = new MenuBar(document.getElementById("c")!, model("c"), { altKeys: false });
    bars.push(first, second, quiet);
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "f", altKey: true, bubbles: true, cancelable: true }));
    expect(first.current()?.id).toBe("a-file");
    expect(second.current()).toBeNull();
    first.close(false);
    document.getElementById("a")!.hidden = true;
    document.getElementById("b")!.hidden = true;
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "f", altKey: true, bubbles: true, cancelable: true }));
    expect(quiet.current()).toBeNull();
  });
});
