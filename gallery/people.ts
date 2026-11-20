/**
 * The people page: every look a figure in the tower can wear, each walk
 * frame, pose and mood, and the room builds, all drawn by the package's own
 * people painter (`src/render/pixelSprites/people.ts`). Every strip shows the
 * evening (lit) frames first and the daytime (flat) frames after a gap.
 */
import {
  CAST,
  LOOK,
  LOOKS,
  STAFF_LOOK,
  WALK_FRAMES,
  drawPerson,
  type Carry,
  type DrawOptions,
  type HairStyle,
  type Look,
  type Mood,
  type Pose,
} from "../lib/render/pixelSprites/people.js";
import { personHiVis, personSeated, personStanding, personWalker, sleeper } from "../lib/render/pixelSprites/common.js";
import { canvasFor, figure } from "./canvas.js";

/** Magnification, a whole multiple so world pixels stay square blocks. */
const MAG = 3;
/** One figure's slot in world pixels: room for a suitcase behind and a cart ahead. */
const SLOT = 26;
/** The gap between the lit frames and the flat ones. */
const GAP = 8;
const STRIP_H = 40;
const FOOT = 33;
const FLOOR = "#2A2E38";
const FLOOR_EDGE = "#3A3E48";

/** A canvas at its own size: the page shrinks it only to fit a narrow screen. */
function stripCanvas(w: number, label: string): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const [canvas, ctx] = canvasFor(w * MAG, STRIP_H * MAG, label);
  canvas.style.width = `${w * MAG}px`;
  ctx.scale(MAG, MAG);
  return [canvas, ctx];
}

/** One drawing in a strip: a look and how to draw it. */
interface Shot {
  readonly look: Look;
  readonly o: DrawOptions;
}

/** A strip of figures standing on one floor: the lit shots, a gap, then the flat ones. */
function strip(title: string, caption: string, lit: readonly Shot[], flat: readonly Shot[]): HTMLElement {
  const gap = lit.length > 0 && flat.length > 0 ? GAP : 0;
  const w = (lit.length + flat.length) * SLOT + gap;
  const [canvas, ctx] = stripCanvas(w, `${title}: ${caption}`);
  ctx.fillStyle = FLOOR_EDGE;
  ctx.fillRect(0, FOOT + 1, w, 1);
  ctx.fillStyle = FLOOR;
  ctx.fillRect(0, FOOT + 2, w, STRIP_H - FOOT - 2);
  lit.forEach((s, i) => drawPerson(ctx, i * SLOT + 7, FOOT, s.look, s.o));
  flat.forEach((s, i) => drawPerson(ctx, (lit.length + i) * SLOT + gap + 7, FOOT, s.look, s.o));
  return figure(canvas, title, caption);
}

/** The walk cycle: every lit frame, then the flat look's two. */
function walkCycle(look: Look, pose: Pose = "walk"): [Shot[], Shot[]] {
  const lit = Array.from({ length: WALK_FRAMES.lit }, (_, frame) => ({ look, o: { lit: true, frame, pose } }));
  const flat = [0, 2].map((frame) => ({ look, o: { lit: false, frame, pose } }));
  return [lit, flat];
}

/** One pose, lit and flat. */
function both(look: Look, o: Omit<DrawOptions, "lit">): [Shot[], Shot[]] {
  return [[{ look, o: { ...o, lit: true } }], [{ look, o: { ...o, lit: false } }]];
}

const HAIR: Record<HairStyle, string> = {
  short: "short hair",
  crop: "cropped hair",
  long: "long hair",
  bob: "a bob",
  bun: "a bun",
  curly: "curly hair",
  bald: "bald",
  cap: "a cap",
  guardCap: "a guard's cap",
  beanie: "a beanie",
  hardhat: "a hard hat",
};

const CARRY: Record<Carry, string> = {
  none: "empty hands",
  briefcase: "a briefcase",
  bag: "a handbag",
  suitcase: "a suitcase",
  coffee: "a coffee",
  cart: "a cart",
  flashlight: "a flashlight",
  vacuum: "a vacuum",
  sack: "a sack",
};

const TOP: Record<Look["topKind"], string> = {
  suit: "suit",
  blouse: "blouse",
  tee: "T-shirt",
  sweater: "sweater",
  uniform: "uniform",
};

/** A look in a few plain words: what they wear, their hair and what they hold. */
function describe(look: Look): string {
  const top = TOP[look.topKind] + (look.skirt ? " and skirt" : "");
  return `${top}, ${HAIR[look.hairStyle]}, ${CARRY[look.carry]}`;
}

function section(heading: string, note: string, items: HTMLElement[]): HTMLElement {
  const wrap = document.createElement("section");
  wrap.className = "g-people-section";
  const h = document.createElement("h3");
  h.textContent = heading;
  const p = document.createElement("p");
  p.textContent = note;
  const grid = document.createElement("div");
  grid.className = "g-people";
  grid.append(...items);
  wrap.append(h, p, grid);
  return wrap;
}

function tenants(): HTMLElement {
  const items = CAST.map((look, i) => strip(`Visitor ${i + 1}`, describe(look), ...walkCycle(look)));
  return section("Tenants and visitors", "The civilian cast walking: four lit frames, then the two flat ones.", items);
}

function crew(): HTMLElement {
  const faces = LOOK.housekeeperCleaning - LOOK.housekeeper;
  const items = Array.from({ length: faces }, (_, i) => {
    const withCart = LOOKS[LOOK.housekeeper + i];
    const cleaning = LOOKS[LOOK.housekeeperCleaning + i];
    const lit: Shot[] = [
      { look: withCart, o: { lit: true, frame: 0, pose: "push" } },
      { look: withCart, o: { lit: true, frame: 2, pose: "push" } },
      { look: cleaning, o: { lit: true, frame: 0, pose: "push" } },
      { look: cleaning, o: { lit: true, frame: 1, pose: "push" } },
      { look: withCart, o: { lit: true, pose: "bend" } },
    ];
    const flat: Shot[] = [
      { look: withCart, o: { lit: false, frame: 0, pose: "push" } },
      { look: cleaning, o: { lit: false, frame: 0, pose: "push" } },
    ];
    return strip(`Housekeeper ${i + 1}`, `${describe(withCart)}: pushing the cart, vacuuming, making a bed`, lit, flat);
  });
  return section("Housekeeping crew", "One uniform on six different people, with the cart and the vacuum.", items);
}

function staff(): HTMLElement {
  const guard = STAFF_LOOK.security;
  const fixer = STAFF_LOOK.maintenance;
  const thief = STAFF_LOOK.thief;
  const [thiefRunLit, thiefRunFlat] = walkCycle(thief, "run");
  const items = [
    strip("Security guard", `${describe(guard)}, walking`, ...walkCycle(guard)),
    strip("Security guard on the stairs", "climbing during a search", ...walkCycle(guard, "climb")),
    strip("Maintenance", `${describe(fixer)}, walking`, ...walkCycle(fixer)),
    strip("Thief", `${describe(thief)}, running`, thiefRunLit, thiefRunFlat),
    strip("Thief, caught", "hands up, the sack dropped", ...both(thief, { pose: "caught", empty: true })),
  ];
  return section("Staff and the thief", "The guard, the maintenance crew and the thief.", items);
}

const POSES: readonly { pose: Pose; title: string; caption: string }[] = [
  { pose: "walk", title: "Walk", caption: "arms swing with the stride" },
  { pose: "stand", title: "Stand", caption: "arms at the sides" },
  { pose: "watch", title: "Watch", caption: "checks the time while waiting" },
  { pose: "hips", title: "Hips", caption: "hands on hips, impatient" },
  { pose: "armsUp", title: "Arms up", caption: "both arms thrown up, fed up" },
  { pose: "climb", title: "Climb", caption: "on the emergency stairs" },
  { pose: "push", title: "Push", caption: "pushing a cart or a vacuum" },
  { pose: "bend", title: "Bend", caption: "leaning over a bed" },
  { pose: "run", title: "Run", caption: "a longer stride" },
  { pose: "caught", title: "Caught", caption: "hands up" },
];

function poses(): HTMLElement {
  const look = CAST[2];
  const items = POSES.map((p) => strip(p.title, p.caption, ...both(look, { pose: p.pose, frame: 0, empty: true })));
  return section("Poses", "Every pose, lit and flat, on one visitor with nothing in hand.", items);
}

const MOODS: readonly { mood: Mood; pose: Pose; title: string; caption: string }[] = [
  { mood: "content", pose: "stand", title: "Content", caption: "their own clothes" },
  { mood: "impatient", pose: "hips", title: "Impatient", caption: "an orange top, hands on hips" },
  { mood: "fedUp", pose: "armsUp", title: "Fed up", caption: "a red top, arms thrown up" },
];

function moods(): HTMLElement {
  const items = MOODS.map((m) => {
    const lit = CAST.slice(0, 3).map((look) => ({ look, o: { lit: true, pose: m.pose, mood: m.mood } }));
    const flat = CAST.slice(0, 3).map((look) => ({ look, o: { lit: false, pose: m.pose, mood: m.mood } }));
    return strip(m.title, m.caption, lit, flat);
  });
  return section("Moods", "How a wait shows: the top takes the mood's color.", items);
}

/** The room builds, drawn the way the rooms draw their guests. */
function rooms(): HTMLElement {
  const w = 5 * SLOT;
  const items: HTMLElement[] = [];
  const builds: readonly [string, string, (ctx: CanvasRenderingContext2D, x: number, seed: number) => void][] = [
    ["Seated", "at a table or a desk", (ctx, x, seed) => personSeated(ctx, x, FOOT - 6, seed)],
    ["Standing", "at a counter", (ctx, x, seed) => personStanding(ctx, x, FOOT, seed)],
    ["Walking", "across a room", (ctx, x, seed) => personWalker(ctx, x, FOOT, seed)],
    ["Tradesperson", "hard hat and stripe", (ctx, x, seed) => personHiVis(ctx, x, FOOT, seed)],
  ];
  for (const [title, caption, draw] of builds) {
    const [canvas, ctx] = stripCanvas(w, `${title}: ${caption}`);
    ctx.fillStyle = FLOOR;
    ctx.fillRect(0, FOOT + 2, w, STRIP_H - FOOT - 2);
    for (let i = 0; i < 5; i++) {
      if (title === "Seated") {
        ctx.fillStyle = "#6E4A30"; // a plain bench to sit on
        ctx.fillRect(i * SLOT + 4, FOOT - 6, 14, 2);
        ctx.fillRect(i * SLOT + 5, FOOT - 4, 1, 6);
        ctx.fillRect(i * SLOT + 16, FOOT - 4, 1, 6);
      }
      draw(ctx, i * SLOT + 7, i);
    }
    items.push(figure(canvas, title, caption));
  }
  const [canvas, ctx] = stripCanvas(w, "Asleep: a guest in bed at night");
  for (let i = 0; i < 3; i++) {
    const x = i * 42 + 3;
    ctx.fillStyle = "#5A4030"; // the bed frame, then the pillow under the head
    ctx.fillRect(x, FOOT - 4, 38, 6);
    ctx.fillStyle = "#E8E4DA";
    ctx.fillRect(x + 1, FOOT - 7, 8, 3);
    sleeper(ctx, x + 2, FOOT - 10, 30, ["#5A6E8C", "#8C4A5A", "#4A7A5A"][i], i);
  }
  items.push(figure(canvas, "Asleep", "a guest in bed at night"));
  return section("In rooms", "The builds the rooms draw their guests in, and a sleeper.", items);
}

/** The people page's demo. */
export function people(): HTMLElement {
  const holder = document.createElement("div");
  holder.className = "g-people-page";
  holder.append(tenants(), crew(), staff(), poses(), moods(), rooms());
  return holder;
}
