import { render } from "lit-html";
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { topBarTemplate, type TopBarActions, type TopBarView } from "./topBar";

const VIEW: TopBarView = {
  rating: "★★☆☆☆",
  date: "1st WD/1Q/1st Year",
  time: "Mon 07:00",
  funds: "$2,000,000",
  fundsNegative: false,
  population: "1,204",
  traffic: { level: "smooth", word: "Smooth", floor: "", spoken: "Traffic: Smooth", warn: false },
  speed: 1,
  undoOff: true,
  redoOff: false,
  muted: false,
  update: false,
  install: false,
};

type Spies = { [K in keyof TopBarActions]-?: Mock<NonNullable<TopBarActions[K]>> };

function spies(): Spies {
  return {
    speed: vi.fn(),
    undo: vi.fn(),
    redo: vi.fn(),
    save: vi.fn(),
    mute: vi.fn(),
    update: vi.fn(),
    install: vi.fn(),
    traffic: vi.fn(),
  };
}

describe("topBarTemplate", () => {
  let host: HTMLElement;
  let actions: Spies;
  const draw = (view: Partial<TopBarView> = {}) => render(topBarTemplate({ ...VIEW, ...view }, actions), host);
  const $ = <T extends HTMLElement = HTMLElement>(sel: string) => host.querySelector<T>(sel)!;

  beforeEach(() => {
    document.body.replaceChildren();
    host = document.createElement("header");
    host.id = "topbar";
    document.body.append(host);
    actions = spies();
  });

  it("shows each meter's text under the ids the stylesheets name", () => {
    draw();
    expect($("#stat-star").textContent).toBe("★★☆☆☆");
    expect($("#stat-date").textContent).toBe("1st WD/1Q/1st Year");
    expect($("#stat-time").textContent).toBe("Mon 07:00");
    expect($("#stat-money").textContent).toBe("$2,000,000");
    expect($("#stat-pop").textContent).toBe("1,204");
    expect($("#traffic-label").textContent).toBe("Smooth");
    expect($("#traffic-floor").textContent).toBe("");
  });

  it("colors the funds by their sign", () => {
    draw();
    expect($("#stat-money").style.color).toBe("var(--money)");
    draw({ funds: "$-5,000", fundsNegative: true });
    expect($("#stat-money").style.color).toBe("var(--bad)");
  });

  it("draws the traffic level, its floor, its spoken sentence and the warning", () => {
    draw({
      traffic: {
        level: "backed-up",
        word: "Backed up",
        floor: " · B4",
        spoken: "Traffic: Backed up, worst line on floor B4",
        warn: true,
      },
    });
    expect($("#traffic-glyph").dataset.level).toBe("backed-up");
    expect($("#traffic-label").textContent).toBe("Backed up");
    expect($("#traffic-floor").textContent).toBe(" · B4");
    expect($("#traffic").getAttribute("aria-label")).toBe("Traffic: Backed up, worst line on floor B4");
    expect($("#traffic").classList.contains("traffic-warn")).toBe(true);
    draw();
    expect($("#traffic").classList.contains("traffic-warn")).toBe(false);
  });

  it("calls traffic on a click, Enter or Space on the meter, and on no other key", () => {
    draw();
    $("#traffic").click();
    $("#traffic").dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    const space = new KeyboardEvent("keydown", { key: " ", bubbles: true, cancelable: true });
    $("#traffic").dispatchEvent(space);
    $("#traffic").dispatchEvent(new KeyboardEvent("keydown", { key: "a", bubbles: true }));
    expect(actions.traffic).toHaveBeenCalledTimes(3);
    expect(space.defaultPrevented).toBe(true);
  });

  it("presses in the speed that is on and calls speed with a button's level", () => {
    draw({ speed: 2 });
    const buttons = [...host.querySelectorAll<HTMLButtonElement>("#speed button[data-speed]")];
    expect(buttons.map((b) => b.dataset.speed)).toEqual(["0", "1", "2", "3"]);
    expect(buttons.map((b) => b.classList.contains("active"))).toEqual([false, false, true, false]);
    buttons[0].click();
    buttons[3].click();
    expect(actions.speed.mock.calls).toEqual([[0], [3]]);
  });

  it("keeps a class the game adds to a button, such as the Play nudge, across renders", () => {
    draw();
    const play = $('#speed button[data-speed="1"]');
    play.classList.add("play-nudge");
    draw({ speed: 0, time: "Mon 07:10" });
    expect(play.classList.contains("play-nudge")).toBe(true);
    expect(play.classList.contains("active")).toBe(false);
    expect($('#speed button[data-speed="0"]').classList.contains("active")).toBe(true);
  });

  it("grays Undo and Redo with aria-disabled, and a press on a gray one still reaches the game", () => {
    draw();
    expect($("#btn-undo").getAttribute("aria-disabled")).toBe("true");
    expect($("#btn-redo").hasAttribute("aria-disabled")).toBe(false);
    $("#btn-undo").click();
    $("#btn-redo").click();
    expect(actions.undo).toHaveBeenCalledTimes(1);
    expect(actions.redo).toHaveBeenCalledTimes(1);
    draw({ undoOff: false, redoOff: true });
    expect($("#btn-undo").hasAttribute("aria-disabled")).toBe(false);
    expect($("#btn-redo").getAttribute("aria-disabled")).toBe("true");
  });

  it("shows the speaker's state and calls mute and save", () => {
    draw();
    expect($("#audio-toggle").getAttribute("aria-pressed")).toBe("false");
    expect($("#audio-toggle svg").dataset.icon).toBe("sound");
    draw({ muted: true });
    expect($("#audio-toggle").getAttribute("aria-pressed")).toBe("true");
    expect($("#audio-toggle svg").dataset.icon).toBe("mute");
    $("#audio-toggle").click();
    $("#btn-save-top").click();
    expect(actions.mute).toHaveBeenCalledTimes(1);
    expect(actions.save).toHaveBeenCalledTimes(1);
  });

  it("shows the Update and Install chips only when the game offers them", () => {
    draw();
    expect($("#btn-update").hidden).toBe(true);
    expect($("#btn-install").hidden).toBe(true);
    draw({ update: true, install: true });
    expect($("#btn-update").hidden).toBe(false);
    expect($("#btn-install").hidden).toBe(false);
    $("#btn-update").click();
    $("#btn-install").click();
    expect(actions.update).toHaveBeenCalledTimes(1);
    expect(actions.install).toHaveBeenCalledTimes(1);
  });

  it("keeps the same elements on a pass that changes only the clock", () => {
    draw();
    const time = $("#stat-time");
    const money = $("#stat-money").firstChild;
    const watch = new MutationObserver(() => {});
    watch.observe(host, { subtree: true, childList: true, characterData: true, attributes: true });
    draw({ time: "Mon 07:10" });
    const records = watch.takeRecords();
    watch.disconnect();
    expect($("#stat-time")).toBe(time);
    expect($("#stat-time").textContent).toBe("Mon 07:10");
    expect($("#stat-money").firstChild).toBe(money);
    expect(records.map((r) => r.type)).toEqual(["characterData"]);
    expect(time.contains(records[0].target)).toBe(true);
  });

  it("draws the badge unless the view leaves it out", () => {
    draw();
    expect(host.querySelector(".brand")).not.toBeNull();
    draw({ brand: false });
    expect(host.querySelector(".brand")).toBeNull();
    expect($("#stat-money").textContent).toBe("$2,000,000");
  });

  describe("a page that leaves out an action", () => {
    const without = (key: Exclude<keyof TopBarActions, "speed">) => {
      const { [key]: _gone, ...rest } = actions;
      render(topBarTemplate(VIEW, rest), host);
    };

    it.each([
      ["undo", "#btn-undo"],
      ["redo", "#btn-redo"],
      ["save", "#btn-save-top"],
      ["mute", "#audio-toggle"],
      ["update", "#btn-update"],
      ["install", "#btn-install"],
    ] as const)("draws no control for %s", (key, sel) => {
      without(key);
      expect(host.querySelector(sel)).toBeNull();
      expect(host.querySelectorAll("#speed button[data-speed]")).toHaveLength(4);
    });

    it("draws no traffic meter without a traffic action", () => {
      without("traffic");
      expect(host.querySelector("#traffic")).toBeNull();
      expect($("#stat-pop").textContent).toBe("1,204");
    });

    it("draws no traffic meter without a traffic readout", () => {
      const { traffic: _gone, ...view } = VIEW;
      render(topBarTemplate(view, actions), host);
      expect(host.querySelector("#traffic")).toBeNull();
    });

    it("draws the speeds alone for a page that gives only speed", () => {
      const speed = vi.fn();
      render(topBarTemplate({ ...VIEW, brand: false, traffic: undefined }, { speed }), host);
      expect([...host.querySelectorAll("#speed > *")].map((b) => (b as HTMLElement).dataset.speed)).toEqual([
        "0",
        "1",
        "2",
        "3",
      ]);
      expect(host.querySelector("#traffic, .brand")).toBeNull();
      host.querySelector<HTMLButtonElement>('[data-speed="3"]')!.click();
      expect(speed).toHaveBeenCalledWith(3);
    });
  });

  it.each([
    ["undoOff", "#btn-undo", (el: HTMLElement) => el.getAttribute("aria-disabled") === "true"],
    ["redoOff", "#btn-redo", (el: HTMLElement) => el.getAttribute("aria-disabled") === "true"],
    ["muted", "#audio-toggle", (el: HTMLElement) => el.getAttribute("aria-pressed") === "true"],
    ["update", "#btn-update", (el: HTMLElement) => !el.hidden],
    ["install", "#btn-install", (el: HTMLElement) => !el.hidden],
  ] as const)("follows %s alone across renders", (field, sel, on) => {
    const base = { undoOff: false, redoOff: false, muted: false, update: false, install: false };
    draw(base);
    expect(on($(sel))).toBe(false);
    draw({ ...base, [field]: true });
    expect(on($(sel))).toBe(true);
    draw(base);
    expect(on($(sel))).toBe(false);
  });

  it("redraws the controls for a new actions object on the same bar", () => {
    draw();
    expect(host.querySelector("#btn-undo")).not.toBeNull();
    const speed = vi.fn();
    render(topBarTemplate({ ...VIEW, time: "Mon 07:10" }, { speed }), host);
    expect(host.querySelector("#btn-undo, #btn-save-top, #traffic")).toBeNull();
    host.querySelector<HTMLButtonElement>('[data-speed="0"]')!.click();
    expect(speed).toHaveBeenCalledWith(0);
    expect(actions.speed).not.toHaveBeenCalled();
  });

  it("writes the funds color only when the sign of the funds changes", () => {
    draw();
    const watch = new MutationObserver(() => {});
    watch.observe($("#stat-money"), { attributes: true });
    draw({ funds: "$1,999,000" });
    expect(watch.takeRecords()).toHaveLength(0);
    draw({ funds: "$-5,000", fundsNegative: true });
    expect(watch.takeRecords().map((r) => r.attributeName)).toEqual(["style"]);
    watch.disconnect();
  });
});
