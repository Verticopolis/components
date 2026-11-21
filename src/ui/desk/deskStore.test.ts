import { describe, expect, it } from "vitest";
import { localStore, read, write, type Store } from "./deskStore";

const refusing: Store = {
  getItem: () => {
    throw new Error("blocked");
  },
  setItem: () => {
    throw new Error("full");
  },
};

describe("the desk's store", () => {
  it("reads and writes a store", () => {
    const data: Record<string, string> = {};
    const s: Store = { getItem: (k) => data[k] ?? null, setItem: (k, v) => void (data[k] = v) };
    expect(read(s, "a")).toBeNull();
    write(s, "a", "1");
    expect(read(s, "a")).toBe("1");
  });

  it("never throws for a store that refuses, or no store", () => {
    expect(read(refusing, "a")).toBeNull();
    expect(() => write(refusing, "a", "1")).not.toThrow();
    expect(read(null, "a")).toBeNull();
    expect(() => write(null, "a", "1")).not.toThrow();
  });

  it("gives the page's localStorage, or null where reading it throws", () => {
    expect(localStore(window)).toBe(window.localStorage);
    const blocked = Object.defineProperty({}, "localStorage", {
      get: () => {
        throw new Error("blocked");
      },
    }) as Window;
    expect(localStore(blocked)).toBeNull();
  });
});
