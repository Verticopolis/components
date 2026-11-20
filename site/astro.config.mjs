// The component gallery: a Starlight site that shows every reusable piece of
// @verticopolis/components, in the same look as the player's manual and the
// engine docs. It loads the built package from ../lib (run `npm run build` at
// the repository root first), the way a consumer would: the stylesheets
// through customCss, the menu bar, painters and audio through each page's
// demos (../gallery/demos.ts). The Gallery workflow builds it and publishes
// it to GitHub Pages; GALLERY_BASE puts a pull request's preview under
// /pr-preview/pr-<number>/ (gallery-preview.yml), and the live site sits at
// the root.
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import { SCHEME_BOOT, SITE_ORIGIN, sidebar } from "./site.mjs";

export default defineConfig({
  site: SITE_ORIGIN,
  base: process.env.GALLERY_BASE || "/",
  // The demos import ../lib and ../gallery, outside the site's own folder.
  vite: { server: { fs: { allow: [".."] } } },
  integrations: [
    starlight({
      title: "Verticopolis components",
      description:
        "Every reusable piece of @verticopolis/components: windows, buttons, wells, the menu bar, message boxes, the desk, icons, sounds, the tower's lobbies, stairs, elevators and rooms.",
      logo: { src: "../assets/app-icon/pwa-192x192.png", alt: "Verticopolis" },
      favicon: "/favicon.png",
      components: { Header: "./src/components/Header.astro" },
      // The pages hold one demo each and no headings to list.
      tableOfContents: false,
      // Starlight's CSS sits in its `starlight` layer; the package's sits in
      // `vc`, declared after it here so the game's look wins (README,
      // styles/starlight.css). The scheme script runs before paint, so a page
      // opens in the scheme picked last.
      head: [
        { tag: "style", content: "@layer starlight, vc;" },
        { tag: "script", content: SCHEME_BOOT },
      ],
      customCss: [
        "../lib/styles/starlight.css",
        "../lib/styles/retro-components.css",
        "../lib/styles/menu-bar.css",
        "../lib/styles/game/dialogs.css",
        "../lib/styles/game/desk.css",
        "../lib/styles/schemes/skyline.css",
        "../lib/styles/schemes/high-contrast.css",
        "./src/styles/gallery.css",
      ],
      sidebar,
    }),
  ],
});
