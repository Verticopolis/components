import { render } from "lit-html";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { updateBoxView, type UpdateBoxView } from "./updateBox";

const BOX: UpdateBoxView = {
  title: "Update available",
  text: ["A newer version is ready.", "Or keep going: it applies next time."],
  version: "2.1.0",
  notes: ["Faster saves.", "A new room."],
  shortNotes: 3,
};

describe("updateBoxView", () => {
  let host: HTMLElement;
  const actions = { later: vi.fn(), update: vi.fn() };
  const draw = (view: Partial<UpdateBoxView> = {}) => {
    const v = updateBoxView({ ...BOX, ...view }, actions);
    render(v.body, host);
    return v;
  };
  const $ = (sel: string) => host.querySelector<HTMLElement>(sel);
  const texts = (sel: string) => [...host.querySelectorAll(sel)].map((e) => e.textContent);

  beforeEach(() => {
    host = document.createElement("div");
    document.body.replaceChildren(host);
    actions.later.mockClear();
    actions.update.mockClear();
  });

  it("draws the title, the text, a short list of notes and the two buttons, Later focused", () => {
    expect(draw().title).toBe("Update available");
    expect(texts(":scope > p")).toEqual(["A newer version is ready.", "Or keep going: it applies next time."]);
    expect($(".whatsnew .win-title")?.textContent).toBe("What's new");
    expect(texts(".whatsnew li")).toEqual(["Faster saves.", "A new room."]);
    expect($(".whatsnew-log")).toBeNull();
    expect(texts(".modal-footer button")).toEqual(["Later", "Update now"]);
    expect($('[data-act="later"]')?.hasAttribute("autofocus")).toBe(true);
  });

  it("calls later and update from their buttons", () => {
    draw();
    $('[data-act="later"]')!.click();
    $('[data-act="update"]')!.click();
    expect(actions.later).toHaveBeenCalledTimes(1);
    expect(actions.update).toHaveBeenCalledTimes(1);
  });

  it("puts a release's notes past shortNotes in the labeled scrolling well", () => {
    draw({ shortNotes: 1 });
    const log = $(".whatsnew-log")!;
    expect(log.getAttribute("role")).toBe("region");
    expect(log.getAttribute("tabindex")).toBe("0");
    expect(log.getAttribute("aria-labelledby")).toBe("whatsnew-title");
    expect($("#whatsnew-title")?.textContent).toBe("What's new");
    expect(texts(".whatsnew-log li")).toEqual(["Faster saves.", "A new room."]);
  });

  it("draws every skipped version's notes newest first, with the version last seen and the note on older ones", () => {
    draw({
      releases: [
        { version: "2.1.0", notes: ["A new room."] },
        { version: "2.0.1", notes: ["A fix."] },
      ],
      since: "2.0.0",
      more: true,
    });
    expect($("#whatsnew-title")?.textContent).toBe("What's new since 2.0.0");
    expect(texts(".whatsnew-ver")).toEqual(["2.1.0", "2.0.1"]);
    expect(texts(".whatsnew-log li")).toEqual(["A new room.", "A fix."]);
    expect($(".whatsnew-more")?.textContent).toBe("Earlier updates are not listed here.");
  });

  it("draws one skipped version as the log when it is not the incoming one", () => {
    draw({ notes: [], releases: [{ version: "2.0.1", notes: ["A fix."] }] });
    expect(texts(".whatsnew-ver")).toEqual(["2.0.1"]);
    draw({ releases: [{ version: "2.1.0", notes: ["A new room."] }] });
    expect($(".whatsnew-ver")).toBeNull();
    expect(texts(".whatsnew li")).toEqual(["Faster saves.", "A new room."]);
  });

  it("links every release's notes in a new tab, only under notes", () => {
    draw({ allNotesHref: "https://example.com/changelog" });
    const link = $('[data-act="release-notes"]') as HTMLAnchorElement;
    expect(link.getAttribute("href")).toBe("https://example.com/changelog");
    expect(link.target).toBe("_blank");
    expect(link.textContent).toBe("All release notes (opens in a new tab)");
    draw({ notes: [], allNotesHref: "https://example.com/changelog" });
    expect($(".whatsnew")).toBeNull();
    expect($('[data-act="release-notes"]')).toBeNull();
  });

  it("draws the kind line, the build lines and the caller's button words", () => {
    draw({
      kind: "Game update",
      buildLines: ["Engine 1.2.3", "Build 2.1.0 · 1a2b3c4"],
      laterLabel: "Not now",
      updateLabel: "Restart",
    });
    expect($(".update-kind strong")?.textContent).toBe("Game update");
    expect(texts(".build-id")).toEqual(["Engine 1.2.3", "Build 2.1.0 · 1a2b3c4"]);
    expect(texts(".modal-footer button")).toEqual(["Not now", "Restart"]);
  });
});
