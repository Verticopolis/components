import { html, render } from "lit-html";
import { describe, expect, it, vi } from "vitest";
import { catalogFor } from "../tests/catalogFixture";
import {
  loadLines,
  occupantsText,
  refusalCardTemplate,
  statusText,
  transportCardTemplate,
  unitCardTemplate,
  type InspectUnit,
} from "./inspectCard";

const classic = catalogFor("classic");
const modern = catalogFor("modern");

const office: InspectUnit = {
  kind: "office",
  floor: 4,
  state: "occupied",
  satisfaction: 0.734,
  occupants: 4,
  customersIn: null,
  residents: null,
  workersComing: 2,
  label: "Office",
  subtype: null,
  vacateReason: null,
};

function drawn(tpl: ReturnType<typeof unitCardTemplate>): HTMLElement {
  const el = document.createElement("div");
  render(tpl, el);
  return el;
}

const lines = (el: HTMLElement): string[] => [...el.children].map((c) => c.textContent ?? "");

describe("the room card", () => {
  it("names the room, its floor, status, people and satisfaction", () => {
    const el = drawn(unitCardTemplate(office, classic, 10, []));
    expect(lines(el)).toEqual([
      "Office",
      "Floor 4",
      "Status: occupied",
      "Occupants: 4/6, 2 on the way",
      "Satisfaction: 73%",
    ]);
  });

  it("titles a shop by its own name and shows a rename under it, never the title twice", () => {
    const shop = { ...office, kind: "fastFood" as const, subtype: "Chinese Cafe", customersIn: 9, floor: 0 };
    expect(lines(drawn(unitCardTemplate({ ...shop, label: "Chinese Cafe" }, classic, 10, [])))).toEqual([
      "Chinese Cafe",
      "B1",
      "Status: occupied",
      "Customers: 9",
      "Satisfaction: 73%",
    ]);
    const renamed = drawn(unitCardTemplate({ ...shop, label: "Lucky Noodle" }, classic, 10, []));
    expect(lines(renamed)[1]).toBe("Lucky NoodleB1");
  });

  it("marks a rented shop closed outside its hours, but not an empty one", () => {
    const shop = { ...office, kind: "fastFood" as const, customersIn: 0 };
    expect(lines(drawn(unitCardTemplate(shop, classic, 3, [])))).toContain("Customers: 0 (closed)");
    expect(lines(drawn(unitCardTemplate({ ...shop, state: "empty" }, classic, 3, [])))).toContain("Customers: 0");
  });

  it("draws no customers line for a shop or spa with no reported count", () => {
    const shop = { ...office, kind: "fastFood" as const, label: "Fast Food", customersIn: null };
    expect(lines(drawn(unitCardTemplate(shop, classic, 10, [])))).toEqual([
      "Fast Food",
      "Floor 4",
      "Status: occupied",
      "Satisfaction: 73%",
    ]);
    const spa = { ...office, kind: "spa" as const, label: "Spa", customersIn: null };
    expect(lines(drawn(unitCardTemplate(spa, modern, 10, []))).filter((l) => l.startsWith("Customers"))).toEqual([]);
  });

  it("counts a venue's audience as customers", () => {
    const cinema = { ...office, kind: "cinema" as const, customersIn: 12 };
    expect(lines(drawn(unitCardTemplate(cinema, classic, 14, [])))).toContain("Customers: 12");
  });

  it("counts a household against its own size where the mode sizes households", () => {
    const condo = { ...office, kind: "condo" as const, occupants: 2, residents: 4, workersComing: null };
    expect(lines(drawn(unitCardTemplate(condo, modern, 10, [])))).toContain("Occupants: 2/4");
    expect(lines(drawn(unitCardTemplate(condo, classic, 10, [])))).toContain("Occupants: 2/3");
  });

  it("puts the game's problem lines above the satisfaction", () => {
    const warn = html`<div>Elevator wait too long</div>`;
    const got = lines(drawn(unitCardTemplate(office, classic, 10, [warn])));
    expect(got.slice(-2)).toEqual(["Elevator wait too long", "Satisfaction: 73%"]);
  });

  it("carries a ✕ only when the game gives it a close", () => {
    expect(drawn(unitCardTemplate(office, classic, 10, [])).querySelector(".insp-close")).toBeNull();
    const close = vi.fn();
    const x = drawn(unitCardTemplate(office, classic, 10, [], { close })).querySelector<HTMLButtonElement>(
      "h4 .insp-close",
    );
    expect(x?.getAttribute("aria-label")).toBe("Close");
    x?.click();
    expect(close).toHaveBeenCalledOnce();
  });
});

describe("the status line", () => {
  it("words the states that would read as jargon", () => {
    expect(statusText({ state: "vacating", vacateReason: "congestion" })).toBe("on notice (tenant leaving)");
    expect(statusText({ state: "vacating", vacateReason: "relocation" })).toBe("on notice (household relocating)");
    expect(statusText({ state: "dirty", vacateReason: null })).toBe("dirty (awaiting housekeeping)");
    expect(statusText({ state: "infested", vacateReason: null })).toBe("cockroach infested");
    expect(statusText({ state: "asleep", vacateReason: null })).toBe("occupied (guest asleep)");
    expect(statusText({ state: "empty", vacateReason: null })).toBe("empty");
  });
});

describe("the people and load lines", () => {
  it("adds the workers on their way only when some are", () => {
    expect(occupantsText(6, 6, null)).toBe("6/6");
    expect(occupantsText(6, 6, 0)).toBe("6/6");
    expect(occupantsText(3, 6, 3)).toBe("3/6, 3 on the way");
  });

  it("words an elevator's load, with the fix only where the mode advises one", () => {
    const one = (t: ReturnType<typeof loadLines>) => lines(drawn(html`${t}`));
    expect(one(loadLines(0.42, false, true))).toEqual(["Avg load: 42% full"]);
    expect(one(loadLines(0.97, true, false))).toEqual(["Avg load: 97% full. Near capacity."]);
    expect(one(loadLines(0.97, true, true))).toEqual([
      "Avg load: 97% full. Near capacity; consider more cars or a parallel shaft.",
    ]);
    expect(loadLines(null, false, true)).toEqual([]);
    expect(loadLines(Number.NaN, false, true)).toEqual([]);
  });
});

describe("the shaft and refusal cards", () => {
  it("names a shaft's floors and an elevator's cars", () => {
    const shaft = { kind: "elevatorStandard" as const, bottom: 0, top: 12, cars: 3 };
    expect(lines(drawn(transportCardTemplate(shaft, classic, [])))).toEqual([
      "Standard Elevator",
      "Serves floors B1–12",
      "Cars: 3",
    ]);
    const stairs = { ...shaft, kind: "stairs" as const, bottom: 1, top: 2 };
    expect(lines(drawn(transportCardTemplate(stairs, classic, [])))).toEqual(["Stairway", "Serves floors 1–2"]);
  });

  it("says why a build is refused", () => {
    const el = drawn(refusalCardTemplate("Not enough money"));
    expect(lines(el)).toEqual(["Can't build here", "Not enough money"]);
    expect(el.querySelector(".preview-refuse")).not.toBeNull();
  });
});
