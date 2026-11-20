import type { RenderClock } from "../render/renderModel";
import { dayName, formatClock, formatRetroDate, type DateReading } from "./clockText";

/**
 * What a panel derives from the view's header and the simulation's clock instead
 * of reading it off a `Simulation` (facade slice 4, #1211): the clock's day,
 * hour and names. The simulation reports the date numbers in the header (day, day
 * of the week, weekend flag, quarter, year, the calendar's week lengths) and
 * the time of day on its clock (`RenderSim.clock`); the names come from
 * `presentation/clockText.ts`. The mode's rules a panel shows come from the
 * tower's catalog (`catalog.rules`).
 */

/** The date fields of the header a clock reading needs. */
export interface ClockDate extends DateReading {
  /** 0-based day since the tower opened. */
  readonly day: number;
}

/** The clock's readings a panel shows. */
export interface ClockView {
  readonly minutes: number;
  readonly minuteOfDay: number;
  readonly hour: number;
  readonly minute: number;
  readonly day: number;
  readonly dayOfWeek: number;
  readonly isWeekend: boolean;
  readonly quarter: number;
  readonly year: number;
  readonly dayName: string;
  isMorning(): boolean;
  isEvening(): boolean;
  isNight(): boolean;
  format(): string;
  formatRetroDate(): string;
}

/** The clock at `time`'s minute, on the tower's calendar the header `h`
 *  describes. `time` is the simulation's clock at the same minute. The reading is
 *  taken once: a live clock that moves on afterward does not change it. */
export function clockOf(h: ClockDate, time: RenderClock): ClockView {
  const { minutes, minuteOfDay, hour, minute } = time;
  const morning = time.isMorning();
  const evening = time.isEvening();
  const night = time.isNight();
  return {
    minutes,
    minuteOfDay,
    hour,
    minute,
    day: h.day,
    dayOfWeek: h.dayOfWeek,
    isWeekend: h.isWeekend,
    quarter: h.quarter,
    year: h.year,
    get dayName() {
      return dayName(h);
    },
    isMorning: () => morning,
    isEvening: () => evening,
    isNight: () => night,
    format: () => formatClock(h, hour, minute),
    formatRetroDate: () => formatRetroDate(h),
  };
}
