import { configDefaults, defineConfig } from "vitest/config";

// The package's unit tests run headless in happy-dom, as the game's do. The
// setup file binds the view to the hand-written Modern render catalog
// (src/tests/catalogFixture.ts), so a test can draw and lay out without a
// game.
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify("0.0.0-test"),
    __APP_SHA__: JSON.stringify("test"),
  },
  test: {
    globals: true,
    environment: "happy-dom",
    // Node 25 and later ship their own `localStorage` and `sessionStorage`
    // globals, which shadow happy-dom's unless they are turned off.
    execArgv: ["--no-experimental-webstorage"],
    testTimeout: 30000,
    hookTimeout: 30000,
    // scripts/ holds the release tooling, which never ships.
    include: ["src/**/*.test.ts", "scripts/**/*.test.ts"],
    exclude: [...configDefaults.exclude],
    setupFiles: ["src/tests/viewWorldSetup.ts"],
  },
});
