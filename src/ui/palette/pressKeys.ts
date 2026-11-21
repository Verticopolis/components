import { isSpaceKey } from "../../model/inputEvents";

/**
 * A `role="button"` element's keys, the way a native button takes them: Enter
 * acts on the press, Space on the release, and a held key acts once. Neither
 * key is stopped from bubbling, since a game may read a held Space as its pan
 * key from the window; such a game cancels the release of a hold that panned
 * (`preventDefault` on the keyup), and the release then does nothing. Ctrl,
 * Cmd or Alt with either key starts a system shortcut and drops a pending
 * press.
 *
 * Bind the three handlers on the element with `@keydown`, `@keyup` and
 * `@blur`. One set per element: it remembers whether Space went down there.
 */
export interface PressKeys {
  readonly keydown: (e: KeyboardEvent) => void;
  readonly keyup: (e: KeyboardEvent) => void;
  readonly blur: () => void;
}

const chord = (e: KeyboardEvent): boolean => e.ctrlKey || e.metaKey || e.altKey;

export function pressKeys(press: () => void): PressKeys {
  let spaceDown = false;
  return {
    keydown: (e) => {
      if (chord(e)) spaceDown = false;
      if (isSpaceKey(e)) {
        if (chord(e)) return; // left to the system
        e.preventDefault(); // repeats too, or a held Space scrolls the list
        if (!e.repeat) spaceDown = true;
        return;
      }
      if (e.key === "Enter" && !e.repeat && !chord(e)) {
        e.preventDefault();
        press();
      }
    },
    keyup: (e) => {
      if (!isSpaceKey(e)) return;
      const pressed = spaceDown;
      spaceDown = false;
      if (pressed && !chord(e) && !e.defaultPrevented) press();
    },
    blur: () => {
      spaceDown = false;
    },
  };
}
