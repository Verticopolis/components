---
package: major
---
- the window modules import their own stylesheet: `windows/menuBar` imports
  `styles/menu-bar.css`, and `windows/uiModal` and `windows/movableWindow`
  (so `windows/desk/deskWindow` too) import `styles/window.css`. A page that
  uses only those modules no longer needs a stylesheet import for them. They
  now need a bundler that loads CSS imported from JavaScript (Vite does);
  plain Node can no longer import them. Their declarations do not carry the
  CSS imports.
- a Starlight site declares `@layer starlight, vc;` through Starlight's `head`
  option rather than a first `customCss` entry: Astro puts the menu bar's CSS,
  which the `windows/menuBar` module now imports, ahead of `customCss`.
