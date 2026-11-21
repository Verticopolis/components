import { describe, expect, it, vi } from "vitest";
import { deskMode } from "./deskPocket";
import {
  DESK_QUERIES,
  deskScreenOf,
  heedDeskSwitch,
  readDeskSwitch,
  watchDeskScreen,
  type DeskQueries,
} from "./deskScreen";
import type { Store } from "./deskStore";

function store(seed: Record<string, string> = {}): Store & { data: Record<string, string> } {
  const data = { ...seed };
  return { data, getItem: (k) => data[k] ?? null, setItem: (k, v) => void (data[k] = v) };
}

/** A window whose media queries match the ones in `on`. */
function screen(on: readonly string[]) {
  const listeners = new Map<string, () => void>();
  const win = {
    matchMedia: (q: string) => ({
      matches: on.includes(q),
      addEventListener: (_: string, fn: () => void) => listeners.set(q, fn),
      removeEventListener: (_: string, fn: () => void) => listeners.get(q) === fn && listeners.delete(q),
    }),
  } as unknown as Window;
  return { win, listeners };
}

describe("the desk switch", () => {
  it("keeps ?desk=on, pocket and off, and leaves any other address alone", () => {
    const place = { store: store(), key: "vc-desk" };
    expect(heedDeskSwitch("https://x.test/", place)).toBeNull();
    expect(heedDeskSwitch("https://x.test/?desk=on", place)).toBe("any");
    expect(heedDeskSwitch("https://x.test/?other=1", place)).toBe("any");
    expect(heedDeskSwitch("https://x.test/?desk=pocket", place)).toBe("pocket");
    expect(heedDeskSwitch("https://x.test/?desk=toString", place)).toBe("pocket");
    expect(heedDeskSwitch("https://x.test/?desk=off", place)).toBe("off");
    expect(heedDeskSwitch("not a url", place)).toBe("off");
    expect(heedDeskSwitch("", place)).toBe("off");
    expect(place.store.data["vc-desk"]).toBe("off");
  });

  it("reads the parameter the page names, and ignores a kept value it does not know", () => {
    const place = { store: store(), key: "k", param: "windows" };
    expect(heedDeskSwitch("https://x.test/?desk=off&windows=on", place)).toBe("any");
    expect(readDeskSwitch({ store: store({ k: "sideways" }), key: "k" })).toBeNull();
    expect(readDeskSwitch({ store: null, key: "k" })).toBeNull();
  });
});

describe("deskScreenOf", () => {
  it("reads the game's queries into deskMode's facts", () => {
    const { win } = screen([DESK_QUERIES.computer, DESK_QUERIES.wide]);
    const s = deskScreenOf(win, null);
    expect(s).toEqual({ forced: null, computer: true, wide: true, touch: false, roomy: false });
    expect(deskMode(s)).toBe("desk");
    expect(deskMode(deskScreenOf(screen([DESK_QUERIES.touch]).win, null))).toBe("pocket");
    expect(deskMode(deskScreenOf(win, "off"))).toBeNull();
  });

  it("reads a page's own queries: the pocket desk only on a short touchscreen", () => {
    const own: DeskQueries = {
      computer: "not all and (pointer: coarse) and (max-height: 500px)",
      wide: "(min-width: 768px)",
      touch: "(pointer: coarse)",
      roomy: "(min-height: 501px)",
    };
    const sideways = screen([own.touch, own.wide]).win;
    expect(deskMode(deskScreenOf(sideways, null, own))).toBe("pocket");
    const tablet = screen([own.computer, own.touch, own.roomy, own.wide]).win;
    expect(deskMode(deskScreenOf(tablet, null, own))).toBe("desk");
  });

  it("answers no to every query where the page cannot match media", () => {
    expect(deskScreenOf({} as Window, null)).toEqual({
      forced: null,
      computer: false,
      wide: false,
      touch: false,
      roomy: false,
    });
  });
});

describe("watchDeskScreen", () => {
  it("hears each query change until stopped", () => {
    const { win, listeners } = screen([]);
    const heard = vi.fn();
    const stop = watchDeskScreen(win, heard);
    expect(listeners.size).toBe(4);
    listeners.get(DESK_QUERIES.touch)!();
    expect(heard).toHaveBeenCalledOnce();
    stop();
    expect(listeners.size).toBe(0);
    expect(watchDeskScreen({} as Window, heard)).toBeTypeOf("function");
  });
});
