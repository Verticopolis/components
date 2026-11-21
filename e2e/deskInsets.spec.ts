/**
 * The touch desk keeps clear of a notch once a page opts into the cutout
 * area (viewport-fit=cover): a sideways phone with 47 px insets at its sides
 * and 21 px at its foot, set through Chromium's safe-area override. The page
 * is a bare pocket desk on the package's own built stylesheet (lib/), served
 * from a made-up origin, since the gallery shows no pocket desk yet. What
 * floats over the tower (the Map, its toggle, the tool strip) keeps its
 * plain offset from the tower's edges, so the inset is not taken twice.
 */
import { test, expect } from "@playwright/test";
import { fileURLToPath } from "node:url";

const ORIGIN = "http://pocket.test";
const LIB = fileURLToPath(new URL("../lib", import.meta.url));
const INSETS = { left: 47, right: 47, top: 0, bottom: 21 };

const PAGE = `<!doctype html>
<html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<link rel="stylesheet" href="/styles.css"></head>
<body class="desk desk-touch desk-pocket">
<div class="desk-area">
  <section id="desk-win-tower" class="win desk-win desk-active">
    <div class="win-title"><span>Tower</span></div>
    <div class="desk-pocket-body">
      <header id="topbar"><div id="status"><div class="stat"><span class="label">POP</span><span class="value">1,204</span></div></div></header>
      <aside id="palette" class="win docked"><div class="win-title">Tools</div><div class="palette-scroll"></div></aside>
      <section id="stage">
        <div id="tool-strip"><div class="win">Strip</div></div>
        <div class="overview-map win"><div class="overview-map-body"></div></div>
        <button class="overview-map-toggle btn" type="button">Map</button>
      </section>
    </div>
  </section>
</div>
<div class="desk-taskbar"><button class="desk-start">Start</button></div>
</body></html>`;

test("the pocket desk keeps its tools and tower clear of the side insets", async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== "phone", "one sideways phone is enough");
  const context = await browser.newContext({
    viewport: { width: 844, height: 390 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.route(`${ORIGIN}/**`, (route) => {
    const path = new URL(route.request().url()).pathname;
    return path === "/" ? route.fulfill({ body: PAGE, contentType: "text/html" }) : route.fulfill({ path: LIB + path });
  });
  const cdp = await context.newCDPSession(page);
  await cdp.send("Emulation.setSafeAreaInsetsOverride", { insets: INSETS });
  await page.goto(`${ORIGIN}/`);

  const box = async (selector: string) => (await page.locator(selector).boundingBox())!;
  const palette = await box("#palette");
  const stage = await box("#stage");
  const taskbar = await box(".desk-taskbar");
  expect(palette.x).toBe(INSETS.left);
  expect(stage.x + stage.width).toBeLessThanOrEqual(844 - INSETS.right);
  expect(taskbar.height).toBe(44 + INSETS.bottom);
  // What floats over the tower sits at its plain offset from the stage's
  // edges: the desk area has taken the insets already.
  const map = await box(".overview-map");
  const toggle = await box(".overview-map-toggle");
  const strip = await box("#tool-strip");
  expect([map.x - stage.x, map.y - stage.y]).toEqual([8, 8]);
  expect(stage.x + stage.width - (toggle.x + toggle.width)).toBe(10);
  expect([strip.x - stage.x, stage.y + stage.height - (strip.y + strip.height)]).toEqual([10, 10]);
  await context.close();
});
