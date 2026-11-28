import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("tone", async () => (await import("./toneRecordingMock")).toneMock());

import { transport } from "./toneRecordingMock";
import { handoverSeconds, LoopClock, NO_VOICES, trackVoice, type NoteVoice } from "./toneMusicPart";

describe("handoverSeconds", () => {
  it("adds the time since the handover to its position", () => {
    expect(handoverSeconds({ seconds: 3, asOf: 10_000 }, 20, 11_500)).toBeCloseTo(4.5);
  });

  it("wraps into the loop", () => {
    expect(handoverSeconds({ seconds: 19, asOf: 0 }, 20, 2000)).toBeCloseTo(1);
    expect(handoverSeconds({ seconds: -1, asOf: 0 }, 20, 0)).toBeCloseTo(19);
  });

  it("never steps back for a clock that reads earlier than the handover", () => {
    expect(handoverSeconds({ seconds: 5, asOf: 10_000 }, 20, 9000)).toBeCloseTo(5);
  });

  it("is null for an unusable position or loop", () => {
    expect(handoverSeconds({ seconds: Number.NaN, asOf: 0 }, 20, 0)).toBeNull();
    expect(handoverSeconds({ seconds: 1, asOf: 0 }, 0, 0)).toBeNull();
  });
});

describe("trackVoice", () => {
  const voice = (): NoteVoice => ({ triggerAttackRelease: vi.fn() });
  it("finds each tag's synth, and none before the synths are built", () => {
    const voices = { arp: voice(), bassVoice: voice(), hook: voice(), perc: { thump: voice(), tap: voice() } };
    expect(trackVoice("arp", voices)).toBe(voices.arp);
    expect(trackVoice("bass", voices)).toBe(voices.bassVoice);
    expect(trackVoice("hook", voices)).toBe(voices.hook);
    expect(trackVoice("thump", voices)).toBe(voices.perc.thump);
    expect(trackVoice("tap", voices)).toBe(voices.perc.tap);
    expect(trackVoice("tap", NO_VOICES)).toBeNull();
  });
});

describe("LoopClock", () => {
  beforeEach(() => {
    transport.seconds = 0;
  });

  it("has no place in the loop until a part is built", () => {
    const clock = new LoopClock();
    transport.seconds = 5;
    expect(clock.seconds).toBeNull();
    clock.built(20);
    expect(clock.seconds).toBeCloseTo(5);
    transport.seconds = 47;
    expect(clock.seconds).toBeCloseTo(7);
    clock.built(0);
    expect(clock.seconds).toBeNull();
  });

  it("moves to a held beat once, when joined", () => {
    const clock = new LoopClock();
    clock.built(20);
    clock.hold({ seconds: 3, asOf: 1000 });
    expect(transport.seconds).toBe(0);
    clock.join(2000);
    expect(transport.seconds).toBeCloseTo(4);
    transport.seconds = 9;
    clock.join(3000);
    expect(transport.seconds).toBe(9);
  });

  it("drops a beat it cannot place, with no part built", () => {
    const clock = new LoopClock();
    clock.hold({ seconds: 3, asOf: 0 });
    clock.join(0);
    clock.built(20);
    clock.join(0);
    expect(transport.seconds).toBe(0);
  });
});
