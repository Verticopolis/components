# Components changelog

Release notes for `@verticopolis/components`, one `## <version>` section per
package version, newest first, written for people who build on the package.
The player-facing notes live in the game's
[`CHANGELOG.md`](https://github.com/Verticopolis/web/blob/main/CHANGELOG.md),
and the engine's in
[`engine-rs/CHANGELOG.md`](https://github.com/Verticopolis/engine/blob/main/engine-rs/CHANGELOG.md).

A pull request that changes what the package ships adds its entries as a
change note under
[`.changes/`](https://github.com/Verticopolis/components/blob/main/.changes/README.md),
with the level it needs: **major** for a breaking change to an export or a
stylesheet's selectors, **minor** for a new export, component or look,
**patch** for a fix. A change to the repository alone (CI, the gallery, the
screenshot tests) needs no note. **Cut release** picks the version from
those levels and writes the notes into the version's section, each entry led
by its level, and **Release components** puts that section in the GitHub
release; it refuses a version with no section (README, "Releasing").

Entries up to 0.2.2 were written afterward from the history of the pull
requests that made each version.

## 2.7.0 (2026-11-25)

- **minor**: The game sheets that a module imports for itself (`styles/game/file-dialog.css`,
  `splash.css`, `screen-saver.css` and `appearance.css`) now sit in a new
  `vc.windows` layer below `vc.page`. A second copy of one of them, emitted by
  a bundler after the game's own page sheets, no longer undoes the game's later
  rules. A page that styled these windows by relying on source order should
  check its rules: every `vc.page` rule now beats them. The modal width for
  the Open and Save As window and Previous Versions, and the paragraph margin
  of the Replace question and the folder prompt, moved into
  `styles/game/dialogs.css`, beside the modal's own rules. The focus rings, the
  splash's tall phone buttons on the desk title screen and the sponsor label's
  color stay in `vc.page` blocks at the end of their sheets, so they look the
  same as before.

## 2.6.0 (2026-11-25)

- **minor**: The title screen's main button on the desk and the pocket desk (`.splash-btn.primary` under `body.desk-title`)
  wears the scheme's accent again, as it does away from the desk: amber in Classic, violet in Skyline and yellow
  in High Contrast, with the default ring, bold text and a focus ring that shows on the color. The other
  title buttons keep the scheme's plain face.

## 2.5.0 (2026-11-24)

- **minor**: `windows/desk/deskTitle`: `DeskTitle` takes an optional `controlPanel` (the
  `ControlPanel` options) and holds the desk's Control Panel over the title
  screen, closed until `openControl()` or the tray's monitor opens it, with a
  `control` getter for its labels. `desk-title.css` opens it in the middle of
  the title window and `desk-title-pocket.css` across the window under its
  menu bar; the menu bar's menus and the Start menu open over it. The desk
  windows' chrome now applies under `body.desk-title` (and the touch chrome
  under `body.desk-title-pocket`), so it wears the same title bar as on a tower.
- **patch**: On a phone's title screen the menus and the Start menu open over a notice at the foot of the poster, so every item stays tappable while it shows.
- **patch**: On a short sideways phone the title screen's sun stays under the tagline.
- **patch**: On a phone's title screen, a notice (such as the one that says Continue goes back to a closed tower) shows at the foot of the poster, clear of the logo and the buttons.

## 2.4.0 (2026-11-24)

- **minor**: `windows/desk/deskTaskbar`: the taskbar's Start button reads "Start" (it read "Verticopolis"), and its menu's accessible name is "Start", so the button reads apart from a window named Verticopolis.
- **minor**: `windows/desk/deskTitle`: `DeskTitle.show(true)` puts the title screen on the pocket desk, with `body.desk-title-pocket` (`DESK_TITLE_POCKET_CLASS`) beside `body.desk-title`; a second `show` switches between the two desks. The new `styles/game/desk-title-pocket.css`, part of `styles.css`, fits the window to a phone under the browser's bars, menu bar kept: the poster on top and the buttons stacked below when upright (two by two on a short screen), the buttons in a panel beside the poster held sideways, and the pocket desk's 44 px taskbar. A window too short for its buttons scrolls.
- **minor**: `styles/game/desk-title.css`: the title window's Sponsor, Install and sound buttons sit above the logo's box, so a tap on their lower half no longer lands on the logo.

## 2.3.1 (2026-11-24)

- **patch**: `bars/topBar` is cheaper on a status pass again: the traffic meter, the speeds
  and the buttons after them sit behind lit's `guard`, so a pass that changes
  only the clock or the funds skips them with one comparison. 2.3.0 drew each
  optional button as its own template, which made every pass slower than 2.2.0.

## 2.3.0 (2026-11-24)

- **minor**: `windows/palette/paletteFit` fits the desktop Tools window's tools without a scrollbar:
  `PaletteFit` tries compact rows, then two columns, then both, and fits again when the window's
  height changes, the viewport crosses the desktop layout, a tool under a folded category starts or
  stops showing, or the game calls `refit()` after tools show or hide.
- **minor**: `windows/palette/paletteCollapse` draws the button on the Tools window's title bar that folds the
  window into a strip (`PaletteCollapse`), keeps the choice under a key the game names, and opens the
  window around a tool a guide points at.
- **minor**: `windows/palette/paletteFolds` exports `PALETTE_FOLDED_CLASS`.
- **minor**: `windows/bars/topBar`: every Information bar control but the speeds is
  optional. An action left out of `TopBarActions` (`undo`, `redo`, `save`,
  `mute`, `update`, `install`, `traffic`) draws no control, `TopBarView.traffic`
  and the button flags are optional, and `brand: false` leaves out the badge.
  A page that passes everything draws the bar as before.
- **minor**: `DeskWindow.relabel()` names a window's Minimize and Maximize (or Restore) buttons after its label again, and `DeskManager.refresh()` calls it for each open window, so a renamed tower's buttons stop reading the old name.
- **patch**: `desk-pocket.css`: the Bulletin opens across the top of the pocket desk at
  the height of what it holds, up to a third of the desk, so the tower shows
  below it, the way Tower Info and the Control Panel do.
- **patch**: `desk-pocket.css`: the pocket desk's Bulletin, Tower Info and Control Panel
  move by their title bars, as the Map already does; their places are no
  longer `!important`, and the mover keeps them inside the desk.
- **patch**: `desk-pocket.css`: on an upright phone the seven Tools tabs share the strip's
  width instead of scrolling, and the tools row no longer fades at its edge, so
  its last tool shows whole.
- **patch**: The pocket desk's tool strip hides locked tools again. Its grid layout
  outranked the palette's `.pal-item.locked` rule, so a tool above the
  tower's star rating (such as the Wedding Hall at 4★) showed in the strip.
- **patch**: `windows/menuBarTemplate`: a bar with `brand` now draws the app icon in its `.menubar-brand` span, as its
  docs say, so a game no longer fills the span itself.
- **patch**: The Tools window's section headers and category tabs hold their title alone. The template's
  line breaks had left a space on each side of the title, which pushed each header's text one space
  to the right of its fold arrow.
- **patch**: `DeskManager` leaves a maximized small window full size when the app window maximizes behind it;
  before, it stepped the window down below the app's menu bar at its old size.

## 2.2.0 (2026-11-21)

- **minor**: `windows/alertCard` exports `AlertCard`, a modal card that holds the page
  until one of its buttons is pressed (a crash card), or until its caller
  closes it (a wait card), with a status line it redraws on `update`.
- **minor**: `windows/updateBox` exports `updateBoxView`, the update box for the shared
  modal: the incoming version's notes as a list or a scrolling well, every
  skipped version's notes, a release notes link, the build lines, and Later
  and Update now.
- **minor**: The update box's rules (`.whatsnew`, `.build-id`) move from
  `styles/game/new-tower.css` to `styles/game/dialogs.css`, right where
  `styles.css` read them before, so the game sees no change and a page that
  loads only `dialogs.css` gets the update box's look.
- **minor**: `windows/desk/deskControlPanel` draws the desk's Control Panel: `ControlPanel` takes the icons
  (`ControlItem`: one of the four the package draws, a name and a tooltip), the ✕'s label, a
  `picked` callback and an optional title and title-bar icon. `setLabel` renames an icon while
  the window is open. The gallery has a Desktop > Control Panel page.
- **minor**: `windows/desk/deskManager` is the desk's window manager: `DeskManager` gives the focus and
  stacks the windows, keeps the taskbar's entries, runs a taskbar press (`deskTaskResult`) and
  the window menu, opens each window at its saved place or the page's own, remembers a maximized
  app window, keeps small windows off its menu bar, pulls windows back onto a desk that shrank,
  and brings up a window the page opens its own way. Window ids are the page's own.
- **minor**: `windows/desk/deskScreen` reads the screen for `deskMode` (`deskScreenOf` with `DESK_QUERIES`
  or a page's own queries, `watchDeskScreen`) and keeps the `?desk=` testing switch
  (`heedDeskSwitch`, `readDeskSwitch`) under a key and parameter the page names.
- **minor**: `windows/desk/deskTitle` draws the title screen's window title bar and taskbar on the desk into
  a root the page names (`DeskTitle`).
- **minor**: `windows/desk/deskStore` reads and writes storage without throwing (`read`, `write`,
  `localStore`).
- **minor**: `DeskWindow`, `DeskWindowSpec`, `windowMenuState`, `runWindowCommand` and `parseLayout` take
  a page's own window ids (the game's stay the default), and `DESK_WINDOW_IDS` lists the game's.
- **minor**: The gallery's desk runs on `DeskManager`: the taskbar lists the tower first, and a maximized
  tower stays under the small windows, which step below its menu bar, as in the game.
- **minor**: `windows/fireworks` exports `playFireworks`, pixel fireworks drawn first
  inside a dialog the caller names, under its box and over its backdrop. The
  show clears on its own, returns `stop`, and draws one still frame with
  reduced motion. The sky's steps (`newSky`, `stepSky`, `stillSky`,
  `drawSky`, `skyDone`) are exported too.
- **minor**: `windows/notFoundDesk` exports `notFoundDeskTemplate`, the "page not found"
  desk for a site's 404 page: a message box on the 1994 desk with a skyline
  missing a floor and a taskbar. The site gives the words and the links, and
  each link hears a click and a middle click. `trayClock` and
  `msToNextMinute` keep its clock on the minute.
- **minor**: `windows/overviewMapWindow` exports `OverviewMapWindow`, the Map window a game docks in its stage: the
  tower small with a box where the main view is, its Map button, drags, taps and keys that move the view,
  the open or closed choice per layout, and a summary a screen reader hears. It draws from one lit template
  and draws again only when something it shows changed.
- **minor**: `windows/overviewMapViews` exports `OverviewMapViews`, the View dropdown and the Hotel, Eval, Pricing,
  Traffic and Occupancy views with their legends, fed by readers the game hands in (rooms, clock, tiers,
  heat cells).
- **minor**: The modules they are built from come along: `overviewMapDom`, `overviewMapPresses`, `overviewMapKeys`,
  `overviewMapPicker`, `overviewMapLegend`, `overviewMapPrefs`, `overviewMapSpot`, `overviewMapPick`,
  `overviewMapText`, `overviewMapWorldPress` and `overviewMapDeps`. These are internal for now (README).
- **minor**: `windows/palette/toolPalette` is the game's Tools window as lit templates. `ToolPalette` draws the
  pinned tools and a section per build category into the game's `.palette-scroll`, and the phone's
  category tabs into its `.palette-tabs`, from the tools a game hands in with `update(view)`: their
  names, prices, swatches and descriptions, and which are locked, out of reach of the funds or
  picked. It keeps the open tab, the "new" pips on a tab whose category gained tools, and the folded
  categories (stored under a key the game names). Every tool keeps its element across updates, so
  the focus and a class the game adds stay on it.
- **minor**: `windows/palette/pressKeys` gives a `role="button"` element a native button's Enter and Space,
  and `windows/palette/paletteFolds` loads and keeps the folds.
- **minor**: `styles/game/tools-stage.css` places Inspect's and Bulldoze's icon on the name's line itself.
- **minor**: The gallery has a Tools window page.
- **minor**: `windows/bars/topBar` and `windows/bars/statusBar` are the game's Information bar and status bar
  as lit templates. `topBarTemplate(view, actions)` draws the badge, the six meters and the speed,
  Undo, Redo, Save, sound, Update and Install buttons; `statusBarTemplate(view)` draws the hint, the
  tool card, the tower and the bulletin line. A game renders them into its own `#topbar` and
  `#statusbar` elements on each status pass, the ids and classes stay as the stylesheets name them,
  and a class the game adds itself (the Play nudge) survives a render.
- **minor**: The gallery has an Information bar and status bar page, drawn in a frame over the game's desktop
  stylesheet.
- **minor**: `windows/desk/deskGeometry` has a Help window: `DeskWindowId` gains
  `"help"`, `defaultLayout` opens it in the middle of the desk at
  `HELP_WIDTH` x `HELP_HEIGHT` (shrunk to fit a small desk), `HELP_LIMITS`
  holds its smallest size, and `parseLayout` reads its saved place.
  `DESK_WINDOW_IDS` lists every desk window in the order the desk builds and
  saves them.
- **minor**: `windows/desk/deskHelp` exports `buildHelpWindow`, the Help window: the
  Player's Manual in a page frame under its own menu bar (the game's
  `MenuBarModel`, re-rendered through `menus`; Alt stays with the game's bar)
  and Contents, Back, Forward and Open in Browser (`setNav` turns Back and
  Forward on and off), styled in `styles/game/desk.css`. Its `dispose`
  takes the menu bar's page listeners off once the window is gone.
- **minor**: `windows/menuBar`: `MenuBar.dispose()` takes the bar's window and document
  listeners off, for a bar whose page outlives it.
- **minor**: `windows/desk/deskWindow`: a window counts as pressed when the focus moves
  into a frame inside it (a press or Tab into the Help window's manual, which
  never reaches the game's page), so it comes to the front and lights its
  title bar. `dispose` also drops a focus check the page's blur had queued.
- **minor**: The gallery's sample desk has the Help window, opened from Help > Player's
  Manual or the Verticopolis menu, with a sample manual in its frame.
- **minor**: `windows/menuBar`'s `MenuItemModel` takes `title`, the item's tooltip, and `content`, a lit template drawn in place of the underlined label for a line with parts of its own (a recent file's number and name, say). A later render changes both.
- **patch**: On an upright phone, the pocket desk's Info fits all five rating stars, the time and the whole traffic word ("Backed up"); the traffic chip drops its "Traffic" label to make room. On a sideways phone the map sits in the middle of the Map card instead of against its left edge.
- **patch**: On the pocket desk, Inspect and Bulldoze show their icons alone, so the tool strip has room for more tools; the tower window has no Minimize button; and on a sideways phone the Map card may take the whole height of the tower's view, so it is no longer drawn tiny. On any touchscreen desk the Start menu opens just above the taller taskbar instead of over it.
- **patch**: `styles/game/desk-pocket.css`: on a touchscreen the desk area now keeps in from the left and
  right safe-area insets as well as the top, so on a page with `viewport-fit=cover` the pocket
  desk's Tools column and tower no longer sit under a phone's notch. The Map, its toggle and the
  tool strip over the tower keep their plain offsets there, so they do not take the inset twice.
  Nothing moves on a page without it.

## 2.1.0 (2026-11-20)

- **minor**: `astro/TitleBar.astro` and `astro/TitleScreen.astro` are the docs title bar and title screen
  as Astro components, for a Starlight site's `Header` and `Hero` overrides. They take
  everything they show as props and read nothing from Starlight. The package lists the
  `astro-component` keyword so Astro compiles them from `node_modules`.
- **minor**: The build writes `styles/splash-skyline.svg`, the title screen's skyline as an image, and
  `styles/starlight-theme.css` tiles it from beside itself, so a docs site no longer serves its
  own `/splash-skyline.svg`. The theme also styles the wordmark's ™ (`.ts-word .tm`).
- **minor**: `windows/fileDialog/fileDialog` is the Open and Save As windows: `showFileDialog(shell, ctx)` opens one
  in a `ModalShell` over a folder the caller lists, with sortable columns, a File name box, a type list,
  Rename, Duplicate, Delete, Copy and Paste, a row menu on a right-click or a held finger, a question
  before replacing or deleting, files dropped to add, From a folder…, and a linked folder on the
  player's computer where the caller offers one. The caller names its files (`words`, `kinds`,
  `saveKind`) and its name rules (`cleanName`, `freeName`, `nameMax`), and runs every command.
- **minor**: `windows/fileDialog/versionsDialog` is Previous Versions (`showVersionsDialog`), which can put the
  window it was opened from back as the player left it.
- **minor**: `windows/fileDialog/fileIcons` draws the 16-pixel file icons (`fileIcon(mark)` with `towerMark`,
  `oldTowerMark` and `clockMark`, the folder icons and the warning sign).
- **minor**: `styles/game/file-dialog.css` now sizes the windows from their own markup inside the modal box.
- **minor**: `windows/messageBox` is the message box as a view for `ModalShell`: `messageBoxView({ title,
  icon, iconSize, text, buttons })` draws an optional icon before the title, one paragraph or
  several, and the buttons in the footer strip, each with its own `onPress` (and `primary`,
  `act` for `data-act`, `autofocus`). `messageBoxTemplate` is the body alone and
  `messageActionsTemplate` the button row alone, for a dialog with a body of its own.
- **minor**: `windows/screenSaver/*` is the screen saver. `skyScenes` (Skyline Starfield, Express
  Elevators, Bulletin Marquee) and `towerScenes` (Night Shift from a `TowerSnapshot`, Endless
  Tower) are its scenes over `saverScene`'s `SaverScene`. `screenSaver` puts one up over the
  whole page (`showScreenSaver({ makeScene, still, onEnd, hint })`, which keeps the input that
  ends it from the page) or drives one on a canvas (`runScene`). `saverTriggers`'
  `watchForSaver` starts it after a paused, untouched wait or on the way back to the tab.
  `saverPrefs` holds the choices (`loadSaverPrefs(key, touchScreen)`,
  `saveSaverPrefs(key, prefs)`). `saverDialog`'s `openScreenSaverDialog(shell, start, ports,
  { waitCaption, note })` is the Screen Saver dialog in a `ModalShell`; its OK and Cancel carry
  `data-act`.
- **minor**: `windows/siteMenu` is the Win95 menu bar a Starlight docs site wears: File (the site's items,
  then Print), Edit (Find, Copy Link to This Page), Options (the look and, when offered, the
  appearance schemes) and Help (the site's items). `mountSiteMenu(root, deps, items)` draws it,
  `siteMenuModel` is its model, `starlightDeps()` wires the built-in items to a Starlight page
  and `schemeDeps(key)` adds the schemes. Each built-in item carries a `data-site-item` code that
  a `picked` dep hears.
- **minor**: `windows/titleScreen/titleScreen` draws the game's title screen: `titleScreenTemplate(view)`
  takes the premise, the buttons (`TitleAction`), the small print and the optional mute,
  install and sponsor corners, and `titleSceneTemplate` and `wordmarkTemplate` draw the sky and
  the wordmark on their own. `windows/titleScreen/titleSkyline` holds the skyline's shapes. It
  imports `styles/game/splash.css`.
- **minor**: `windows/schemes` lists the appearance schemes (`SCHEMES`, `SCHEME_NAMES`, `DEFAULT_SCHEME`,
  `isScheme`) and dresses a page in one (`applyScheme`, `schemeOf`, and `loadScheme` and
  `saveScheme` under a key the page names). It imports no stylesheet and no lit.
- **minor**: `windows/appearance` is the Appearance dialog: `openAppearanceDialog(shell, current, save,
  { note, displaceable })` opens it in a `ModalShell`; `appearanceView` and
  `appearanceTemplate` are its view and body for a caller that drives the shell itself. It
  imports `styles/game/appearance.css`.
- **minor**: `windows/desk/deskWindow` takes the title bar's icon from the page: `DeskWindowSpec.icon`, and a last `icon` argument on `buildFrame` and `deskFrameTemplate`, name its URL. `DESK_ICON` (`./favicon.png`, the icon a window wore before) is the default when none is named.
- **minor**: New `windows/desk/deskTaskbar`: `DeskTaskbar` draws the desk's taskbar with lit: the Verticopolis button and its menu (items named by the game, Up and Down, Escape, a press outside), a button per open window that opens its window menu on a right-click or Shift+F10, and the tray with the Control Panel's monitor, the speaker and a clock that wakes once a minute. A game that drew its own taskbar over `desk.css` passes its items and handlers instead.
- **patch**: On the pocket desk, Tower Info and the Control Panel open across the top of the desk at the height of what they hold, with the tower showing below, instead of stretching to the whole screen with empty gray under them.

## 2.0.0 (2026-11-20)

- **major**: `windows/desk/deskWindow` draws the desk's pieces with lit-html: the
  frame, its title bar's icon and buttons, the size grip and the resize
  outline, with their events bound in the templates. `buildFrame(doc, id,
  title, close?)` takes the frame's ✕ (`{ label, onClick }`) and returns
  `{ root, body, setTitle }`; `setTitle` renames the window in place, and
  `titleText` is gone. `titleButton` is gone: a frame's ✕ comes from
  `buildFrame`. `deskFrameTemplate` is the frame's template.
- **major**: `windows/desk/deskWindowMenu`'s `WindowMenu` draws its menu with lit-html
  and re-renders the grayed items each time it opens. Its API is unchanged.
- **major**: `windows/icons` draws icons only through lit: `iconTemplate(name, opts)` for an icon and
  `messageWithIcons(message)` for a bulletin line with its leading emoji swapped for an icon.
  `iconElement` and `appendMessageWithIcons` are removed; render `iconTemplate` or
  `messageWithIcons` in a lit template instead.
- **major**: `windows/escape` (`escapeHtml`) is removed. Nothing in the package builds HTML strings
  anymore, and a lit template escapes every binding.
- **major**: `windows/uiModal` draws the modal with lit. `ModalShell(dialog, { gameStopped, toast })`
  takes the shared `<dialog>`; `open({ title, body }, opts)` draws the window grammar
  (the box, the title bar with its title span and ✕, the notice line, the body), opens
  the dialog and returns its box, `render(view)` redraws an open dialog in place,
  `close()` clears it, and `say(text, again, kind)` puts a notice under the title, holds
  it for the next dialog mid-replace, or toasts. `noticeTemplate(text, kind)` is the
  notice line on its own.
- **major**: Removed: `finishModal` and `ModalDeps` from `windows/uiModal`, and `routeNotice`,
  `mountNotice` and `ModalPrecedence.drainNotice` from the precedence module. A caller
  builds its body as a lit template and hands it to `ModalShell.open` instead of
  building the box itself. `ModalPrecedence.takeNotice()` hands back a held notice
  (`{ text, kind }` or null) for the shell to draw.
- **major**: `windows/menuBar`'s `MenuBar` draws the bar itself with lit-html from a
  `MenuBarModel` (titles with their underlined letter, items with a shortcut,
  a check, a radio group, grayed, hidden, a link, `data-*` attributes or an
  `onPick`, separators and submenus), and binds its handlers in the template.
  The constructor is now `new MenuBar(host, model, options)`, and
  `bar.render(model)` redraws it with a changed model. A page no longer
  writes the bar's markup or wires its items' clicks; the constructor that
  wired hand-written markup is gone. The model types are exported from
  `windows/menuBar`, and `windows/menuBarTemplate` holds the template.
- **minor**: `styles/starlight.css` now also wears the game's color schemes, through the
  new `styles/starlight-schemes.css`: under `html[data-scheme="skyline"]` or
  `html[data-scheme="high_contrast"]`, a Starlight site's header, selected
  row, buttons and title-screen buttons take the scheme's shapes, and High
  Contrast sets Starlight's own colors to white on black. Nothing changes on
  a page without `data-scheme`.
- **minor**: New `styles/starlight-menu-bar.css`: the game's menu bar across the top of a
  Starlight site, above the title bar. A site with the bar adds it after
  `starlight.css`; see the README's Styles section.
- **minor**: `styles.css` adds `desk-pocket.css`, the desk on touchscreens: `body.desk-touch` gives the desk a 44 px taskbar, 44 px menu rows and 44 px touch areas on title-bar buttons, and `body.desk-pocket` lays out the pocket desk, a full-screen tower window whose `.desk-pocket-body` grid holds Info, Tools and the tower, with the Map floating over the tower at the size it has on phones.
- **minor**: `windows/desk/deskPocket` exports the pocket desk's pieces for a game: the classes (`DESK_TOUCH_CLASS`, `DESK_POCKET_CLASS`, `POCKET_BODY_CLASS`), the media queries (`TOUCH_MQ`, `TOUCH_DESK_MQ`), `deskMode` (which desk a screen gets: the full desk, the pocket desk or none) and `pocketBody` (the grid, drawn with lit-html).
- **patch**: `windows/uiModal`'s `ModalView` types its `title` as `string | TemplateResult` and its `body` as
  `TemplateResult`, so typecheck catches a caller handing it an element or a node list.
- **patch**: `windows/detached`'s `renderDetached` throws on top-level text (which is never placed) and when an
  update changes a top-level value into text, as it already did for new elements.

## 1.0.0 (2026-11-20)

- **major**: the package depends on no simulation. The deprecated subpaths that
  re-exported `@verticopolis/engine` are gone: `catalog/*`, `binding/*`,
  `port/*`, `host/*`, `events/*` and `fixtures/*`, and `model/types`,
  `model/engineTypes`, `model/unitState`, `model/viewZoom`,
  `model/floorRuns` and `model/serializedGame`. Import those from
  `@verticopolis/engine` itself. The engine is no longer a peer dependency.
- **major**: `presentation/catalogCheck`'s errors name the catalog by its mode ("the
  classic catalog"), without the engine.
- **major**: `npm run atlas` takes `--catalog <file>` to bake against a game's own
  Modern render catalog; without it the bake uses the components' own.
- **major**: `ui/uiModal`'s `ModalDeps.engineStopped()` is now `gameStopped()`: a modal
  still never opens over a game-failure message. Rename the member where the
  game passes its deps.
- **major**: The sprite atlas manifest's notes say "the simulation" where they said
  "the engine". No frame, field or schema version changes.
- **major**: The `shared/*` subpath is gone. It was the old name of `model/*`, kept as
  an alias after the folder's rename: import
  `@verticopolis/components/model/*` instead (the files are the same).
- **major**: Semver now covers the stable subpaths: `windows/*`, `styles.css`,
  `styles/*`, `model/*`, `render/renderModel` and `render/towerSource`. The
  rest of `render/*` (the scene in `render/excalibur/*` included),
  `presentation/*` and `audio/*` are internal: a game may import them pinned
  to an exact version, but they can change in a minor version (README, "Use
  it").
- **patch**: On a portrait phone, the Getting Started card no longer covers the top
  bar's stat chips. It sits just under the bar (CSS anchor positioning), as
  it now does on a phone held sideways, with a measured top for each width
  tier in a browser without anchoring. It used to sit at 58px, over all of
  the chips. On a short phone its step list scrolls instead of reaching the
  tool palette.

## 0.3.0 (2026-11-20)

- **major**: the renderer, presentation, UI and audio import nothing from the engine
  (engine#89). `render/renderModel` declares what they read (`RenderSim`,
  `RenderTower`, `RenderCatalog`, `RenderRules` and the frame shapes), and a
  game fills it from the engine's frame reader and catalog with no copy.
  `render/towerSource` replaces the per-tower catalog handle:
  `useTowerSource(tower, { catalog, rules })` sets a tower's catalog and the
  engine's rules (`isPresent`, `isOperational`, the zoom limits), and
  `useFallbackSource` the one a hand-built tower reads.
  `render/catalogIndex` holds `findCatalogFacility`, `catalogFacility` and
  `catalogOpenAt` over a `RenderCatalog`.
- **major**: `TowerEngine` takes no view reader: it reads the camera, the clock and the
  tower from its `RenderSim`. Its zoom limits come from the tower's rules, so
  `towerInputCamera` no longer exports `MIN_ZOOM` and `MAX_ZOOM`.
  `RenderTower.tallLobbies()` is now `lobbyHeights()`, the engine's raw
  heights, and the renderer works out the halls itself. `shadesRoom` takes the
  rules' `isPresent`.
- **major**: `presentation/clockOf` takes the header's date fields and the engine's
  clock (`clockOf(header, sim.clock)`) and reads them once.
  `presentation/catalogCheck` is the boot check a game hands the engine as
  `checkCatalogs`.
- **major**: the engine's own code is gone from this package. `catalog/*`, `binding/*`,
  `port/*`, `host/*`, `events/*` and the engine's `model/*` modules now
  re-export `@verticopolis/engine` (1.60.0 or later) under their old paths and
  go in 1.0; `catalog/towerCatalog`, `port/headerClock`,
  `port/portRenderSim` and `host/catalogCheck` wrap or alias their new homes.
  The engine becomes an optional peer, and `fixtures/*` serves the installed
  engine's fixtures.
- **major**: every stylesheet puts its rules in a cascade layer under `vc`
  (`@layer vc.tokens, vc.base, vc.components, vc.page;`), and each
  component's sheet in its own layer inside `vc.components`. A page's own
  unlayered CSS now beats every components rule whatever its specificity and
  wherever the bundler puts it; a `!important` inside a `vc` layer beats an
  unlayered one. A page that layers its own CSS orders it against `vc`
  (README, "Cascade layers"). The game's stylesheet keeps every rule's
  winner, so the game draws the same. On a page that loads `retro-page.css`
  in a dark OS theme, the dark teal ground now applies only when no color
  scheme is set (`html[data-scheme]`), so Skyline and High Contrast keep their
  own ground; the components gallery, which never showed the dark ground
  before, now shows it in Standard, as the game's own standalone pages do.
- **major**: the window modules import their own stylesheet: `windows/menuBar` imports
  `styles/menu-bar.css`, and `windows/uiModal` and `windows/movableWindow`
  (so `windows/desk/deskWindow` too) import `styles/window.css`. A page that
  uses only those modules no longer needs a stylesheet import for them. They
  now need a bundler that loads CSS imported from JavaScript (Vite does);
  plain Node can no longer import them. Their declarations do not carry the
  CSS imports.
- **major**: a Starlight site declares `@layer starlight, vc;` through Starlight's `head`
  option rather than a first `customCss` entry: Astro puts the menu bar's CSS,
  which the `windows/menuBar` module now imports, ahead of `customCss`.
- **minor**: `styles/starlight.css` dresses a Starlight docs site in the game's look:
  the tokens, `styles/starlight-theme.css` (the How to Play window's title
  bar, sidebar and reading well, and the title screen for a page with a hero)
  and `styles/title-bar.css` (the docs title bar's `.vc-bar` markup). These
  are the stylesheets the engine docs and the help site each kept a copy of.
  Both new sheets sit in `vc.page`; a Starlight site loads a file holding
  `@layer starlight, vc;` first (README, "Styles").
- **minor**: `src/shared/` is now `src/model/`, exported as `model/*`: the
  tower model types and the small helpers over them. `shared/*` stays as an
  alias for the same files until 1.0, so existing imports keep working; move
  them to `model/*`.
- **patch**: the declarations resolve under `nodenext`. Every relative import in the
  shipped `.d.ts` files now names its `.js` file (or `/index.js`), so a
  project that resolves modules the way Node does follows them instead of
  failing, or reading every imported type as `any` with `skipLibCheck` on.
  The packed package's `engines` is `node >=22` in place of `26.x`, so an
  install on Node 22 or 24 no longer warns; the package runs on both. The
  repository's own tooling stays on Node 26.
- **patch**: the renderer's context-loss handler stops the Excalibur engine
  with its public `stop()`, which also stops the texture collector and pauses
  the browser listeners, instead of stopping only the clock. The rebuild's
  teardown (`render/excalibur/engineTeardown`) still stops the collector for
  a context lost while the screen saver held the frames, and a test against
  the real Excalibur now fails if an upgrade moves that private field.
- **patch**: On a phone held sideways, the Getting Started card no longer covers the top
  bar. Its top follows the bar's bottom edge (CSS anchor positioning), so it
  clears the bar however many lines the bar wraps to. A browser without
  anchoring uses a top measured for each width tier. The card used to sit
  21px over the stat chips from 540 to 819px wide.

## 0.2.2 (2026-11-19)

- **patch**: the shared chrome is split into one stylesheet per component
  (`styles/button.css`, `styles/window.css`, `styles/well.css`,
  `styles/kv.css`). Each imports what it needs, so a page can import one
  piece on its own. `styles/retro-components.css` imports them in the old
  order, and `styles/menu-bar.css` and the overview map stylesheets import
  their own prerequisites, so a page that imports what it did before gets the
  same CSS.
- **patch**: `styles/retro-page.css` no longer draws a menu bar's `kbd`
  shortcuts as keycaps when the menu bar sits inside a window body. The game
  does not load `retro-page.css`.

## 0.2.1 (2026-11-19)

- No change to the package. The sprite atlas workflow runs from the tag it is
  dispatched on and installs the engine from npm.

## 0.2.0 (2026-11-19)

- **minor**: the package ships compiled JavaScript. `npm run build` compiles
  `src/` into `lib/`, one ES module per source module with source maps and
  `.d.ts` files, comments kept (the pixelarticons MIT notice included). Every
  subpath export points at `lib/`, and the tarball holds `lib/` and no
  sources, so Node and bundlers load it from `node_modules`. Bare imports stay
  external, `import.meta.env` is left for the game's bundler, and
  `sideEffects` stays CSS only.
- Released from a workflow: the GitHub release carries the tarball and its
  SHA-256 checksum, and npm gets that same tarball through trusted publishing,
  with provenance.

## 0.1.0 (2026-11-19)

- **minor**: the first release of the components extracted from the game's
  repository: the renderer and Excalibur scene, the Win95 windows and menus,
  the procedural sprites and audio, the engine binding and port, and the
  WebAssembly host loader, as subpath exports (`render/*`, `windows/*`,
  `audio/*`, `binding/*`, `port/*`, `host/*`, `presentation/*`, `catalog/*`,
  `events/*`, `shared/*`, `styles/*`, `styles.css`). Peers:
  `@verticopolis/engine` `^1.57.1`, `excalibur`, `tone` and `lit-html`.
