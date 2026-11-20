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

type Spies = { [K in keyof TopBarActions]: Mock<TopBarActions[K]> };

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
    draw({ time: "Mon 07:10" });
    expect($("#stat-time")).toBe(time);
    expect($("#stat-time").textContent).toBe("Mon 07:10");
    expect($("#stat-money").firstChild).toBe(money);
  });
});
