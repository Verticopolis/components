import { describe, expect, it } from "vitest";
import { LEDGER_CATS, LEDGER_LABELS, MILESTONE_COPY } from "./statsCopy";

// Whether these keys match the ones a game's simulation reports is the game's
// check, made where both packages are installed.
describe("the Statistics window's copy", () => {
  it("labels every ledger category, and no other", () => {
    expect(Object.keys(LEDGER_LABELS).sort()).toEqual([...LEDGER_CATS].sort());
    for (const cat of LEDGER_CATS) expect(LEDGER_LABELS[cat], cat).toMatch(/\S/);
  });

  it("words every milestone with a label and a description", () => {
    expect(MILESTONE_COPY.size).toBeGreaterThan(0);
    for (const [id, copy] of MILESTONE_COPY) {
      expect(copy.label, id).toMatch(/\S/);
      expect(copy.desc, id).toMatch(/\S/);
    }
  });
});
