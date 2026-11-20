import { describe, it, expect } from "vitest";
import { TRAFFIC_LABELS, TRAFFIC_LEVELS, trafficLevel, type TrafficTier } from "./traffic";

const TIERS: readonly TrafficTier[] = [0, 1, 2, 3];

describe("traffic meter level", () => {
  it("names one level per tier, in tier order", () => {
    expect(TRAFFIC_LEVELS).toHaveLength(TRAFFIC_LABELS.length);
    expect(TIERS.map(trafficLevel)).toEqual(["smooth", "busy", "backed-up", "gridlock"]);
  });
});
