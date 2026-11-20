import { describe, expect, it, vi } from "vitest";
import {
  DEFAULT_SCHEME,
  SCHEMES,
  SCHEME_ATTRIBUTE,
  SCHEME_NAMES,
  applyScheme,
  isScheme,
  loadScheme,
  saveScheme,
  schemeOf,
} from "./schemes";

const KEY = "site.scheme";
const store = (raw: string | null) => ({ getItem: vi.fn(() => raw) });

describe("the appearance schemes", () => {
  it("list Standard, Skyline and High Contrast, Standard first and the default", () => {
    expect(SCHEMES.map((id) => SCHEME_NAMES[id])).toEqual(["Standard", "Skyline", "High Contrast"]);
    expect(DEFAULT_SCHEME).toBe("standard");
  });

  it("know their own ids and nothing else", () => {
    expect(isScheme("skyline")).toBe(true);
    expect(isScheme("classic")).toBe(false);
    expect(isScheme(null)).toBe(false);
  });

  it("put the scheme on the root element, and Standard takes the attribute off", () => {
    const root = document.createElement("html");
    applyScheme("skyline", root);
    expect(root.getAttribute(SCHEME_ATTRIBUTE)).toBe("skyline");
    expect(schemeOf(root)).toBe("skyline");
    applyScheme("high_contrast", root);
    expect(root.getAttribute(SCHEME_ATTRIBUTE)).toBe("high_contrast");
    applyScheme("standard", root);
    expect(root.hasAttribute(SCHEME_ATTRIBUTE)).toBe(false);
    expect(schemeOf(root)).toBe("standard");
  });

  it("read an unknown attribute as Standard", () => {
    const root = document.createElement("html");
    root.setAttribute(SCHEME_ATTRIBUTE, "luna");
    expect(schemeOf(root)).toBe("standard");
  });

  it("read back the scheme kept under the caller's key", () => {
    const s = store("skyline");
    expect(loadScheme(KEY, s)).toBe("skyline");
    expect(s.getItem).toHaveBeenCalledWith(KEY);
  });

  it("read Standard for a missing, foreign or unreadable value", () => {
    expect(loadScheme(KEY, store(null))).toBe("standard");
    expect(loadScheme(KEY, store("classic"))).toBe("standard");
    expect(loadScheme(KEY, null)).toBe("standard");
    const blocked = {
      getItem: vi.fn(() => {
        throw new Error("blocked");
      }),
    };
    expect(loadScheme(KEY, blocked)).toBe("standard");
  });

  it("keep the scheme's id under the key, and a full storage does not throw", () => {
    const s = { setItem: vi.fn() };
    saveScheme(KEY, "high_contrast", s);
    expect(s.setItem).toHaveBeenCalledWith(KEY, "high_contrast");
    const full = {
      setItem: vi.fn(() => {
        throw new Error("quota");
      }),
    };
    expect(() => saveScheme(KEY, "standard", full)).not.toThrow();
  });
});
