import { describe, expect, it } from "vitest";
import { html, nothing } from "lit-html";
import { renderDetached } from "./detached";

const label = (text: string) => html`<b class="x">${text}</b>`;

describe("renderDetached", () => {
  it("hands back the template's elements and updates them in place once they are placed", () => {
    const drawn = renderDetached(document, label("one"));
    expect(drawn.elements.map((e) => e.outerHTML.replace(/<!--.*?-->/g, ""))).toEqual(['<b class="x">one</b>']);
    const host = document.createElement("div");
    host.append(...drawn.elements);
    drawn.update(label("two"));
    expect(host.firstElementChild).toBe(drawn.elements[0]);
    expect(host.textContent).toBe("two");
  });

  it("throws when an update would draw new elements the page cannot see", () => {
    const drawn = renderDetached(document, label("one"));
    document.createElement("div").append(...drawn.elements);
    expect(() => drawn.update(html`<i>other</i>`)).toThrow(/keep the template's shape/);
    const empty = renderDetached(document, html`${nothing}`);
    expect(() => empty.update(html`${label("late")}`)).toThrow();
  });
});
