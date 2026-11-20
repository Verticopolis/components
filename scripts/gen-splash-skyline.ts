/**
 * Writes `lib/styles/splash-skyline.svg`, the title screen's skyline as an
 * image for a docs site's title screen (`styles/starlight-theme.css` tiles
 * it), from the shapes the title screen draws inline
 * (`src/ui/titleScreen/titleSkyline.ts`, through scripts/splashSkyline.ts) in the two splash colors of
 * `src/styles/retro-tokens.css`. scripts/build-lib.sh runs it:
 *
 *   node scripts/gen-splash-skyline.ts lib/styles
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { skylineImage } from "./splashSkyline.ts";

const out = process.argv[2];
if (!out) {
  console.error("usage: gen-splash-skyline.ts <dir>");
  process.exit(2);
}
const tokens = readFileSync("src/styles/retro-tokens.css", "utf8");

/** A `--splash-*` color as `retro-tokens.css` declares it. */
function color(name: string): string {
  const m = new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{3,8})\\s*;`).exec(tokens);
  if (!m?.[1]) throw new Error(`gen-splash-skyline: retro-tokens.css declares no --${name} color`);
  return m[1];
}

writeFileSync(
  join(out, "splash-skyline.svg"),
  skylineImage({ building: color("splash-building"), ink: color("splash-ink") }),
);
