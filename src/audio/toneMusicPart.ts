import * as Tone from "tone";
import type { Program, TrackEvent, TrackVoice } from "./toneTracks";

/**
 * The music's looping part on the Transport, and moving it to a given point:
 * a page that opens just as another page playing the same track goes away
 * (a launcher handing over to a game, say) can carry the track on from the
 * same beat instead of starting it again.
 */

/** A track position handed over from another page: `seconds` into the loop
 *  at the wall-clock time `asOf` (milliseconds, as `Date.now()` gives). */
export interface MusicHandover {
  readonly seconds: number;
  readonly asOf: number;
}

/** Build the looping part for a track, started at the Transport's zero, so its
 *  place in the loop is always the Transport's seconds modulo the loop. */
export function loopingPart(prog: Program, play: (time: number, ev: TrackEvent) => void): Tone.Part {
  const part = new Tone.Part(
    play,
    prog.events.map((e) => [e.t, e] as [number, TrackEvent]),
  );
  part.loop = true;
  part.loopEnd = prog.loopEnd;
  part.start(0);
  return part;
}

/** Where in a loop of `loopEnd` seconds a handed-over track is at `now`: its
 *  position then plus the time since, wrapped into the loop. Null when the
 *  handover or the loop is not a usable number. */
export function handoverSeconds(h: MusicHandover, loopEnd: number, now: number): number | null {
  const at = h.seconds + Math.max(0, now - h.asOf) / 1000;
  if (!Number.isFinite(at) || !Number.isFinite(loopEnd) || loopEnd <= 0) return null;
  return ((at % loopEnd) + loopEnd) % loopEnd;
}

/** How far into a loop of `loopEnd` seconds the Transport is. */
export function loopSeconds(loopEnd: number): number {
  const s = Tone.getTransport().seconds;
  return ((s % loopEnd) + loopEnd) % loopEnd;
}

/** Move the Transport, and with it the looping part, to where a handed-over
 *  track is at `now`. A failure leaves the track playing where it was. */
export function joinHandover(h: MusicHandover, loopEnd: number, now: number): void {
  const at = handoverSeconds(h, loopEnd, now);
  if (at === null) return;
  try {
    Tone.getTransport().seconds = at;
  } catch {
    /* the track plays on from where it was */
  }
}

/**
 * The music's place in its loop. It keeps the built part's loop length, so
 * reading the place never rebuilds the track, and holds a beat another page
 * handed over until the player can hear it.
 */
export class LoopClock {
  private loopEnd = 0;
  private handover: MusicHandover | null = null;

  /** A part looping every `loopEnd` seconds was built; 0 when none is. */
  built(loopEnd: number): void {
    this.loopEnd = loopEnd;
  }

  /** Seconds into the loop, or null with no part built. */
  get seconds(): number | null {
    return this.loopEnd > 0 ? loopSeconds(this.loopEnd) : null;
  }

  /** Keep a handed-over beat until {@link join}. */
  hold(h: MusicHandover): void {
    this.handover = h;
  }

  /** Move to the held beat, if there is one, as of `now`, and let it go. */
  join(now: number): void {
    if (!this.handover) return;
    joinHandover(this.handover, this.loopEnd, now);
    this.handover = null;
  }
}

/** What a track note plays on. */
export type NoteVoice = { triggerAttackRelease: (f: number, d: number, t: number, v: number) => unknown };

/** The live synths a track's notes go to. */
export interface TrackVoices {
  readonly arp: NoteVoice | null;
  readonly bassVoice: NoteVoice | null;
  readonly hook: NoteVoice | null;
  readonly perc: { readonly thump: NoteVoice; readonly tap: NoteVoice } | null;
}

/** No synths yet, or none any more. */
export const NO_VOICES: TrackVoices = { arp: null, bassVoice: null, hook: null, perc: null };

/** Resolve a track voice tag to its live synth. */
export function trackVoice(v: TrackVoice, voices: TrackVoices): NoteVoice | null {
  switch (v) {
    case "arp":
      return voices.arp;
    case "bass":
      return voices.bassVoice;
    case "hook":
      return voices.hook;
    case "thump":
      return voices.perc?.thump ?? null;
    case "tap":
      return voices.perc?.tap ?? null;
  }
}
