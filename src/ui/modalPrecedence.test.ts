import { describe, expect, it, vi } from "vitest";
import { ModalPrecedence } from "./modalPrecedence";

describe("ModalPrecedence", () => {
  it("hands a held line to the next dialog once, with its kind", () => {
    const p = new ModalPrecedence();
    expect(p.takeNotice()).toBeNull();
    p.deferNotice("Later", "good");
    expect(p.takeNotice()).toEqual({ text: "Later", kind: "good" });
    expect(p.takeNotice()).toBeNull();
  });

  it("drops a held line when the dialog closes, so it never lands in an unrelated window", () => {
    const p = new ModalPrecedence();
    p.deferNotice("Later");
    p.closed(true);
    expect(p.takeNotice()).toBeNull();
  });

  it("resolves a wait when its dialog closes, and breaks it when the dialog is displaced", () => {
    const p = new ModalPrecedence();
    const resolved = vi.fn();
    const broken = vi.fn();
    p.wait(resolved, broken);
    p.opening(true, {});
    expect(broken).toHaveBeenCalledWith("displaced");
    p.wait(resolved, broken);
    p.closed(true);
    expect(resolved).toHaveBeenCalledOnce();
  });
});
