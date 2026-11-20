/**
 * The title screen's skyline as a standalone SVG image, from the shapes the
 * title screen draws inline (src/ui/titleScreen/titleSkyline.ts).
 * scripts/gen-splash-skyline.ts writes it into lib/styles at build time.
 */
import {
  SKYLINE_BUILDINGS,
  SKYLINE_VIEWBOX,
  SKYLINE_WINDOWS,
  SKYLINE_WINDOW_COLOR,
  SKYLINE_WINDOW_SIZE,
} from "../src/ui/titleScreen/titleSkyline.ts";

/** The two colors the skyline image is painted in, the `--splash-building`
 *  and `--splash-ink` tokens of `retro-tokens.css`. */
export interface SkylineColors {
  building: string;
  ink: string;
}

/**
 * The skyline as a standalone SVG image, the file a docs site's title screen
 * tiles across its foot (`styles/splash-skyline.svg`). Build time only, so it
 * is no part of the package.
 */
export function skylineImage({ building, ink }: SkylineColors): string {
  const { width, height } = SKYLINE_WINDOW_SIZE;
  const rect = ([x, y]: readonly [number, number]) => `<rect x="${x}" y="${y}" width="${width}" height="${height}" />`;
  const windows: string[] = [];
  for (let i = 0; i < SKYLINE_WINDOWS.length; i += 2)
    windows.push(
      `    ${SKYLINE_WINDOWS.slice(i, i + 2)
        .map(rect)
        .join("")}`,
    );
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${SKYLINE_VIEWBOX}">
  <g fill="${building}" stroke="${ink}" stroke-width="1">
${SKYLINE_BUILDINGS.map((d) => `    <path d="${d}" />`).join("\n")}
  </g>
  <g fill="${SKYLINE_WINDOW_COLOR}">
${windows.join("\n")}
  </g>
</svg>
`;
}
