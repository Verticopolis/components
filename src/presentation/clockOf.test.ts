import { describe, expect, it } from "vitest";
import type { RenderClock } from "../render/renderModel";
import { clockOf as clockAt, type ClockDate, type ClockView } from "./clockOf";

/** A game's clock at `minutes`, as the tests fake it: morning from 7 to 10,
 *  evening from 17 to 22, night from 22 to 6. The panel passes these answers
 *  through. */
function fakeClock(minutes: number): RenderClock & { minutes: number } {
  const clock = {
    minutes,
    get minuteOfDay() {
      return clock.minutes % 1440;
    },
    get hour() {
      return Math.floor(clock.minuteOfDay / 60);
    },
    get minute() {
      return clock.minuteOfDay % 60;
    },
    isMorning: () => clock.hour >= 7 && clock.hour < 10,
    isEvening: () => clock.hour >= 17 && clock.hour < 22,
    isNight: () => clock.hour >= 22 || clock.hour < 6,
  };
  return clock;
}

type ClockHeader = ClockDate & { minutes: number };

/** The panel's clock for a header, with a game clock at its minute. */
const clockOf = (h: ClockHeader): ClockView => clockAt(h, fakeClock(h.minutes));

/**
 * A panel's clock: the time of day from the game's clock, the names from the
 * header's day fields and the calendar's week. The rows are sample dates.
 */

const readings = (c: ClockView) => [
  c.minutes,
  c.minuteOfDay,
  c.hour,
  c.minute,
  c.day,
  c.dayOfWeek,
  c.isWeekend,
  c.quarter,
  c.dayName,
  c.year,
  c.format(),
  c.formatRetroDate(),
  c.isMorning(),
  c.isEvening(),
  c.isNight(),
];

type Reading = ReturnType<typeof readings>;

/** The header a row describes, on a calendar of `week` days. */
const headerOf = (r: Reading, week: Pick<ClockHeader, "weekDays" | "weekendDays">): ClockHeader => ({
  minutes: r[0] as number,
  day: r[4] as number,
  dayOfWeek: r[5] as number,
  isWeekend: r[6] as boolean,
  quarter: r[7] as number,
  year: r[9] as number,
  ...week,
});

// The founding minute, the next one, an evening, a weekend day, a quarter
// boundary on the canon calendar, past a canon year and past a real one.
/** Classic's calendar and Modern's canon one: three weekdays and a weekend day. */
// prettier-ignore
const CANON: Reading[] = [
  [420, 420, 7, 0, 0, 0, false, 0, "WD1", 0, "WD1 07:00", "1st WD/1Q/1st Year", true, false, false],
  [421, 421, 7, 1, 0, 0, false, 0, "WD1", 0, "WD1 07:01", "1st WD/1Q/1st Year", true, false, false],
  [1020, 1020, 17, 0, 0, 0, false, 0, "WD1", 0, "WD1 17:00", "1st WD/1Q/1st Year", false, true, false],
  [7800, 600, 10, 0, 5, 2, true, 1, "WE1", 0, "WE1 10:00", "1st WE/2Q/1st Year", false, false, false],
  [43201, 1, 0, 1, 30, 0, false, 2, "WD1", 2, "WD1 00:01", "1st WD/3Q/3rd Year", false, false, true],
  [133920, 0, 0, 0, 93, 0, false, 3, "WD1", 7, "WD1 00:00", "1st WD/4Q/8th Year", false, false, true],
  [525607, 7, 0, 7, 365, 2, true, 1, "WE1", 30, "WE1 00:07", "1st WE/2Q/31st Year", false, false, true],
  [577439, 1439, 23, 59, 400, 1, false, 1, "WD2", 33, "WD2 23:59", "2nd WD/2Q/34th Year", false, false, true],
];

// prettier-ignore
const REAL_WORLD: Reading[] = [
  [420, 420, 7, 0, 0, 0, false, 0, "Mon", 0, "Mon 07:00", "1st WD/1Q/1st Year", true, false, false],
  [421, 421, 7, 1, 0, 0, false, 0, "Mon", 0, "Mon 07:01", "1st WD/1Q/1st Year", true, false, false],
  [1020, 1020, 17, 0, 0, 0, false, 0, "Mon", 0, "Mon 17:00", "1st WD/1Q/1st Year", false, true, false],
  [7800, 600, 10, 0, 5, 5, true, 0, "Sat", 0, "Sat 10:00", "1st WE/1Q/1st Year", false, false, false],
  [43201, 1, 0, 1, 30, 2, false, 0, "Wed", 0, "Wed 00:01", "3rd WD/1Q/1st Year", false, false, true],
  [133920, 0, 0, 0, 93, 2, false, 1, "Wed", 0, "Wed 00:00", "3rd WD/2Q/1st Year", false, false, true],
  [525607, 7, 0, 7, 365, 1, false, 0, "Tue", 1, "Tue 00:07", "2nd WD/1Q/2nd Year", false, false, true],
  [577439, 1439, 23, 59, 400, 1, false, 0, "Tue", 1, "Tue 23:59", "2nd WD/1Q/2nd Year", false, false, true],
];

const CALENDARS = [
  ["the canon calendar", CANON, { weekDays: 3, weekendDays: 1 }],
  ["the real-world calendar", REAL_WORLD, { weekDays: 7, weekendDays: 2 }],
] as const;

describe("clockOf", () => {
  for (const [name, rows, week] of CALENDARS) {
    it(`${name}: reads the time and names from the header`, () => {
      for (const r of rows) expect(readings(clockOf(headerOf(r, week))), `at minute ${r[0]}`).toEqual(r);
    });
  }

  it("reads minute zero as midnight of the first day", () => {
    const week = { weekDays: 7, weekendDays: 2 };
    const first = clockOf({ minutes: 0, day: 0, dayOfWeek: 0, isWeekend: false, quarter: 0, year: 0, ...week });
    const next = clockOf({ minutes: 1440, day: 1, dayOfWeek: 1, isWeekend: false, quarter: 0, year: 0, ...week });
    expect([first.minutes, first.minuteOfDay, first.hour, first.minute, first.day]).toEqual([0, 0, 0, 0, 0]);
    expect([first.dayOfWeek, first.format(), next.dayOfWeek, next.format()]).toEqual([0, "Mon 00:00", 1, "Tue 00:00"]);
  });

  it("takes its reading once, so a clock that moves on leaves it alone", () => {
    const week = { weekDays: 7, weekendDays: 2 };
    const h = { minutes: 420, day: 0, dayOfWeek: 0, isWeekend: false, quarter: 0, year: 0, ...week };
    const live = fakeClock(h.minutes);
    const c = clockAt(h, live);
    live.minutes = 1260;
    expect([c.minutes, c.hour, c.isMorning(), c.isNight(), c.format()]).toEqual([420, 7, true, false, "Mon 07:00"]);
  });
});
