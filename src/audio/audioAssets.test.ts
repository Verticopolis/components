import { describe, expect, it } from "vitest";
import { AUDIO_ENGINE_CHUNK } from "./audioAssets";

// That AUDIO_RUNTIME_FILES lists exactly the sound files the game serves is
// checked in the game's repository, which holds those files.

describe("AUDIO_ENGINE_CHUNK", () => {
  it("matches the lazy Tone chunk's built name and nothing else", () => {
    expect(AUDIO_ENGINE_CHUNK.test("assets/ToneAudioEngine-Bq3x9a1Z.js")).toBe(true);
    expect(AUDIO_ENGINE_CHUNK.test("assets/main-Bq3x9a1Z.js")).toBe(false);
    expect(AUDIO_ENGINE_CHUNK.test("assets/ToneAudioEngine-Bq3x9a1Z.js.map")).toBe(false);
  });
});
