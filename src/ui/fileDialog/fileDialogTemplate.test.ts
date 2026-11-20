import { html, render } from "lit-html";
import { describe, expect, it, vi } from "vitest";
import {
  fileDialogTemplate,
  fileSizeText,
  usageText,
  type FileDialogHandlers,
  type FileDialogView,
} from "./fileDialogTemplate";
import { BASICS, WORDS } from "./fileDialogTestKit.fixture";

const handlers = new Proxy({}, { get: () => vi.fn() }) as FileDialogHandlers;
const view = (over: Partial<FileDialogView> = {}): FileDialogView => ({
  mode: "open",
  words: BASICS.words,
  kinds: BASICS.kinds,
  saveKind: BASICS.saveKind,
  nameMax: BASICS.nameMax,
  rows: [
    { id: "auto", name: "Auto-save (Sky)", kind: "auto", pinned: true, modified: 0 },
    { id: "a", name: "Spire", kind: "tower", size: 2048, modified: 0 },
    { id: "b", name: "OLD", kind: "tdt", size: 300, modified: 0 },
  ],
  selected: null,
  name: "",
  filter: "all",
  sort: { key: "modified", down: true },
  usage: { count: 2, bytes: 2348 },
  loading: false,
  line: null,
  ask: null,
  renaming: null,
  menu: null,
  busy: false,
  dropping: false,
  canPaste: false,
  kept: false,
  place: "local",
  linked: null,
  canLink: false,
  canPickFolder: false,
  canVersions: false,
  where: "computer",
  lookOpen: false,
  ...over,
});
const draw = (v: FileDialogView) => {
  render(html`<div id="host"></div>`, document.body);
  const el = document.getElementById("host")!;
  render(fileDialogTemplate(v, handlers), el);
  return el;
};

describe("the Open and Save As windows' text", () => {
  it("gives sizes in KB under a megabyte and MB above", () => {
    expect([fileSizeText(300), fileSizeText(2048), fileSizeText(50 * 1024), fileSizeText(3 * 1024 * 1024)]).toEqual([
      "0.3 KB",
      "2.0 KB",
      "50 KB",
      "3.0 MB",
    ]);
  });

  it("sums up the folder", () => {
    expect([
      usageText({ count: 0, bytes: 0 }, WORDS),
      usageText({ count: 1, bytes: 2048 }, WORDS),
      usageText({ count: 12, bytes: 2 * 1024 * 1024 }, WORDS),
    ]).toEqual(["No towers yet", "1 tower, 2.0 KB", "12 towers, 2.0 MB"]);
  });

  it("names each row and its type for a screen reader, and draws one icon per row", () => {
    const el = draw(view());
    const options = [...el.querySelectorAll('[role="option"]')];
    expect(options.map((o) => o.getAttribute("aria-label"))).toEqual([
      "Auto-save (Sky)",
      "Spire, Tower",
      "OLD, SimTower 1994",
    ]);
    expect(options.every((o) => o.querySelectorAll("svg").length === 1)).toBe(true);
    expect(el.querySelector(".fd-where")!.textContent).toContain("Look in:");
    expect(el.querySelector(".fd-usage")!.textContent).toBe("2 towers, 2.3 KB");
  });

  it("grays the file buttons until a file is picked, and the Auto-save is not a file", () => {
    const disabled = (v: FileDialogView) =>
      [...draw(v).querySelectorAll<HTMLButtonElement>(".fd-tools .btn")]
        .filter((b) => b.disabled)
        .map((b) => b.textContent);
    expect(disabled(view())).toEqual(["Rename", "Duplicate", "Delete"]);
    expect(disabled(view({ selected: "auto" }))).toEqual(["Rename", "Duplicate", "Delete"]);
    expect(disabled(view({ selected: "a" }))).toEqual([]);
  });

  it("offers Previous versions… on the save kind's right-click menu in the home folder only", () => {
    const items = (id: string, over: Partial<FileDialogView> = {}) =>
      [
        ...draw(view({ canVersions: true, menu: { id, x: 0, y: 0 }, ...over })).querySelectorAll(
          ".fd-menu [role=menuitem]",
        ),
      ].map((b) => b.textContent!.trim());
    expect(items("a")).toContain("Previous versions…");
    expect(items("b"), "a 1994 file has none").not.toContain("Previous versions…");
    expect(items("a", { canVersions: false })).not.toContain("Previous versions…");
    expect(items("a", { place: "linked" }), "the linked folder's files have none").not.toContain("Previous versions…");
  });

  it("marks the sorted column and offers Save in Save As", () => {
    const el = draw(view({ mode: "saveAs", sort: { key: "name", down: false } }));
    expect(el.querySelector(".fd-col-name")!.textContent).toBe("Name ▲");
    expect(el.querySelector(".fd-col-modified")!.textContent).toBe("Modified");
    expect(el.querySelector(".fd-primary")!.textContent).toBe("Save");
    expect(el.querySelector(".fd-where")!.textContent).toContain("Save in:");
  });
});

describe("the kinds and words a game hands the windows", () => {
  it("lists each kind with a type list entry after the game's All entry", () => {
    const options = [...draw(view()).querySelectorAll("#fd-type option")].map((o) => o.textContent);
    expect(options).toEqual(["All towers", "Tower (*.vctower)", "SimTower 1994 (*.TDT)"]);
  });

  it("offers the save kind's entry in Save As, and the game's nouns in its lines", () => {
    const el = draw(view({ mode: "saveAs", rows: [], loading: false }));
    expect([...el.querySelectorAll("#fd-type option")].map((o) => o.textContent)).toEqual(["Tower (*.vctower)"]);
    expect(el.querySelector(".fd-empty")!.textContent).toBe("No towers yet.");
    const files = { ...WORDS, one: "map", many: "maps", home: "My Maps" };
    const maps = draw(view({ words: files, rows: [], loading: true }));
    expect(maps.querySelector(".fd-empty")!.textContent).toBe("Opening My Maps…");
    expect(maps.querySelector(".fd-look-now")!.textContent).toContain("My Maps");
  });
});
