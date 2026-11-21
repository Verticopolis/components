/**
 * The Tools window (`windows/palette/toolPalette`) with a made-up set of
 * tools: hand-written names, prices and star ranks, never a game's catalog.
 * The star buttons lock and unlock tools as a tower's rating would, the funds
 * button dims what the funds cannot reach, a press picks a tool, and the line
 * under the window shows the hint the game puts on its status bar. The folds
 * are kept in the page's storage, apart from any game's.
 */
import { html, render, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import { ToolPalette, type PaletteGroup, type PaletteTool } from "../lib/ui/palette/toolPalette.js";
import { facilityColor } from "../lib/presentation/facilityPresentation.js";
import type { FacilityKind } from "../lib/render/renderModel.js";

/** A sample tool: its kind, name, price in dollars, the stars it needs, and
 *  whether it is a Modern tool. */
type Sample = readonly [kind: FacilityKind, name: string, price: number, stars: number, modern?: boolean];

const SAMPLES: readonly { title: string; tools: readonly Sample[] }[] = [
  {
    title: "Structure",
    tools: [
      ["floor", "Floor", 500, 1],
      ["lobby", "Lobby", 5_000, 1],
    ],
  },
  {
    title: "Transport",
    tools: [
      ["stairs", "Stairs", 5_000, 1],
      ["elevatorStandard", "Elevator", 200_000, 1],
      ["escalator", "Escalator", 20_000, 3],
    ],
  },
  {
    title: "Commercial",
    tools: [
      ["office", "Office", 40_000, 1],
      ["fastFood", "Fast Food", 100_000, 1],
      ["shop", "Shop", 100_000, 2],
      ["foodHall", "Food Hall", 300_000, 3, true],
    ],
  },
  {
    title: "Living",
    tools: [
      ["condo", "Condo", 80_000, 1],
      ["hotelSingle", "Single Room", 20_000, 2],
    ],
  },
  {
    title: "Leisure",
    tools: [
      ["cinema", "Cinema", 500_000, 3],
      ["spa", "Spa", 400_000, 4, true],
    ],
  },
];

const IDLE = "Point at a tool, or press one.";

/** Where the demo keeps its folds, apart from any game's. */
const FOLD_KEY = "vc-gallery-tools-folded";

function pageStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function money(n: number): string {
  if (n >= 1_000_000) return `$${n / 1_000_000}M`;
  if (n >= 1_000) return `$${n / 1_000}K`;
  return `$${n}`;
}

const PINNED: readonly PaletteTool[] = [
  {
    key: "inspect",
    attr: "tool",
    name: "Inspect",
    color: "#9aa6bd",
    icon: "inspect",
    description: "Point at a room to read how it is doing.",
    label: "Inspect",
  },
  {
    key: "bulldoze",
    attr: "tool",
    name: "Bulldoze",
    color: "#ff6b6b",
    icon: "bulldoze",
    description: "Click a room to tear it down.",
    label: "Bulldoze",
  },
];

function groups(stars: number, funds: number): PaletteGroup[] {
  return SAMPLES.map((g) => ({
    title: g.title,
    tools: g.tools.map(([kind, name, price, need, modern]) => ({
      key: kind,
      attr: "kind" as const,
      name,
      cost: money(price),
      color: facilityColor(kind),
      description: `A sample ${name.toLowerCase()}, ${money(price)}.`,
      label: `${name}, ${money(price)}`,
      modern,
      locked: stars < need,
      unaffordable: funds < price,
    })),
  }));
}

export function paletteDemo(): TemplateResult {
  let stars = 1;
  let funds = 2_000_000;
  let active = "inspect";
  let said = IDLE;
  let line: HTMLElement | null = null;
  let palette: ToolPalette | null = null;
  const update = () => palette?.update({ pinned: PINNED, groups: groups(stars, funds), active });
  const setStars = (n: number) => {
    stars = n;
    update();
    said = `The tower has ${n} ${n === 1 ? "star" : "stars"}.`;
    draw();
  };
  const flipFunds = () => {
    funds = funds > 50_000 ? 20_000 : 2_000_000;
    update();
    said = `The funds are ${money(funds)}.`;
    draw();
  };
  const draw = () => {
    if (!line) return;
    render(
      html`<span class="g-palette-said" role="status">${said}</span>
        <span class="g-row">
          ${[1, 3, 5].map(
            (n) =>
              html`<button
                type="button"
                class="btn"
                aria-pressed=${stars === n ? "true" : "false"}
                @click=${() => setStars(n)}
              >
                ${n} ${n === 1 ? "star" : "stars"}
              </button>`,
          )}
          <button type="button" class="btn" @click=${flipFunds}>Funds: ${money(funds)}</button>
        </span>`,
      line,
    );
  };
  const mount = (el: Element | undefined) => {
    if (!(el instanceof HTMLElement) || palette) return;
    palette = new ToolPalette({
      list: el,
      foldStore: { key: FOLD_KEY, storage: pageStorage() },
      pick: (tool) => {
        active = tool.key;
        update();
        said = `${tool.name} picked.`;
        draw();
      },
      hint: (tool) => {
        said = tool ? `${tool.name}: ${tool.description}` : IDLE;
        draw();
      },
    });
    update();
  };
  return html`<aside id="palette" class="win docked g-palette">
      <div class="win-title">Tools</div>
      <div class="palette-scroll" id="palette-scroll" ${ref(mount)}></div>
    </aside>
    <div
      class="g-palette-line"
      ${ref((el) => {
        if (el instanceof HTMLElement && !line) {
          line = el;
          draw();
        }
      })}
    ></div>`;
}
