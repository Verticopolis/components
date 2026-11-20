import { clockOf as clockAt, type ClockView } from "../presentation/clockOf";
import { ClockReads } from "@verticopolis/engine/port/clockView";
import type { HeaderView } from "@verticopolis/engine/port/view";

/**
 * @deprecated Moved to `presentation/clockOf`, which takes the header's date
 * fields and the engine's clock (`RenderSim.clock`). This wrapper reads the
 * clock from the header with the engine's `ClockReads`, as before. It goes in
 * components 1.0.
 */

export type { ClockView } from "../presentation/clockOf";

/** The fields of the header a clock reading needs. */
export type ClockHeader = Pick<
  HeaderView,
  "minutes" | "day" | "dayOfWeek" | "isWeekend" | "quarter" | "year" | "weekDays" | "weekendDays"
>;

/** @deprecated Use `clockOf(header, sim.clock)` from `presentation/clockOf`. */
export function clockOf(h: ClockHeader): ClockView {
  return clockAt(h, new ClockReads().set(h));
}
