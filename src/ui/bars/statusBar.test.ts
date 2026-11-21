import { html, render } from "lit-html";
import { beforeEach, describe, expect, it } from "vitest";
import { statusBarTemplate, type StatusBarView } from "./statusBar";

const VIEW: StatusBarView = {
  hint: "",
  tool: html`<span class="ti-name">Office</span><span>$40,000</span>`,
  tower: "Harmony Tower · Classic",
  news: "",
};

describe("statusBarTemplate", () => {
  let host: HTMLElement;
  const draw = (view: Partial<StatusBarView> = {}) => render(statusBarTemplate({ ...VIEW, ...view }), host);
  const $ = (sel: string) => host.querySelector<HTMLElement>(sel)!;

  beforeEach(() => {
    host = document.createElement("footer");
    host.id = "statusbar";
    host.className = "statusbar";
    document.body.replaceChildren(host);
  });

  it("draws the tool's card, the tower and the cells under the stylesheet's ids", () => {
    draw();
    expect($("#tool-info .ti-name").textContent).toBe("Office");
    expect($("#sb-tower").textContent).toBe("Harmony Tower · Classic");
    expect($("#sb-hint").hidden).toBe(true);
  });

  it("shows the hint only while there is one", () => {
    draw({ hint: "Office: Rent to businesses" });
    expect($("#sb-hint").hidden).toBe(false);
    expect($("#sb-hint").textContent).toBe("Office: Rent to businesses");
    draw();
    expect($("#sb-hint").hidden).toBe(true);
    expect($("#sb-hint").textContent).toBe("");
  });

  it("draws the news line's leading emoji as its icon and keeps the whole line as the tooltip", () => {
    draw({ news: "🔥 A fire broke out on floor 12." });
    expect($("#sb-news svg")?.dataset.icon).toBe("fire");
    expect($("#sb-news").textContent).toBe(" A fire broke out on floor 12.");
    expect($("#sb-news").title).toBe("🔥 A fire broke out on floor 12.");
  });

  it("leaves an empty box with no text, so the stylesheet can hide it", () => {
    draw({ tower: "", news: "" });
    expect($("#sb-tower").textContent).toBe("");
    expect($("#sb-news").textContent).toBe("");
    expect($("#sb-news").hasAttribute("title")).toBe(false);
  });
});
