import { afterEach, describe, expect, it, vi } from "vitest";
import { html, render } from "lit-html";
import {
  scenarioBestText,
  scenarioDetailsTemplate,
  scenarioGoalsTemplate,
  scenarioLaunchTemplate,
  scenarioRowsTemplate,
  scenarioTrophiesTemplate,
  type ScenarioEntry,
} from "./scenarioList";

const marks = (reached: number, texts: readonly string[]) => texts.map((text, i) => ({ text, earned: reached > i }));

const OPEN: ScenarioEntry = {
  id: "first",
  title: "First Light",
  facts: [
    { label: "Rules", value: "Classic" },
    { label: "Length", value: "6 days" },
  ],
  brief: "One elevator and a full tower.",
  best: 2,
  locked: null,
  goals: [
    { label: "Load, busiest hour", marks: marks(2, ["At most 50%", "At most 25%", "At most 18%"]) },
    { label: "Funds", marks: marks(3, ["At least $1M", "At least $1.5M", "At least $2M"]) },
  ],
};
const FRESH: ScenarioEntry = { ...OPEN, id: "second", title: "Second Wind", best: 0, goals: [] };
const SHUT: ScenarioEntry = { ...OPEN, id: "third", title: "Third Floor", best: 0, locked: "Win Second Wind first." };

const holder = () => {
  const el = document.createElement("div");
  document.body.append(el);
  return el;
};
const text = (el: Element | null) => el?.textContent?.replace(/\s+/g, " ").trim() ?? null;

afterEach(() => {
  document.body.innerHTML = "";
});

describe("the best result in words", () => {
  it("names the best mark, says when none is won yet, and says Locked first", () => {
    expect(scenarioBestText(OPEN)).toBe("Best result: Better");
    expect(scenarioBestText(FRESH)).toBe("Not finished yet");
    expect(scenarioBestText({ best: 3, locked: "Not yet." })).toBe("Locked");
  });
});

describe("the trophies", () => {
  it("lights one trophy per mark reached and puts the best mark's name beside them", () => {
    const el = holder();
    render(scenarioTrophiesTemplate(OPEN), el);
    expect(el.querySelectorAll(".scn-trophy")).toHaveLength(3);
    expect(el.querySelectorAll(".scn-trophy.on")).toHaveLength(2);
    expect(text(el.querySelector(".scn-trophy-word"))).toBe("Better");
    expect(el.querySelector(".scn-trophies")?.getAttribute("aria-label")).toBe("Best result: Better");
  });

  it("lights none before a win and says so", () => {
    const el = holder();
    render(scenarioTrophiesTemplate(FRESH), el);
    expect(el.querySelectorAll(".scn-trophy.on")).toHaveLength(0);
    expect(text(el.querySelector(".scn-trophy-word"))).toBe("Not won yet");
  });
});

describe("the goals table", () => {
  it("lists each goal with its three marks and ticks the ones reached", () => {
    const el = holder();
    render(scenarioGoalsTemplate(OPEN.goals), el);
    expect([...el.querySelectorAll("thead th")].map(text)).toEqual(["Goal", "Goal", "Better", "Best"]);
    const rows = [...el.querySelectorAll("tbody tr")];
    expect(rows.map((r) => text(r.querySelector("th")))).toEqual(["Load, busiest hour", "Funds"]);
    expect([...rows[0]!.querySelectorAll("td")].map((td) => td.classList.contains("earned"))).toEqual([
      true,
      true,
      false,
    ]);
    expect(rows[1]!.querySelectorAll("td.earned")).toHaveLength(3);
    expect(text(rows[0]!.querySelector("td"))).toBe("✓At most 50% (reached)");
  });
});

describe("a goal with fewer marks", () => {
  it("leaves the later cells empty so the columns stay in line", () => {
    const el = holder();
    render(scenarioGoalsTemplate([{ label: "Funds", marks: marks(1, ["At least $1M"]) }]), el);
    const cells = [...el.querySelectorAll("tbody td")];
    expect(cells).toHaveLength(3);
    expect(cells.map(text)).toEqual(["✓At least $1M (reached)", "", ""]);
  });
});

describe("the details", () => {
  it("shows the facts, the result, the situation and the goals of an open scenario", () => {
    const el = holder();
    render(scenarioDetailsTemplate(OPEN), el);
    expect(text(el.querySelector(".scn-h"))).toBe("First Light");
    expect([...el.querySelectorAll("dt")].map(text)).toEqual(["Rules", "Length", "Result"]);
    expect([...el.querySelectorAll("legend")].map(text)).toEqual(["Situation", "Goals"]);
    expect(el.querySelector(".scn-lock")).toBeNull();
  });

  it("shows why a locked scenario is shut, and neither its situation nor its goals", () => {
    const el = holder();
    render(scenarioDetailsTemplate(SHUT), el);
    expect(text(el.querySelector(".scn-lock"))).toBe("Win Second Wind first.");
    expect(el.querySelector("legend")).toBeNull();
    expect(el.querySelector(".scn-trophies")).toBeNull();
  });
});

describe("the rows", () => {
  it("numbers the rows and plays an open one from its button", () => {
    const play = vi.fn();
    const el = holder();
    render(scenarioRowsTemplate([OPEN, FRESH, SHUT], { play }), el);
    expect([...el.querySelectorAll(".scn-num")].map(text)).toEqual(["1", "2", "3"]);
    expect(text(el.querySelector(".scn-meta"))).toBe("Classic · 6 days");
    el.querySelector<HTMLButtonElement>('button[aria-label="Play Second Wind"]')!.click();
    expect(play).toHaveBeenCalledWith("second");
  });

  it("gives a locked row its reason and no Play button", () => {
    const el = holder();
    render(scenarioRowsTemplate([SHUT], { play: vi.fn() }), el);
    expect(el.querySelector(".scn-row")?.classList.contains("locked")).toBe(true);
    expect(text(el.querySelector(".scn-brief"))).toBe("Win Second Wind first.");
    expect(el.querySelector("button")).toBeNull();
    expect(text(el.querySelector(".scn-locked"))).toBe("Locked");
  });
});

describe("the launch window", () => {
  it("draws the title, the heading, the rows and the caller's foot", () => {
    const el = holder();
    render(
      scenarioLaunchTemplate(
        {
          title: "Sample Game",
          icon: "brand",
          heading: "Choose a scenario",
          entries: [OPEN],
          foot: html`<button type="button" class="btn">Sandbox</button>`,
        },
        { play: vi.fn() },
      ),
      el,
    );
    expect(text(el.querySelector(".win-title"))).toBe("Sample Game");
    expect(el.querySelector('.win-title svg[data-icon="brand"]')).not.toBeNull();
    expect(el.querySelector("section")?.getAttribute("aria-labelledby")).toBe("scn-launch-title");
    expect(text(el.querySelector(".scn-launch-h"))).toBe("Choose a scenario");
    expect(el.querySelectorAll(".scn-row")).toHaveLength(1);
    expect(text(el.querySelector(".scn-foot"))).toBe("Sandbox");
  });

  it("leaves the foot out when none is given", () => {
    const el = holder();
    render(scenarioLaunchTemplate({ title: "T", heading: "H", entries: [] }, { play: vi.fn() }), el);
    expect(el.querySelector(".scn-foot")).toBeNull();
    expect(el.querySelector(".win-title svg")).toBeNull();
  });
});
