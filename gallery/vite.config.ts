import { defineConfig } from "vite";

// The component gallery (`npm run gallery`, `npm run gallery:build`). It reads
// the built package in lib/ the way a consumer would, so build the package
// first (`npm run build`). The output goes to dist-gallery/, which the
// Gallery workflow publishes to GitHub Pages from main.
export default defineConfig({
  root: import.meta.dirname,
  base: "./",
  build: {
    outDir: "../dist-gallery",
    emptyOutDir: true,
    target: "es2022",
  },
});
