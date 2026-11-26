# Engineering Backlog (Verticopolis/components)

The backlog for this repository: follow-ups, review deferrals and ideas that are
real but not actioned in the PR that found them. Must-fix items to ship a story
belong in that story's tasks.

How items flow:

1. The review skills (`gds-code-review`, `bmad-code-review`, `*-quick-dev`)
   append each `defer` finding to the **Deferral inbox** below, under a dated
   `### Deferred from:` heading.
2. The PR that parks a `defer` triages its own new inbox entries before it
   merges: it folds each into a curated row (with a mirror issue when
   unresolved), marks it absorbed or superseded with a pointer, or retires it
   with a one-line factual reason. The inbox holds only work that has not merged.
3. **GitHub mirror.** Every curated row that is not finished has a matching open
   issue in this repository, recorded in the `GH` column as `#N`. Finished means
   `done`, `resolved`, `shipped-v1` (its remainders live on their own rows), or
   `superseded`; every other status is open work and needs a live issue. Create
   the issue when the row lands, with a plain title, a type label, the row's
   priority as a `P1`/`P2`/`P3` label and the row's notes as the body, laid out in
   the issue form the type label names. The row's `Priority` cell owns the P
   label; this repository has no label sync, so change both together. When a row
   finishes, close the issue and set the `GH` cell to `—`; when an issue closes
   first, true up the row in the next session that touches this file. A rule
   change never lands here: it goes to Verticopolis/engine, and a game's
   change to its own screens goes to that game's backlog.
4. `Type` legend: `review-deferral` (a real finding parked for scope),
   `perf` (a measured/suspected optimization), `feature-request` (unbuilt
   capability awaiting a spec), `bug` (a player-reported defect awaiting a
   fix), `design-decision` (a ruling recorded for the record, often parked
   with its trigger), `task` (a scoped follow-up with a known method).
   `Status`: `open`, `in-progress`, `idea` (feature not yet specced),
   `done` (delivered in full), plus the table's established refinements:
   `partial` (a named remainder is still open), `parked` (deliberately
   shelved with a resurrection condition), `next` (queued), `ready`,
   `shipped-v1` (first version shipped; the row tracks refinements),
   `resolved` (investigated or fixed and verified; kept for the record),
   `superseded`, and `impl-review` (implemented, awaiting review/validation).
5. `Priority` is the do-first order (impact × effort × risk, and whether the
   item is blocked), distinct from `Severity`, which is impact alone. **P1**:
   work next; real correctness/data-safety impact and ready to pick up. **P2**:
   worthwhile, do opportunistically when you next touch the area. **P3**:
   low/cosmetic, blocked on investigation, watch-only, or a feature awaiting a
   spec. The `Priority` value stays strictly `P1`/`P2`/`P3`. Within P3, each
   row's Notes lead with **Ready.** or **Gated.** so nobody burns a session
   grabbing a blocked "easy P3."
6. **History.** This backlog started on 2026-11-20, when each Verticopolis
   repository took its own BMAD setup. The rows and notes about this
   repository came over from Verticopolis/web's backlog with the file's git
   history. In anything dated before then, a bare `#N` means
   Verticopolis/web#N and paths are the paths of that time (the engine's were
   under `engine-rs/`, and the renderer, sprites and audio were under web's
   `src/`). The `GH` column cites this repository's issues.

| Date | Story | GH | Epic | Type | Priority | Severity | Owner | Status | Notes |
| ---- | ----- | -- | ---- | ---- | -------- | -------- | ----- | ------ | ----- |
| 2026-11-26 | transport-pick-column-index | #157 | render | review-deferral | P3 | low | — | open | **Ready.** Deferred from the independent /gds-code-review of #156 (HP-2), the lazy `pick()` for the pointer hooks (F1, also HP-7, pre-existing and moved, `perf`). When a hook does call `pick()` (in the web game, the Inspect hover and the bulldoze drag), `pickAtPoint` in `src/render/excalibur/towerPick.ts` still calls `Actor.contains` on every transport actor on each pointer move: 88 actors in Classic, up to 48 shafts plus about 5,000 links in Modern (an exploratory cloud micro-bench put a miss at about 25 us at 88 actors and 2.6 ms at 5,014). Remedy: bucket the transport actors by tile column, rebuilt when the actors change, so a pick checks only the actors whose span covers the pointer's column, keeping the `>=` z rule and its last-wins tie (HP-10). Done when a pick costs O(actors in the column), with tests on the tie and on a rebuild after a shaft changes. `/gds-code-review` with the hot-path checklist. |
| 2026-11-16 | per-tower-doorman-staffing | — | render | review-deferral | P3 | low | — | done | **DONE (closes #2384 on merge): the structure pass records each tower's ground-floor span, the scene sync staffs each tower from its own present tenants, and the grand entrance picks a staffed or empty canvas per tower; Classic still staffs from the whole lot.** Was: Deferred from the review of #2378 (each Modern tower draws its own grand entrance and doorman). The entrance staff are still gated on the whole lot holding a tenant (`staffed` in `towerReconcile.ts`, #552), so an empty tower shows a doorman while another tower on the lot is leased. The grand entrance canvases are shared by every tower, so a fix needs a staffed and an unstaffed variant (or per-tower graphics) chosen when the structure pass stamps the entrances, with no per-frame work added. Done when an empty tower beside a leased one shows no doorman, with a unit test on the stamping. `/gds-code-review`. |
| 2026-11-15 | menu-bar-wide-view-draw-time | — | render | perf | P3 | low | — | done | **DONE (closes #2285): paired run on `maxed-modern`, paused, 6 rounds (2026-11-15, numbers on the issue). At the same build area 4.1.1 draws no slower than 3.15.0 (5.05 against 6.00 ms median); at 1440x900 the 24% wider view costs about 11% median draw, the extra rooms, so no fix is needed.** Original note: **Gated** on a paired perf run. Deferred from the review of the 4.0 menu bar (#2222) and recorded late by the 2026-11-15 backlog audit: with the right sidebar gone the build area at 1440x900 grew from 1008 to 1246 px, so each frame draws about a quarter more tower. Compare frame draw time at the old and new widths on a large tower, record it on the issue, and fix any regression (nothing may get slower). |
| 2026-11-15 | modern-depth-look | #1 | render | feature-request | P3 | — | — | idea | **Gated.** Future Modern update, not now (owner, 2026-11-15). An opt-in 2.5D depth look: rooms drawn as shallow oblique boxes (floor, back wall, side wall) baked into the existing region canvases from the sprite atlas's depth layers, so it needs no new asset files. Classic stays flat by default. **Condition (owner): it must not degrade web performance anywhere.** With the look off the game runs exactly as today; with it on, no frame, memory or load-time regression, measured on a big tower and a low-end phone before any lighting is added. No three.js. `/gds-code-review` with the hot-path checklist. |
| 2026-11-13 | decorative-walkers-off-traffic | — | render | feature-request | P2 | medium | — | resolved | **RESOLVED in the decorative passers-by PR, closes #2091 (owner approved 2026-11-13).** Player feedback (Reddit, 2026-11-13) (`reddit-feedback-2026-11-13/party-decorative-walkers.md` in project files). Classic: no decorative walkers (SimTower had none). Modern: no lobby pacers or stair climbers, corridor figures only on occupied floors at half count, a default-on "Show decorative passers-by" setting, off under reduced motion. Render-only, `/gds-code-review` with the hot-path record. |
| 2026-11-13 | tower-outside-view | #35 | render | feature-request | P3 | low | — | open | **Player feedback (Reddit, 2026-11-13).** Modern: a view-only exterior of the tower (facade, lit windows by time and occupancy, roof and lot) with the normal zoom and pan. Needs a design pass and original facade art. |
| 2026-11-12 | full-zoom-legibility | #2 | web track | feature-request | P2 | medium | — | open | **Ready (owner decision 2026-11-12, Visual Renaissance cut, roadmap #1189).** On a 120-floor Tall lot (#1983) the whole tower is only visible at minimum zoom, where room families can read as one smear on a phone. A legibility pass on the current Excalibur renderer and procedural paint: distinct silhouettes and a tonal scale per facility family, landed against `docs/design-system.md` tokens; folds in #826 and #350 where they fit; a pinned gallery scene of a full 120-floor tower at minimum zoom (desktop and phone); a one-day real-phone measurement (p99 frame, memory high-water) with raw results kept privately; a paint change bumps the atlas. A ship condition of #1983. |
| 2026-11-03 | regions-fire-actor-coverage | — | render | task | P3 | low | — | done | **Deferred from #1599, done.** `src/render/excalibur/towerReconcileFire.test.ts` drives `syncScene` with a unit that ignites, burns and is put out: the room leaves its region for one private actor, keeps that one actor while it burns, and is retired and baked back into its region the same frame the fire ends. A room under construction takes the same path. The e2e spec keeps the settled-room and budgeted-drain checks. |
| 2026-10-14 | basement-negative-seeds | — | render | review-deferral | P3 | low | — | done | **DONE (closes #1029 on merge): `figureSeed` in the sky bar, boutique, arcade, nightclub and daycare sprites returns an unsigned seed (`>>> 0`, unchanged at or above the ground floor), so no basement pick indexes a negative palette slot. `originSeeds.test.ts` paints each in B4 (the daycare at noon, when it is open), and the integration sweep moved its basement look to B4 at column 2.** Original note: Deferred from the `/gds-code-review` passes on the #915 fix (`sprite-origin-seeds`); pre-existing. Several Modern rooms take a per-room seed straight from geography, `(u.floor * K + u.x * M) \| 0` (`figureSeed` in `src/render/pixelSprites/skyBar.ts`, `boutique.ts`, `amusements.ts`, `nightclub.ts`, `daycare.ts` and similar), then index a palette with `PALETTE[(i + seed) % PALETTE.length]`. Commercial and entertainment rooms may sit in the basement (`NO_BASEMENT_KINDS` in `src/engine/tower/towerTopology.ts` lists only offices, condos and hotels), so on a deep floor with a small column the remainder is negative, the lookup is `undefined`, and the canvas silently keeps the previous fill. Known sites: the sky bar's bottles, the boutique's florist blooms and garments, the arcade screens, the nightclub beams, the daycare mats. Fix: derive a non-negative pick (`Math.floor(hash(seed) * n)` added to per-element counters, as #915 does for the climbing holds and claw prizes, or seed through `geoVariant`), and add basement cases to `src/render/originSeeds.test.ts`, whose raster throws on an invalid fill. `/gds-code-review`. Sites the second review of the merged stack found beyond those named: the boutique's record spines and gallery art (`boutique.ts`), the nightclub's `BEAMS[seed % len]`, and the daycare's mat, toy and child smock picks (`MAT[seed % len]`), so the fix PR's basement tests cover them too. A fixed basement test for a pharmacy, phone repair and claw parlor already runs in `originSeeds.test.ts`. |
| 2026-10-20 | origin-seed-test-hardening | — | render | review-deferral | P3 | low | — | done | **DONE (closes #1117 on merge).** The doctor's seed now sits 1 to 9 past the nurse's (`staffSeed * 2 + 2 + geoVariant(u, 7, 9)`), and the cast has 10 looks, so a nurse pairs with nine doctors and never with their own twin; `src/render/sprites/facilities/medicalStaff.test.ts` pins both, and each assertion fails on the old seed or the rejected one. The owner closed the pharmacy, claw parlor and climbing wall color reshuffles as not worth it (2026-11-19, after before-and-after crops: the repeats only show with many rooms side by side). Earlier: **Partly done (PR #2508):** the sweep now paints the sampled variant placements, the part past a region seam and the extra `DrawCtx` inputs; the raster reads a fill's color before its clip test; the sky bar test compares windows at one building slot and height. **Left, both art changes that need the owner's pick and a screenshot refresh:** measured on 15 placements, the empty pharmacy shows 3 looks, the claw parlor 5 and the climbing wall 4, so their stripe patterns do repeat; and the doctor's shirt is fixed by the nurse's (5 nurse looks, one doctor look each), since both seeds come from one staff seed. **Ready.** Deferred from the independent reviews of the #915 fix (PR #1039). The origin-seed tests leave gaps: the every-kind sweep paints no `variantPlacements`, no region seam and none of the extra `DrawCtx` inputs (parking use, recycling fill, `anim`, staffed, stress); the software raster skips a fully clipped rect, so the invalid-fill check never sees a bad color there; the regular stripe patterns in the pharmacy shelves, climbing holds and claw prizes could repeat across rooms unnoticed; the nurse and doctor shirts are correlated; and the empty sky bar check would still pass if the seed ignored the room but the building heights kept varying. Fix each with a mutation-checked test. `/gds-code-review`. |
| 2026-08-13 | figure-guard-blind-to-non-figures | — | visual-parity | task | P3 | low | — | resolved | **#832: Closed not planned 2026-11-15 (open-bug triage party, owner OK): the miss only shows below 120px and no daycare ships narrower, so this is coverage of widths that never ship.** **Deferred from the second `gds-code-review` of the room occupant seats fix (#813, PR #831).** `roomContainment.test.ts`'s figure-overlap guard finds figures by the contact-shadow literal `rgba(0,0,0,0.24)` that `personFigure` stamps, so occupants drawn as something else are invisible to it: a daycare's children (`child()`, a 3px silhouette) and a spa guest on a massage table (a fold of linen). Five swept kinds perform zero comparisons: daycare, spa, Weight Floor, Boxing Gym, Climbing Wall. The daycare matters because its `places` row is one this change rewired, and at 60-117px its last child collides with the caregiver's torso. That is below the daycare's shipped 120px catalog width and the child paints over the caregiver rather than under, so nothing visible is wrong today, but a width move would not be caught. Fix by locating non-figure occupants on their own literals so coverage follows the occupant, not the sprite build. Smaller and related: grouping by exact `foot` would silently skip a future pair of figures 1px apart in y. |
| 2026-08-13 | ghost-coverage-five-looks | — | visual-parity | task | P3 | low | — | done | **DONE (2026-11-14, PR #2198 merged, closed #833): the honesty sweep in `roomCapacity.test.ts` now covers the VR lounge, mini golf, weight floor, boxing gym and climbing wall at min(present, seats).** **Deferred from the second `gds-code-review` of the room occupant seats fix (#813, PR #831).** `roomCapacity.test.ts`'s honesty half (a room draws `min(people, seats)`, no ghosts) covers skyBar, nightclub, daycare, Yoga Studio and Spin Studio. VR Lounge, Mini Golf, Weight Floor, Boxing Gym and Climbing Wall are only rendered at full occupancy and asserted for capacity, so nothing asserts an EMPTY one of those draws nobody: a ghost member in an unoccupied gym passes the whole suite. The suite's own framing is that under-drawing and ghosts are equally wrong, so extend the honesty sweep to every populated look rather than only the ones this pass rewired. |
| 2026-10-15 | room-seat-picks-correlate | — | visual-parity | review-deferral | P3 | low | — | done | **Done (2026-11-16): fixed in the pull request that closes #1069. `busyStations` hashes the seed before the station index joins it, so neighbors no longer share one shifted pick order; the ranking stays a prefix order.** **Deferred from the round-1 `gds-code-review` of the refreshed room occupant seats fix (#813, PR #831), Blind Hunter, low.** `busyStations` ranks stations by `hash(seed + i)` and its callers pass `figureSeed(u) * k` for a small per-row `k`, so two rooms whose figure seeds differ by one share most of their pick order shifted by `k` places on a row longer than `k`, and a floor of identical rooms can repeat one scatter. Cosmetic: the count stays `min(people, stations)` and the picks stay a pure function of the seed. Fix by mixing seed and index before hashing while keeping the ranking a prefix order (a crowd must only grow as people arrive, which the atlas relies on). Moves pixels, so it rides the visual baselines. |
| 2026-10-15 | room-crowd-tests-hardening | #5 | visual-parity | task | P1 | low | — | open | **Milestone 5.x, top priority (owner, 2026-11-19: 4.x is nearly done, so the Backlog and Triage sweep goes to the top of 5.x).** **Deferred from the round-1 `gds-code-review` of the refreshed room occupant seats fix (#813, PR #831), Blind Hunter, low.** The guards that fix added can pass for the wrong reason in places: `roomContainment.test.ts` reads only `fillRect` spans and runs containment at whole-pixel origins only; one `artScale.test.ts` case restates `artRow`'s own formula, its "never stacks" case wraps one call, and its fractional case accepts an anchor a pixel outside the run; `roomCapacity.test.ts` restates row margins in its expectations; figure counts key off shared color literals (contact shadow, skin, single hex keys); and the "quiet hall scatters" case measures spread against its own sample range. Make each check fail when the property it names breaks. Added by the second review of the merged stack, and closed by the independent review of PR #831: each rewired painter is now held to the atlas rounding (`roomOccupants.test.ts` draws every rewired kind at `k - 0.5` and `k - 0.01` people and requires the picture of `k`), and a lone visitor is held to a spread over the whole row and the nightclub to its 6px pitch and a clear booth (`roomCrowdSpread.test.ts`); all mutation-checked. Still open: no test draws a fractional `outForMeal` through the painters, the crowd-only-grows sweep leaves out the office and runs one floor and 16 columns, and the containment sweeps run `busyStations` partial crowds at none of the widths. |
| 2026-10-20 | room-painters-read-ts-engine | — | visual-parity | task | P3 | low | — | done | **TypeScript-engine retirement, done.** `roomOccupants` in `src/render/pixelSprites/common.ts` now computes a room's visible count itself (`occupants` minus `outForMeal`, rounded up, both clamped as the atlas clamps them) and every room painter, residential, food, clinic and the venue sprites included, reads it from there, so no painter imports `visibleOccupants` from the TypeScript engine. The engine's frame already carries `occupants` and `outForMeal` per room, so the renderer owns only this display rule, which the atlas archive records. The ratchet lost six lines. |
| 2026-08-13 | room-capacity-kinds-fail-open | — | visual-parity | task | P3 | low | — | superseded | **#829: Folded into #832 on 2026-11-11 (issue closed as a duplicate; the item is listed on #832). Pick it up there.** **Deferred from the `gds-code-review` of the room occupant seats fix (#813).** `src/render/pixelSprites/roomCapacity.test.ts` names the kinds it covers in a literal list. It pins all eight populated kinds that lay furniture out in a row and picks up new SUBTYPES automatically from the look tables, but a new KIND would be silently uncovered: the suite keeps passing while the new room draws the wrong number of people. Fail closed by driving the kind list off `FACILITIES` (every entry with `population > 0`), pinned per kind, so adding a populated kind without a capacity expectation breaks the build. Hides no current defect; it leaves the door open for the next one, and the defect class it guards is exactly the silent under-draw of #813. Added by the second review of the merged stack, all reachable only through a forged or corrupt save: a unit with a NaN `width` draws nobody live (`artRow` returns no anchors, and the meeting-room office draws no chair) while `lookupRoom` reads that width as the catalog width and draws the baked crowd; a live room draws up to its station count while the atlas chain stops at `occupantCap` (a Spin Studio with 25 occupants draws 21 riders live and 20 in the atlas); the spa, Weight Floor, Boxing Gym and Climbing Wall draw a fixed small number whatever the population, and `roomCapacity.test.ts` pins that. Also, a forged unit with a huge finite width (about 1e9 tiles) makes `artRow` and `busyStations` allocate per anchor and can exhaust the heap; save load already makes widths finite and 1e6 does not throw, so clamp the anchor count to what a room can hold. |
| 2026-08-13 | sprites-test-retired-tile | — | visual-parity | task | P3 | low | — | superseded | **#830: Folded into #832 on 2026-11-11 (issue closed as a duplicate; the item is listed on #832). Pick it up there.** **Deferred from the `gds-code-review` of the room occupant seats fix (#813); pre-existing, not introduced there.** `src/render/sprites.test.ts` still drives every room kind at the retired 11px tile: rects of 132x44, 176x44, 220x44 and 88x44 run through `drawUnit` at lines 162-272, geometry the renderer no longer produces since the world moved to TILE 10 by FLOOR 45. A suite exercising sizes the game never renders can pass while the shipped sizes are broken, which is plausibly part of why the #813 under-draws went unnoticed for so long. The one case #813 touched was moved to `roomCapacity.test.ts` at the bay's real rect; the rest wants its own sweep, restating each rect as `width * TILE` by `facilityFloors(kind) * FLOOR` so the suite follows the world constants instead of pinning history. |
| 2026-10-15 | service-sprite-polish-10x45 | — | visual-parity | review-deferral | P3 | low | — | resolved | **RESOLVED in the service sprite polish PR, closes #1063 (owner approved the art changes 2026-11-15).** Every item below is fixed, the mop composition stays as it was, and `Fu` now stops at the room's edge with the bounds guard run at 0.75, 1.25 and 1.5 scale. Deferred from the `/gds-code-review` of PR #817 (the 10 x 45 re-author of the six service sprites); every item changes pixels in approved art. Introduced or worsened by the re-author: the parked car in `garage.ts` drawParking (`cx = 13, cw = 24`) paints over the right stall line at `W - 4`, so the line vanishes under a car (centered is `cx = 11`); the ramp's stall divider at x 144 merges into the right pillar at 145 (main had a 1px gap); the ramp P roundel hangers sit 3px from the left and 2px from the right; the recycling pipe brackets (pitch 28 from x 6) leave 6px at the left wall and 24px at the right; the recycling bin arrows sit off center after the bins narrowed to 15. Inherited: the housekeeping cart's second towel is overpainted by a spray bottle; the security alarm light overpaints the key rack; recycling compacted cube 0 covers the baler's left bevel, the belt caps leave no gap to the end bales, the roof ribs stop at x 180, and the right work lamp (x 136) is buried under the sorting sign; the ramp car's tail lamp sits 1px outside its body. Not a defect: the housekeeping mop and bucket sit mostly behind the towel rack on purpose (approved composition, PR #817 item 6; the head and the top of the handle, rows 23 to 27, show above it, and a comment in `drawHousekeeping` says so). Found in the second `/gds-code-review` pass on the merged stack and not yet art-approved: the medical exam beds' pillow and blanket overlap by one column (head at x 27 to 32 against the blanket from x 32, and 133 to 138 against 138), the ramp chevrons step 5, 4, 5 down the slope, and the medical ceiling lamps leave 22px at the left wall and 9px at the right. Found by the independent review of PR #831: the sky bar's bartender ends 1px from the nearest stool, so two figures can read as one. Found by the independent review of PR #817 at 48c981a: the ramp's ceiling joists sit at gaps that alternate 14 and 15 (15, 29, 44, ... 145; 11 joists at a pitch of 13 would close on the pipe's end evenly), the IV bag now touches the heart monitor (main had a 1px gap), the housekeeper covers the cart's left bevel and wheel, the ramp car's wheel hubs are painted and then fully covered, the conduit stops 1px short of the pipe, the pillar hazard band reads Y D Y D Y Y, the medical lamp glow sits 1px past the lamp on the left only, bed 2 lacks bed 1's highlight row, and the recycling pipe brackets went from 14 to 7 (a visible change that came after the owner's approved comparison; the changelog line for 2.36.0 now says so). Off identity only: no shipped path hands the painters a different size (the gallery and preview draw at world size and zoom with `ctx.scale`), but several repeated objects still use the edge-derived `F` rather than `Fu`, and `Fu` can bleed 1px past the room at a fractional scale (clamp it in `serviceKit.ts`, then run the `serviceScale.test.ts` bounds guard at a fractional scale too). |
| 2026-10-14 | atlas-event-cameos | #6 | render | feature-request | P3 | — | — | idea | **Ready.** **Split out of `atlas-coverage-followups` (#918), item 3.** The sprite atlas does not carry the event cameos yet: Santa, the VIP limo, the thief and the explosion (`src/render/sprites/events.ts`, placed by `towerScene.ts` and `towerOverlay.ts`). Bake each once at the canonical size (animations where the art reads the clock), say in the manifest how the game places and moves them (anchors, draw plane in `data.depth`, motion in the game's own terms as `data.sky` does), and check them against the game's draw call in `verifyExtras.ts`. Additions stay optional, schema 1, packed after the existing pages so no older frame, part or page changes. `docs/atlas.md` ("Not in the atlas yet") names this row. `/gds-code-review`. |
| 2026-10-13 | web-audio-engine-events | #12 | audio-music | task | P3 | med | — | open | **Ready (plan `_bmad-output/planning-artifacts/architecture/architecture-audio-events-2026-10-13.md`, stage 2; needs `gameplay-event-hub`).** `frameLoop.ts` plays `promote` from polling `sim.star` while the engine emits `star_reached`. Fix: an audio router on the hub, exhaustive over event names and `emergency_resolved.source`, with an injected clock; retire the `sim.star` poll (`star_reached` 2 to 5 plays `promote`, highest star in the frame). The win cue stays on the win dialog (a load or undo of a won tower replays it today; `star_reached` 6 is emitted only at the live win) and the pending-choice cue stays on its modal. Per-frame arbitration of events and read-model edges with priority and cooldowns; events before `ownFrom` and hide or backdrop batches play nothing; `build`/`sell` never from `facility_placed`/`facility_removed`. No audible change intended. Tests: cue lists equal on both engines (one batch per step, injected clock), no double play, one promote for three stars, nothing across load, undo or redo, a build while paused still plays (the first paused frame may play the last running frame's tail; the frame loop drains before it ticks). `/gds-code-review`. |
| 2026-10-13 | web-elevator-chime | #7 | audio-music | feature-request | P3 | low | — | open | **Ready after the initial audio gate (plan `_bmad-output/planning-artifacts/architecture/architecture-audio-events-2026-10-13.md`, stage 5b).** A new, original elevator chime on a car's stop-counter increase (#966, stage 5a): cars in view only, one per car per frame, rate capped, re-baselined on a swap. A new composition, so it waits until stages 1 and 2 have shipped with today's sounds unchanged (owner, 2026-10-13). Needs #966 and #965. Tests: one chime per stop, none on the first frame after a swap, in-view only, the cap at top speed. Player-facing (minor). `/gds-code-review`. |
| 2026-10-13 | web-audio-event-cues | #11 | audio-music | feature-request | P3 | low | — | open | **Post-3.0 (backlog triage 2026-10-28): listed under post-3.0 in the engine triage on #1104 (2026-10-28).** **Ready after the initial audio gate; the sounds are chosen by audition (plan `_bmad-output/planning-artifacts/architecture/architecture-audio-events-2026-10-13.md`, stage 6).** New compositions wait until stages 1 and 2 have shipped with today's sounds unchanged (owner, 2026-10-13). New cues: the alarm (fire rescue) and a threat cue (bomb) when the pending-choice modal opens, replacing `error` there (`fire_started` stays silent because the modal opens in the same step); an explosion on `bomb_detonated`; a low impact on `fire_gutted`; `notify` on `milestone_reached` and on `emergency_resolved` by timeout; Santa, thief, treasure and VIP cues on their fx sequences, with the VIP cue skipped when `evaluatedTower` turns true in the same frame; a bomb with no rooms to burn plays nothing, and the explosion fx sequence stays silent (the event carries it). All original, in the Tone palette; every informative cue keeps its visual twin; no alarm loops while a modal waits. Player-facing (minor). `/gds-code-review`. |
| 2026-10-13 | audio-scene-data | #10 | audio-music | task | P3 | low | — | open | **Post-3.0 (backlog triage 2026-10-28): listed under post-3.0 in the engine triage on #1104 (2026-10-28).** **Ready (plan `_bmad-output/planning-artifacts/architecture/architecture-audio-events-2026-10-13.md`, stage 3).** The ambience rules (`sceneFor` and its latch, `resolveCrowdScene`, `hourActivity`, crowd specs and floors) are presentation data any frontend would otherwise re-code. Fix: generate versioned JSON from the TypeScript tables, pinned by a test; drop the dead per-scene music fields in `SCENES`. No audible change. **Also (deferred from the `/bmad-code-review` of #823, 2026-10-15):** `SOUNDS.md` copies the element, murmur and gate-curve numbers from `CROWD_SCENES` and `hourActivity` by hand, with no test to catch drift. Done when a test fails if those three `SOUNDS.md` tables disagree with the generated data. Other numbers in `SOUNDS.md` (program timings, `ERROR_HOLDOFF`, the master gain, the precache budget) stay a dated snapshot, as the doc's header says. `/bmad-code-review`. |
| 2026-10-13 | audio-offline-render | #9 | audio-music | task | P3 | low | — | open | **Ready, tooling (plan `_bmad-output/planning-artifacts/architecture/architecture-audio-events-2026-10-13.md`, stage 4).** Audio is approved by ear but there is no checked-in way to render it (#822 asked for one; #823 dropped its draft script, untested and re-implementing the crowd synths, and points here instead). Fix: render the real graph under `Tone.Offline` in headless Chromium to files (programs, venue programs, beds per scene, jingles) with a manifest (source commit, durations, tempo, beats per bar, bar-aligned loop points, hashes). Tempo and beats per bar join each `Program` in `toneTracks.ts` (today only module constants), with no audible change and a test, so the manifest reads them instead of copying them; they keep a later adaptive music layer possible. The outputs are build artifacts that stay out of the repository. Shipping the baked ambient score stays rejected for the web, and the jingle bake stays gated, both as in #554. `/bmad-code-review`. |
| 2026-10-13 | web-audio-lifecycle-a11y | #8 | audio-music | feature-request | P3 | low | — | open | **Ready (audio audit 2026-10-13; plan `_bmad-output/planning-artifacts/architecture/architecture-audio-events-2026-10-13.md`, stage 8).** Hidden-tab silence shipped (2026-11-16, owner asked for it to fix background static): the game always goes quiet while hidden or out of focus, kept apart from the player's mute (`src/audio/awayWatch.ts`); a player preference to keep sound playing in the background is still open. Left: `dispose()` is never called and the crowd's `humSwell` gain is never disposed, there is no mono option, and nothing checks that every informative cue has a visual twin. Fix: a mute-when-hidden preference, on by default, kept apart from the player's mute (effective mute = player mute or (preference and hidden)); teardown and the leak; a master-bus mono toggle; a test walking the cue map for visual twins. Every sound stays original (no third-party packs, UI effects included). Player-facing (minor). `/bmad-code-review`. |
| 2026-10-11 | atlas-depth-layers-flat-kinds | — | render | task | P3 | low | — | resolved | **RESOLVED 2026-10-13 (lobby and scenery depth-layer PR, which closes #942).** The parking space, the parking ramp and the recycling center now split: the space keeps its whole bay on the shell and its car arrives as an overlay drawn in front, the ramp's parked car is its furniture, and the recycling center keeps its draw order: its deck curb, wall gauge and FULL cue are wrapped in `layerShell`, which in the game only draws them and in the atlas bake puts them on the shell, and it splits its fill chain like an occupant chain. Originally: **Ready (follow-up to the atlas depth layers PR).** Room frames can carry optional `layers` (a shell and a furniture picture, `docs/atlas.md` Depth layers), and every room kind marks its split except three, which ship flat (`DEPTH_FLAT_KINDS` in `src/render/atlas/catalog.ts`). The parking space and ramp are bare structure (the parked cars are overlays), so decide whether to split them or record them as flat by design. The recycling center draws its deck curb after its machinery and its worker after the pile, so a split needs that draw order reworked without moving a pixel of the flat frame or its fill chain. Add `layerBreak` and, where marks drawn over the furniture follow, `layerEnd` (`src/render/pixelSprites/layers.ts`), drop the kind from `DEPTH_FLAT_KINDS`, and the coverage test in `src/render/atlas/layers.test.ts` checks it. `/gds-code-review`. |
| 2026-10-14 | atlas-cab-floor-band-depth | — | render | review-deferral | P3 | low | — | resolved | **RESOLVED 2026-10-14 (closes #999): accepted as drawn.** Decided per row, as the row asked: a rider's legs cover the band's two upper rows and its contact shadow the bottom one, so no whole band row can move to the front without changing a pixel of the flat frame. The band pixels right of the riders' reach (x 31 and on: four riders at most, 7 px apart, end by x 30) could move alone, but a band split by column tears where the layers part, so the whole band stays on the shell, behind the riders, as the game draws it. The side-frame note is settled the same way: no rider reaches the right side frame (x 37 and on in a 40 px cab), which the test pins, and the first rider's contact shadow meets the left frame column at x 2, under the front door frame, which carries the shadow color as it does any rider color. No pixel moved, so no baseline comparison was needed. `docs/atlas.md` says so and `src/render/atlas/layers.test.ts` (the cab floor band) pins the coverage, so a change to the rider sprite that frees a row fails the test. Was: An elevator cab splits into its interior, its riders and a front (door frames, FULL bar, lantern). The service kick plate and the express livery band run along the cab floor as part of the cab body, but they sit on the back, and the riders' feet draw over them; with the riders set behind the front, their feet show in front of that band. (A rider near the right wall can likewise overlap the cab's side-frame column.) The game draws the feet over the band, so moving the whole band to the front changes pixels: only the band rows the feet never cover could move to the front with no pixel changing (prove it with the export's baseline comparison); otherwise accept it as drawn. `src/render/sprites/transport.ts` `drawCar`. `/gds-code-review`. |
| 2026-10-10 | sprite-origin-seeds | — | render | review-deferral | P3 | low | — | done | **DONE (v2.38.0, closes #915 on merge).** The staff shirts seed from `geoVariant` (floor and column), the sky bar's skyline lights and the climbing holds key on the room's geography seed and their place inside the room (as do three more origin-seeded details the review found: the phone repair boutique's parts bins, the pharmacy's bottle shades and the claw parlor's prizes), the atlas's `ORIGIN_SEEDED` exception and its `signature.rules.originSeeded` note are gone, so the pre-flight checks those kinds at region offsets, and `src/render/originSeeds.test.ts` paints the targeted cases at several region offsets and past a region seam and requires identical pixels, while `src/render/originSeedsSweep.integration.test.ts` sweeps every room kind and subtype the same way (it runs in the required `test` job). Review follow-ups are the `origin-seed-test-hardening` row (#1117). The gallery refresh comes from the PR's `commit-on-approval` job and the e2e visual baselines from `update-visual-baselines.yml` (`[update-baselines]`), both in the pinned image. Original row: Deferred from the sprite-atlas review (#909, PR #912). A few room details hash the DRAW origin instead of the room's geography: the security, medical and housekeeping staff shirts (`Math.round(x)` seeds in `sprites/facilities/service.ts`), the sky bar's skyline window lights (`hash(bx * 7 + wy)` over absolute pixels in `pixelSprites/skyBar.ts`), and the fitness club's climbing holds (`pixelSprites/fitness.ts`). The region compositor paints a room at its offset inside a region canvas, so these follow where the region starts, and a room straddling two regions can show different details on each side of the seam. Fix: seed from floor and column like `geoVariant`; it moves a few gallery pixels, so refresh the screenshots, then drop the atlas's `ORIGIN_SEEDED` exception (`src/render/atlas/catalog.ts`). `/gds-code-review`. |
| 2026-10-10 | rental-late-night-rebake | — | render | review-deferral | P3 | low | — | done | **DONE (v2.34.1, closes #916 on merge): the room re-bake signature keys its late-night bit on every kind in `LATE_NIGHT_KINDS` (the condo and both rentals), so a studio or apartment baked in the evening drops its residents at 23:00 and gets them back at 06:00.** The set and the `isLateHour` window moved out of the atlas into `src/render/lateNight.ts`, which the atlas, the room art and the signature all import, so the game no longer reads a hand-copied hour test. The signature itself moved out of `towerReconcile.ts` into a pure `excalibur/roomSignature.ts`, and `roomSignature.test.ts` pins the 23:00 and 06:00 flips for `rentalStudio` and `rentalApartment` plus a guard on the hour bits: for every room kind other than floor and lobby tiles, across every settled state, both lighting states, every retail subtype, three occupancy shapes and three placements, an hour-to-hour change in the art must change the signature. The parking-dead rule moved into the same module as `isDeadParking`. Originally deferred from the sprite-atlas review (#909, PR #912). |
| 2026-10-14 | rental-asleep-scrim | — | render | design-decision | P3 | low | — | done | **DONE (2026-11-17, closes #1025): owner picked dimming. `drawRoom` keys `asleepHome` on `LATE_NIGHT_KINDS`, so studios and apartments take the condo's asleep scrim from 23:00 to 06:00; pinned by a residential.test.ts case.** **Ready.** Deferred from the `/gds-code-review` of #916 (Blind Hunter, Edge Case Hunter and Acceptance Auditor; pre-existing). From 23:00 to 06:00 a condo, a studio and an apartment all hide their residents and drop their lamps, since the rentals draw through `condo()`, but only the condo also gets the dark asleep scrim: `drawRoom` in `src/render/pixelSprites.ts` still tests `u.kind === "condo"` for `asleepHome`. To settle: key `asleepHome` on `LATE_NIGHT_KINDS` (rentals dim like condos; rendered pixels change, so screenshots and visual baselines refresh in the pinned container), or keep the split and say why next to `asleepHome`. The re-bake signature flips for all three kinds since #916, so either choice repaints on time. |
| 2026-10-10 | atlas-off-catalog-widths | — | render | review-deferral | P3 | low | — | resolved | **RESOLVED 2026-10-14 (closes #917): legacy shafts baked, rooms get a documented fallback.** Shaft widths are a small set (deserialize keeps a stored width up to the catalog's, and canon widths only grew: stairs and escalators 4 to 8, the standard elevator 3 to 4, the express 4 to 6, with walkways and boxed-in elevators kept as stored), so the atlas bakes `transport/stairs/w4`, `transport/escalator/w4`, and the standard elevator at 3 tiles and the express at 4 (bands and cabs, `w3`/`w4`), on pages of their own after the scenery's; the 2.29.4 pages stay byte-identical. Room widths are not (a TDT tenant clipped at the lot edge, or a legacy reflow, can leave anything from 1 tile to the lot's width), so a room at another width uses its catalog-width picture stretched to its real width: the reference reader returns `stretchTo` (`lookupRoom`, and `lookupShaft` for a damaged shaft width), the reference composer applies it, and the docs and `signature.rules.width` say it approximates the web game's redraw. Was: Deferred from the sprite-atlas review (#909, PR #912). The atlas bakes rooms and shafts at catalog width only, but deserialize keeps a TDT-imported or legacy room's original width (#731) and legacy shafts keep theirs, and the game bakes at `u.width`. Such a unit has no atlas frame. Bake the bounded set of widths imports can produce, or document a fallback; the reference reader already names the real width. `/gds-code-review`. |
| 2026-10-10 | atlas-coverage-followups | — | render | review-deferral | P3 | low | — | done | **Done (2026-10-14; #918 closes on merge): items 1, 2 and 4 shipped, item 3 moved to its own row (`atlas-event-cameos`, #1027).** (1) Recycling frames carry an exact `fillExact` chain, an alternative to the `fill` eighths, with one step per fill where the picture changes (the 82 breaks published as `data.recyclingFillBreaks`, each the first double that shows its look, found from `recyclingLook`, the one function the art now reads its fill through); the eighths frames stay byte-identical. (2) Cinema frames carry `cycles` (the marquee, 2 steps at 4 a second, and the screen, 5 steps at 2.5 a second), checked at every pairing against the paint, flat and through the depth layers. (4) The release notes go through `releaseNoteLines`, which escapes Markdown in each plain-text note. Both additions pack on pages after every older page; a full bake byte-compared against main kept every older file, frame, part and page. Original text: Deferred from the sprite-atlas review (#909, PR #912). (1) Recycling fill ships in eighths (the game's re-bake buckets) while the game paints the exact fill; a chain over the art's real breakpoints (bag count, gauge pixels, the 0.7 and 1 thresholds) would make every fill exact. (2) The cinema marquee and screen read the animation clock; the atlas bakes phase 0, and a loop over the 2 s cycle would let a frontend animate them. (3) Event cameos are not exported yet (the plaza and street scenery and the ground strip joined the atlas in the lobby and scenery depth-layer PR). (4) The release notes print the reader's plain text back as Markdown, so an escaped `\*` or a code span holding `<...>` or `_x_` renders as formatting on the release page; escape Markdown characters before printing, or take the bullet's source text. `/gds-code-review`. |
| 2026-10-10 | sprite-atlas-export | — | render | feature-request | P2 | medium | — | done | **DONE (trued up 2026-10-15): #909 was closed as completed on GitHub on 2026-10-11 while this row still read `impl-review`.** **Implemented in PR #912 (impl-review); its follow-ups are #915 to #918.** **Ready (owner direction, 2026-10-10).** The art is procedural and CC BY 4.0, but another frontend on the open engine can only use it by porting the drawing code. The routines take a rectangle, yet they are not scale-faithful: reference maps and furniture pitches are fixed pixel literals (#812, #813), so redrawing into a larger rectangle changes geometry and even visible occupant counts. Add `scripts/export-atlas.ts`: render every facility kind in every unit state and look (open, closed, dirty, infested, burning, gutted, under construction), the people variants, the cars, shafts, structure, façade and sky ONCE at the canonical bake size, then produce 2x and 4x by nearest-neighbor scaling, into PNG atlases plus a JSON manifest. The manifest cannot be keyed by kind and state alone: the web game re-bakes a room on its full signature (`src/render/excalibur/towerReconcile.ts`: state, lit, width, occupants, out for a meal, subtype, open or closed by business hours, a condo's late-night look, parking connectivity and use, recycling fill), and fire and construction are animated. So the export bakes the static inputs (kind, state, subtype, width, lit, open, late night) as frames, ships animation frame sequences for fire and construction, and splits the rest into layers a frontend composes at runtime (occupant figures with their slot positions, the dead-parking mark, the parking cars and recycling fill steps), and the manifest says which inputs are baked and which are composed. A test in this repo compares a composed frame against the web renderer's bake for a sample of signatures; generate normal maps from the atlas in the same archive. Runs headless in the pinned Playwright image for deterministic output; CI builds it on tags and attaches it to the release with a checksum; nothing committed; the ASSETS-LICENSE attribution line ships inside. |
| 2026-10-09 | schedule-dialog-width-jump | — | visual-parity | review-deferral | P3 | low | — | done | **DONE (backlog sync, #2081): #888 closed 2026-11-15 in the open-bug triage: it no longer reproduces on main (measured at 1280x800 and 390x844, the dialog keeps its rect through every preset press).** **Ready.** Deferred from the 27c determinism fix (`/gds-code-review` round 1). Measured in the pinned image at 1280x800: the Modern elevator Schedule dialog opens 560px wide at x=360 (its `max-width` cap) and the first preset click shrinks it to 548.34px, recentering it at x=365.83. `#modal` is shrink-to-fit under `max-width: min(560px, 94vw)`, so an edit that lowers the content's max-content width resizes and recenters the window under the player's cursor (about 6px of left-edge travel, ending on a fractional pixel). The capture side is fixed (27c opens, edits and arms in one task; the runner's phase watch fails a shot that moves after first render); this row is the player-facing half. Fix shape: hold the dialog's width stable while open (a fixed desktop width, or a `min-width` taken from its opening size), which also keeps it on a whole pixel. Gate: the first edit leaves the dialog's rect unchanged at desktop and phone widths, with any gallery refresh reviewed. |
| 2026-09-15 | screenshot-27c-nondeterministic | — | visual-parity | bug | P2 | med | — | resolved | **RESOLVED 2026-10-09 on PR #892; issue #843 closes on merge.** Same defect as `screenshot-27c-nondeterminism` (#762), whose row carries the measured cause, the fix and the before/after rates. The lead below about the crop moving with a remeasured scroll did not hold: every scrolled pixel matched; only the two sticky layers differed. Original notes: **Found on PR #840, which it failed and does not cause.** `capture / shoot (features)` failed the determinism guard on `3c5a6a1`: pixel bytes differ for `docs/screenshots/27c-elevator-schedule-unsaved.png` between the two legs of the SAME commit, so it is a property of the code, not of the diff under test. Intermittent: a re-run of the same job on the same commit passed, and four later runs on three commits were green. `drift-gate` goes red with it as a downstream consequence (`CAPTURE: failure`, `VERIFY_DRIFT: skipped`), so one cause shows as two failed checks. NOT #840's: that diff touches no shipped render code (five `src/analytics*.ts` plus tests, three `scripts/posthog-*`, two docs, and one `src/ui/` entry that is a test file), and analytics is inert in a capture because the host gate is closed on the preview server. Ruled out: `holdRepeat` (`src/ui/templates/elevatorSchedule.ts`) arms only on `@pointerdown` and the scene uses `preset.click()`; the `.es-advice` line derives from `state.day`, not the clock. Look next at the scene itself (`scripts/scenes/schedule.ts`): 27c crops `#modal .modal-box` at a scroll position computed from live layout (`Math.floor((box.scrollHeight - box.clientHeight) / 2)`) after a fixed `wait: 300`, so anything shifting the dialog's measured height between legs moves the crop and changes every pixel below it. Siblings 27 and 27b use the same dialog and the same mid-scroll trick and did not differ, so it is specific to the armed/unsaved state 27c stages. Consider asserting a settled layout instead of sleeping. Costs a CI cycle at random and burns the one re-run the drive-to-green rules allow, leaving the next PR none. Evidence: the `determinism-diff-features` artifact on run 34910028648 holds both legs' copies. |
| 2026-08-09 | refmap-sprites-resampled | — | visual-parity | bug | P1 | high | — | done | **Done (v2.36.0, PR #817; issue #812 closed on merge): the six references are re-authored on the live 10 x 45 grid, `RW`/`RH` are derived from `TILE`/`FLOOR`, and `refMap` is the identity again, so nothing resamples at the shipped size. The owner approved the art on a before/after comparison; `serviceScale.test.ts` pins the grid (a grid change fails there first) and keeps every rect inside its canvas at the shipped scale.** Original note: **Found by the adversarial review on PR #811, no test covers it.** `refMap` (`src/render/sprites/facilities/serviceKit.ts:15-39`) promises "at the canonical bake size the map is the identity, so the port is pixel-exact". Every caller authored its reference at the retired TILE 11 / FLOOR 44, so after the move to 10 x 45 NO caller can hit identity: drawParking 44x44, drawParkingRamp 176x44, drawSecurity 88x44, drawMedical 176x44, drawHousekeeping 88x44, drawRecycling 220x88, against actuals of 40x45, 160x45, 80x45, 160x45, 80x45, 200x90. Every rect now ports through `Math.round(rx * 10/11)`. Measured damage: the security monitor wall (five monitors, reference pitch 10, width 8) lands at columns 5/15/24/33/42, a pitch of 10/9/9/9 with widths 8/7/7/7/7, so a regular 2x5 grid reads visibly irregular; `wallp`'s 12px seam pitch becomes 11/11/10; `box()`'s 1px lit-left and shaded-right edges collapse into one column on roughly one position in eleven; and 45/44 inserts one duplicated pixel row into all six. Fix by re-authoring the six reference maps at the shipped scale, or by deriving the reference size from TILE/FLOOR so identity holds by construction. Art, so it goes through the room-design approval gate in the visual-parity GDD. Also correct `serviceKit.ts:6`, which states the retired footprint as fact. |
| 2026-08-09 | rooms-underdraw-occupants | — | visual-parity | bug | P2 | med | — | done | **Done (v2.37.0) for ALL EIGHT populated kinds that lay furniture out in a row: office, amusements, boutiqueBay, skyBar, nightclub, daycare, fitnessClub, spa. Both pinned assertions restored (3 seated, 0 gated layouts in a narrow box); close #813.** Scope widened on the owner's 2026-08-10 ruling: the five kinds this review first parked in the deferral inbox were fixed in the same change rather than shipped as known bugs. Diagnosis first, per kind, and the cause was never one literal. Office lost its fifth meeting chair to `floor(tw / 11)` AND its second executive-corner cubicle to a chain of absolute anchors (`x + 54 + i * 22`) that overran the narrower room. Amusements lost a claw machine, an arcade cabinet, and a mini-golf standing spot to fixed machine-plus-gap pitches; boutiqueBay lost two browsing customers to a fixed 7px row pitch. skyBar lost two stools off a 7px pitch bounded by the counter (18 patrons drawn -> 16), nightclub two dance-floor spots off a 6px pitch bounded by the floor (24 -> 22), daycare two places off a 6px pitch bounded by the play mat (13 children -> 11), fitnessClub two yoga mats off a 12px pitch (14 -> 12) and two spin bikes off an 8px pitch (21 riders -> 19). **spa turned out to have NO capacity defect and its geometry was left alone: its massage tables are capped at three long before the room runs out of wall, so the narrower tile never cost it one (measured 3 beds at both scales). Narrow claim: a spa draws at most four of its guests by its own design, which this change does not address.** Fix: `authoredWidth` / `screenLength` / `artRow` in the new `pixelSprites/artScale.ts`, plus `busyStations` in `pixelSprites/common.ts` (it is crowd selection, not scale). A row is counted from the run it has in AUTHORED pixels, passed in by the caller rather than worked back out of an already-rounded screen width (re-deriving it left a 24-tile nightclub one dancer short), then fitted into the screen run so it still fits the box. Verified per kind by rendering the pre-fix art at 11 by 44 against the fixed art at 10 by 45: every count matches exactly (office 5 max / 3 min, arcade 8, VR 3, claw 7, golf 9, boutique 18 plus a seated client, skyBar 18, nightclub 24, daycare 13 children plus a caregiver, yoga 14, spin 21, weights/boxing/climb 1, spa 1 in the tub plus 3 on tables). **A second defect class rode along and was fixed everywhere it appeared: rooms drawing a crowd that did not match the count they held.** The arcade, claw parlor, sky bar, nightclub, daycare, and spin studio each rolled a hash per seat and, in four of them, counted a hash-skipped seat against the occupancy anyway, so people who were in the room were simply never drawn (a club with five could show three). All now show `min(people, seats)` through `busyStations`, which ranks the seats on the room's seed and takes the busiest, so the count comes from the occupancy and the choice still spreads a small crowd over the whole row. The first cut of that helper took the first seats clearing a threshold and banked a quiet room's crowd against one wall, which the review caught. The boutique and the spa had the mirror of it, counting a seated client or a tub guest on top of the row, so a one-customer bay drew two people. `pixelSprites/roomCapacity.test.ts` pins capacity at FULL population across widths for all eight kinds (the blind spot that let this ship was asserting only three occupants at one width), pins the honest crowd per kind across a ladder of occupancies (eight for the arcade and claw, six for the five showpiece kinds, five for the boutique and spa), and `roomContainment.test.ts` sweeps containment in 3px steps from 6 tiles to 300px, strict on both edges. **Art judgment for the visual-parity GDD room-approval gate, re-confirmed with the widened scope: no room was redesigned.** No item was resized or recolored, and none moved to a different part of its room except the club's dancers, who now run past the lit floor as described below, the executive's corner anchors and the boutique's door figure. What changes is row spacing and the anchors that follow from it, so a row of fixed-size art fills a room 9% narrower in pixels: rows pack about 9% tighter and reach their proper far end. The 9-tile office cubicle bank keeps its authored 22px spacing, so that layout is pixel-identical, and the spa is untouched. **The first cut of that compression was itself a defect and was fixed here rather than accepted as an art trade, on the party ruling of 2026-08-13 (owner delegated the call).** Stepping a row at the pitch scaled to the current tile spends the gap the art was drawn with, but a figure is fixed-size pixel art that did not shrink when the tile did. Rows drawn with air to spare only got tighter; the NIGHTCLUB's dancers are 6px wide at a 6px pitch and had no air at all, so their 5.45px step drew them a pixel through each other in half the gaps, and the yoga studio's mats closed to a near-continuous band. The party rejected the "a crowd is meant to look irregular" defense as a rationalization of a rounding artifact, on the grounds that the same alternating pitch is called a defect on #812's monitor wall and that the overlap bites hardest at FULL occupancy, which is when the player is looking. So `artRow` now steps at the authored pitch in SCREEN pixels, unscaled for the same reason the item is, tightening only when the screen run cannot hold the row. Capacity is untouched (the count still comes off the authored run), so every restored occupant stays drawn. **State the effect precisely, because the first draft of this row overclaimed it and the review caught that:** a caller measuring its authored run across the SAME span it hands the row gives that row about 10/11 of the screen its authored count needs, so `run / (count - 1)` binds and the row still compresses to roughly the old step. That is the common case, and the pitch is an upper bound rather than a promise. Measured at each kind's catalog width, only the nightclub (6px) and the rows with slack to spare (the office bank at 22px, the VR lounge) reach the authored pitch; the arcade sits at 14.4 against 15, the sky bar and boutique at 6.4 against 7, the yoga studio at 10.85 against 12, and for the yoga studio and daycare this change moved the step by exactly nothing. What it did change is that compression is now bounded by the room the row actually has instead of forced by the tile, which is what lets a caller able to give the row more screen reach full pitch. **The nightclub is that caller and is fully fixed:** the count still comes off the lit strip's authored width while the row runs from a pixel left of the strip to just clear of the DJ booth, giving an even 6px pitch with no overlap at every width the `roomContainment.test.ts` sweep covers (6 tiles to 300px, at whole and half-pixel room origins). Two further hardenings came out of the review: `artRow` now measures its run between the whole pixels the row actually occupies (rounding the near end outward while flooring the far one inward bought a column the pixels did not contain, which at a half-pixel origin put the club's dancers back through each other and, at small steps, could repeat an anchor outright), and it takes an optional `minStep`, the item's own width, below which it drops a slot rather than stack two items (the club, whose count comes off a different container than its run, stacked dancers from about 360px of room upward). New guard in `roomContainment.test.ts`: no room draws two figures through each other on one baseline (figures on different baselines are left alone, where overlapping is depth reading correctly). Neither existing suite could see it, since two people drawn a pixel into each other are still the right count in the right box; mutation-checked by restoring the scaled step. Rendered pixels do change, so the committed gallery drifts and must be refreshed through the PR pr-drift-check commit-on-approval job, never by hand. `/gds-code-review` ran in-session, four rounds (Blind Hunter + Edge Case Hunter + Acceptance Auditor each round, the fourth confirming): patch findings fixed (count taken one margin short of the authored span; a reversed row that walked golf watchers out through the far wall and drew MORE as the bay shrank; a dead step cap; `pitch = 0` throwing RangeError inside the render path; rounding that escaped the run on the fractional coordinates the preview pages produce; a stacked-anchor case; a pre-existing mini-golf turf stripe drawn past the wall; the meeting table mixing a fixed-pixel 60px cap with an authored chair count; arcade and claw players whose contact shadow left the box; capacity assertions coupled to a hash threshold rather than to station count), a bartender who could land on a patron's exact column and read as one person, a fractional-input case where a row repeated its last anchor, and rows that rounded a fractional occupancy up where every sibling rounded down), two findings deferred to the inbox and one dismissed there with its evidence. **Refreshed onto main 2.34.1 on 2026-10-15 (merge commit, PR #831), and a fresh `/gds-code-review` round on the merged diff patched:** (1) one rounding for a fractional occupancy: `roomOccupants` now rounds UP, reads a corrupt count as nobody and a corrupt `outForMeal` as nobody out, exactly as the atlas reader `atlas/lookup.ts` picks a baked crowd, so a native frontend and the web show the same crowd (`roomOccupants.test.ts` binds the two; the earlier round-down is reversed for that reason, and the office now reads it too); (2) the sky bar's bartender dodges every stool rather than only taken ones, so he no longer moves as patrons arrive, which the atlas needs because it bakes a crowd one person at a time (`roomOccupants.test.ts` pins that every rewired room's crowd only grows, mutation-checked against the old dodge); (3) the office cubicle bank is held to what its screen run can space at a desk's own 18px width, so a corrupt `u.width` cannot stack desks or walk them past the left wall, an infinite width draws nothing and a NaN width seats one desk (a huge finite width, about 1e9 tiles, still allocates per anchor and is tracked in #829); (4) the meeting table is drawn at its authored size again (the first cut shrank a capped 60px table to 55px, contradicting the no-resize claim above), and its chairs step no tighter than their 7px drawn width; (5) arcade and claw players are drawn after every machine, so a compressed row no longer paints the next cabinet over them; (6) the unused `artUnits` helper is removed, the sky bar's counter inset is one named constant, and stale comments and cross-references were corrected. The approval-gate judgment for the club's dancer row is recorded in the visual-parity GDD decision log. |
| 2026-10-15 | gallery-subworld-cells-soft | — | visual-parity | review-deferral | P3 | low | — | resolved | **#1061: Closed not planned 2026-11-15 (open-bug triage party, owner OK): dev review gallery only; `MAX_SHRUNK_CELLS` caps the shrunk cells at 4 and the aspect stays right.** **Deferred from the `/gds-code-review` pass on PR #816 (Blind Hunter B4).** `fitAtGameScale` (`src/render/catalogScale.ts`) now draws a review-page box at a whole multiple of the world scale whenever the cell holds 1x, but a footprint wider than its cell still shrinks by a fraction, and the painters' rect edges antialias: 1px detail softens and rows drop or double unevenly. On the desktop gallery (292px cells, a 276px room width) that is the 28-tile Aquatic Center and the 31-tile Cinema; on a narrow phone it is most rooms. The aspect stays correct (the scale guard pins it); only the edges soften, on a review page. Fix shape: rasterize a below-1x subject at 1x into an offscreen canvas and `drawImage` it down, or widen the gallery cells (or give wide kinds a double-width cell) so every desktop subject fits at 1x. Then tighten the fractional-cell cap in `src/tests/spriteReviewPagesScale.guard.test.ts` from 3 to 0. |
| 2026-08-09 | preview-gallery-dead-scale | — | visual-parity | bug | P2 | med | — | done | **Blocks the palette and room-density epics; fix it FIRST or that art is judged against a lie.** `src/preview.ts:45,79-80` renders room art at `TILE = 12` and `h = 44` (44 is exactly the retired FLOOR), so 3.67 tiles per floor against a world of 4.5. `src/gallery.ts:61-63` is independently wrong at tile 18 / floor 52, or 2.9. Both are shipped, screenshotted pages whose job is showing room art at game proportions, and both are what an artist would use to judge the Epic 2 and Epic 3 work in the visual-parity GDD. Pre-existing drift (12 never matched 11 either), now further off. Derive both from `src/render/scale.ts` instead of restating numbers. **DONE (v2.35.0, closes #814 on merge).** Both pages size every box through `fitAtGameScale` (`src/render/catalogScale.ts`), which derives from `scale.ts`: a whole multiple of the world scale up to the page's magnification, stepping down through whole multiples when a footprint is too big, and a uniform fraction only below 1x, so the aspect always survives. Both pages hand the painters world-size boxes and magnify by transforming the context, from a whole-pixel origin. The preview draws at 1x with cells tall enough for the two-floor cinema; the gallery magnifies up to 3x with cells tall enough for a four-floor elevator cell at 1x. `src/tests/spriteReviewPagesScale.guard.test.ts` runs both pages for a frame and asserts the tiles per floor of every box, uniform context scales, 1x on the preview, and whole multiples on the gallery, so a third drift fails CI. Screenshot drift on `06-sprite-gallery` and the preview shot rides the `commit-on-approval` job. |
| 2026-08-05 | screenshot-27c-nondeterminism | — | pixel-art | bug | P2 | med | — | resolved | **RESOLVED 2026-10-09 on PR #892; issue #762 closes on merge.** Root cause, measured in the pinned image (`mcr.microsoft.com/playwright:v1.61.1-jammy`): the 27c scene opened the elevator Schedule dialog (560px wide at x=360), then in later round trips clicked a preset that shrinks it to 548.34px (recentered at x=365.828) and dispatched the Esc. The dialog's sticky title bar and floor-grid head are composited layers that keep the subpixel phase of their first raster, so whether a frame rendered between the open and the edit was a race under CI load. Every failing pair differs in exactly 1456 pixels, rows 6-17 (title text) and 66-77 (grid head text) of the 656x550 crop, a subpixel phase apart; two rasters exist, `f68feaac` (committed) and `606682f0`. Proof, 24 renders each: split staging 8 took `606682f0`; a frame forced between the steps 24; open, edit and Esc in one task 0. The four suspects, one change at a time (24 renders each): two rAFs after the scroll 11, an extra 1.5s wait 10, the dialog pinned to a whole pixel after staging split 12 / 9 / 3 across three different rasters, none of them the committed bytes since the pin itself moves the dialog (a fractional position is harmless, a fractional move after first render is the leak), transitions and animations off 15 (a restyle with no transition change, `caret-color` only, gave 0: a fresh raster hides the race, which is why an earlier transitions-off variant looked like a fix). The #871 compositor flags were on throughout, so they did not reach the cause (their retirement is #889). Fix: `openScheduleDialog(..., stageUnsaved)` opens, edits, arms and scrolls in one `page.evaluate`; no committed pixel changes. Guards: `Shot.phaseWatch` (runner judges an in-page watch after the capture and fails a dialog that rendered at more than one subpixel phase; with a frame forced between the steps it failed 24 of 24) and `src/tests/screenshot27cOneTask.guard.test.ts` (pins the one-task shape on every `npm test`). Two-leg determinism check of the features shard (`node scripts/screenshot-determinism-check.ts features`, the workflow's own command): main at 0a07279, 7 of 20 runs failed, all on 27c, plus 1 run whose legs agreed on `606682f0` (phantom drift on a PR); this branch at 0a35f28, 0 of 30 consecutive runs failed, all 60 legs rendered the committed `f68feaac`. If 27c ever fails the two-leg check again, the phase watch or the one-task guard names the cause; reopen with that evidence. Earlier history, kept for the record: **REOPENED 2026-08-05 (recurred on PR #766 after the scrollbar fix merged, so that theory was at best one of two leaks; #762 reopened with the evidence).** The determinism check now saves BOTH legs' copies of every differing file and the workflow uploads them on failure, so the next occurrence names the pixels instead of feeding another inference. Prior note (kept for the record):  The leak was the LAST wall clock in a capture: fluent overlay scrollbars fade on the compositor's own clock, which the stepped TestClock cannot reach, so a shot that scrolls a container (27b/27c scroll the schedule dialog's .modal-box and crop that region) captured whatever fade phase CI load landed on: usually fully faded (the committed gallery shows a clean gutter), occasionally mid-fade, the intermittent failure. The runner now hides scrollbars for every capture (scrollbar-width: none plus the webkit pseudo-element belt), which renders the faded end state every time; overlay scrollbars occupy no layout space in the pinned container, so committed pixels are expected unchanged. Host-vs-CI asymmetry explained the never-reproduces-locally history: Windows classic scrollbars neither overlay nor fade. Original: intermittent 'pixel bytes differ' on 27c-elevator-schedule-unsaved.png, observed twice on PR #759, reruns passed. The pinned-container determinism guard (two independent renders per shard) fails intermittently with pixel bytes differing for `docs/screenshots/27c-elevator-schedule-unsaved.png`, always that one screenshot. Observed twice on PR #759 with clean passes on intermediate pushes of the same branch, so probabilistic, not drift and not diff-related. The scene opens the elevator schedule dialog with unsaved changes; suspects are a time-driven decoration ticking across a frame boundary between the two legs or an animation phase captured mid-transition. Blocks merges at random until fixed (the guard is the hard gate, correctly); reruns pass, which is a workaround not a fix. Fix shape: loop-render the 27c scene in the pinned container and diff, then freeze or advance whatever leaks to a stable frame like the other scenes do. `/bmad-code-review`. **2026-10-09 evidence (PR #871, head 59c9459, twice):** the differing pixels are exactly the dialog's two sticky layers (the title bar and the floor-grid head), a subpixel text phase apart, while every scrolled pixel matches: a compositor pipelining race on the sticky layers' re-raster after the programmatic scroll. Not reproducible on a host browser (5 two-leg runs, 12 loaded singles). Fix attempted in #871: the capture launches Chromium with `--run-all-compositor-stages-before-draw`, `--disable-checker-imaging` and `--disable-threaded-animation`. Row stays open until the check holds across several PRs (superseded by the 2026-10-09 resolution above: the cause is now proven in both directions and pinned by two guards). |
| 2026-07-28 | sky-lobby-ghost-walkers | — | pixel-art | bug | P2 | med | — | resolved | **FIXED in the ghost-crowd PR (v1.104.0), closes #639.** Reported by the owner: a lobby built on floor 15+ with no way to reach it still filled with ambient walkers. Cause: `buildWalkers` spawns lobby-concourse figures with `perFloor: false`, and `updateMotion` gated those only on tower-wide busyness (`min(1, population/350) * night`), which says nothing about whether anyone can get to that floor. Corridor loiterers were never affected because `perFloor: true` gates them on their own floor's live occupancy. Fix: `updateMotion` now AND-gates non-`perFloor` figures on `engine.sim.floorReachable(w.floor)`. Reachability and not `isFloorServed`, because it runs the passenger router, so Classic's walkway-willingness budget correctly hides a served-but-stranded lobby (no commuter spawns for it either) while Modern's served-equals-reachable needs no era branch. Floor 1 short-circuits to true in the engine, so the main lobby is untouched. The verdict is already memoized engine-side per `tower.revision` in a per-sim WeakMap, so no render-side cache was added (and so nothing new had to be hand-invalidated on sim swap in `towerScene`). Stair and escalator climbers carry the same `perFloor: false` and are covered by the same gate. `src/render/excalibur/towerCrowd.ts`; the walker-construction path was split out to `towerWalkerBuild.ts` to keep both files under the size ceiling. `/gds-code-review`. |
| 2026-07-28 | landing-tile-router-parity | — | pixel-art | review-deferral | P3 | low | — | resolved | **RESOLVED in the parity-test PR (v1.104.1), closes #674.** Raised by the Blind Hunter on the stair-reachability PR and independently by the Edge Case Hunter. `landingTile` (render) is a second copy of the router's `landingSeg` rule; they agreed by construction but nothing pinned it, so a fix to `segment-shaft-multi-run` (#662) could have split them silently and undone #665 clause 2. `towerWalkerBuild.test.ts` now asserts `segAt(tower, floor, landingTile(tower, t, floor)) === landingSeg(tower, t, floor)` on real `Tower` fixtures. The case that earns the assertion is a footprint straddling TWO runs: within a single run every column resolves to the same segment, so picking a different tile there is not a divergence at all (verified by mutation, a reversed scan in `landingSeg` leaves the single-run cases green). The two-run fixture is exactly the #662 shape, and it does go red when the engine's rule moves. Also pinned: placement REFUSES a flight with no structural column under its span, so the `t.x` fallback both sides carry is defensive rather than a live path. **Rename follow-through (v1.104.2, #662):** #662 renamed `landingSeg` -> `landingSegs` (returns every overlapped run). The parity test moved with it: it now asserts `segAt(tower, floor, landingTile(...)) === landingSegs(tower, t, floor)[0]` (the leftmost run `landingTile` picks), still green. Full bipartite linking keeps `landingTile`'s first-run choice valid: all runs sharing a flight are one connected component, so the leftmost run is reachable exactly when the flight is usable. `/gds-code-review`. |
| 2026-07-28 | walker-reachability-refinements | — | pixel-art | review-deferral | P3 | low | — | resolved | **RESOLVED in the stair-reachability PR (v1.104.1), closes #665.** Deferred from the `/gds-code-review` of the ghost-crowd PR (v1.104.0); the segment-granularity half shipped there, and the two stair clauses shipped here. (1) The gate asked only about a flight's BOTTOM landing, so a stair rising to a floor no route ends at still showed figures trudging up toward it. A climber now carries both landings (`altFloor`/`altTileX` on `Walker`) and needs BOTH reachable. The probe already routes through stairs, so a reachable bottom normally implies a reachable top; the ends only disagree when Classic's walkway-willingness budget cuts the flight, and then nobody completes that climb from either side. Note the fix is an AND, not the either-endpoint OR the deferral text first suggested: an OR would have left the reported case (bottom reachable, top not) showing exactly the ghosts it was raised about. (2) A climber probed its transport's own tile `t.x`, but `validateTransport` only requires SOME tile under the footprint to be structural, so on a gap-split floor a stair may legally sit with its leftmost columns over the void; the probe then found no run and hid the climbers on a usable flight. `landingTile` now walks the footprint for the first structural tile, mirroring the router's `landingSeg` including its `t.x` fallback, so the two cannot disagree. `buildWalkers` turned out to be unit-testable after all (it bakes no `ex.Canvas`, it hands out the pre-baked `personGfx`), so the construction path gained real coverage in `towerWalkerBuild.test.ts` and its header no longer claims to be Playwright-only. `/gds-code-review`. |
| 2026-07-29 | rental-shared-picture-set | #14 | gdd-modern-rental-living | review-deferral | P3 | low | — | idea | **Deferred from the `/gds-code-review` Acceptance Auditor on PR #633 (rental living, v2.0.0).** GDD mechanic 6 and Epic 5 both say EACH of Studio and Apartment gets its own wall-palette set AND decor/picture set. Walls are per-kind (`STUDIO_WALLS`, `APARTMENT_WALLS`) but both kinds pass the same `RENTAL_PICTURES` (`residentialRentalSprites.ts:15,19`). The stated goal (a strip of one kind never looks identical) is met via geoVariant; the per-kind split that would make a Studio read as a different class of room is not. Fix: split `RENTAL_PICTURES` per kind. Touches sprites, so it drifts the gallery. `/gds-code-review`. |
| 2026-07-28 | walker-reachability-refinements | — | pixel-art | review-deferral | P3 | low | — | resolved | **RESOLVED (trued up 2026-10-15): the stair-endpoint remainder shipped in the stair-reachability PR (v1.104.1), recorded on the resolved row of the same story above, and #665 closed as completed on 2026-07-28. Kept for the record.** **Deferred from the `/gds-code-review` of the ghost-crowd PR (v1.104.0). The segment half SHIPPED in that PR; the stair-endpoint half is what remains.** DONE: the gate now asks per POSITION, `sim.positionReachable(w.floor, w.tileX)`, so a gap-split Modern floor (#647 / PR #652) hides the stranded run's figures while a sibling run of the same floor keeps its own. That needed a memo first: `positionReachable` only takes the engine's memoized fast path when a floor has one segment, and runs a fresh passenger BFS per call once split, so the render side memoizes the verdicts in a WeakMap keyed by the sim and valid for one `tower.revision` (keying on the sim, not the engine, means a swapped tower gets a fresh entry with nothing to hand-invalidate). OPEN: a stair or escalator climber carries its transport's BOTTOM floor (`spawnWalker(..., t.bottom, t.x, false)`), so a flight whose bottom is reachable but whose top is not still shows climbers. Reachable in Classic: with `WALKWAY_WILLINGNESS.stairs = 4`, six stacked stairways from floor 1 make floors 1-5 reachable and floor 6 not, and the 5-to-6 flight carries `floor = 5`. Fails safe (shows rather than hides). Fix: gate on either endpoint, which needs the transport's top floor carried on the `Walker` alongside `floor`. ALSO OPEN (same family, from the final confirming pass): a climber probes its transport's own tile `t.x`, but `validateTransport` only requires SOME tile under the 8-wide footprint to be structural, so on a gap-split floor a stair may legally sit with its leftmost column over the void. Routing links the flight by its landing tile while the render probe asks about `t.x`, finds no run there, and hides every climber on a perfectly usable stair. Fails safe (hides rather than ghosts) and is unreachable on a gap-free floor, which takes the single-segment fast path. Fix: probe the first structural tile under the footprint, mirroring `landingSeg`. `/gds-code-review`. |
| 2026-07-22 | foodhall-stall-art | #16 | modern-expansion | feature-request | P3 | — | — | idea | **Deferred from the Food Hall stall-art fix (v1.84.1, foodhall-art branch).** The Modern Food Hall renders its six stall subtypes through the restaurant interior drawer, which dispatches only on one of five `interior` styles, so two stalls (Bubble Tea, Coffee Cart) share the `cloth`/French interior and differ only by wall color, and every stall wears a restaurant room rather than a food-court counter (Taco Stand as a steakhouse booth, Bubble Tea/Coffee Cart as a French bistro). The shipped fix resolves the "all food halls look the same" bug (the six now render distinctly); bespoke stall art with a real counter look per stall, including a sixth distinct interior, is the proper follow-up. Modern-only, no TDT ordinal. Player-facing (version bump + changelog at implementation). *(A companion defer, a pixel-diff distinctness test, was retired at triage: the existing distinct-wall-color assertion already guarantees a distinct rendered wall per stall, so a pixel diff is redundant for that guarantee.)* `/bmad-code-review`. |
| 2026-07-22 | decorative-raster-budget | #17 | render-perf | task | P1 | low | — | open | **Milestone 5.x, top priority (owner, 2026-11-19: 4.x is nearly done, so the Backlog and Triage sweep goes to the top of 5.x).** **Gated (measure first, via #538 field telemetry or an on-device probe).** Deferred from `/gds-code-review` of the crane rescale (spec-crane-scale, finding E4): the scaled crane's animated re-raster and GPU upload grew 6.25x (128x76 to 320x190, ~243 KB per animating frame), joining the fountain's by-design per-frame raster as the scene's two sizable decorative uploads on freeze-prone phones. Cadence unchanged, payload grew; no known player-visible defect. If frame health shows it: halve the crane's decorative cadence, split static mast/jib from the moving trolley/hook/beacon into layered actors, or cap decorative re-raster at low zoom. Must not regress pause/reduced-motion freeze or screenshot-clock determinism. `/gds-code-review`. |
| 2026-07-21 | engine-hotpath-scans | — | render-perf | perf | P3 | med | — | superseded | **#539: Folded into #1158 on 2026-11-11 (issue closed as a duplicate; the item is listed on #1158). Pick it up there.** **Post-3.0 (backlog triage 2026-10-28; was P2): a TypeScript-only hot path; Rust tracks its own scans (#1143, #1158, #1237). Re-measure on the Rust engine before any work.** **From full-repository-audit 2026-07-21 (`_bmad-output/planning-artifacts/reviews/full-repository-audit-2026-07-21/`), findings AUD-015/016 (N-5); companion to the raised #338, which lands first.** `pickX` (`src/engine/crowd/trips.ts:57-66`) full-scans all units per spawned person (up to ~16 scans per step, a leading slice of the measured 8.6 ms tick at 25k units); `evaluateStar` (`src/engine/sim/star.ts:13-47`) re-derives population and every gate with ~20 full scans per hour (a named 53 ms hour-boundary contributor). Fix: revision-memoized floor-to-tile index preserving `seed % tiles.length` byte-identity, and one shared per-kind operational-count pass. The broader per-tick baseline (AUD-017) and hour demand-map sharing ride `spec-onhour-boundary-cost`, sized by #538's field data. `/gds-code-review`. |
| 2026-07-17 | custom-music-track | — | audio-music | feature-request | P2 | — | — | done | **DONE (v1.60.0, PR #482 for #479; issue auto-closed on merge).** Composed splash-screen music theme (looping). Character agreed by an agent party (game designer + two player personas + generalist + music enthusiast, 2026-07-17); owner picked "warm & wistful." A short looping hook on the splash / start screen, built in the engine's own Tone.js palette (triangle melody, sine pad, sine bass) so it drops in natively. DNA: D major, ~100 BPM (walking pace), progression D–Bm–G–A (I–vi–IV–V; the vi is the ache, IV–V the lift), rising A→D→F#5 hook that dips through the Bm and resolves home. Adapted in spirit (not copied) from the peppy home-screen theme in `maniator/blipit-legends`. Must ride the existing music volume/mute controls and the lazy engine facade (no Tone in the boot bundle); player-facing so version bump + changelog note. Preview WAVs auditioned by the owner before implementation. `/gds-code-review`. |
| 2026-07-17 | crowd-din-ambience | — | audio-music | feature-request | P2 | — | — | done | **DONE; true-up per full-repository-audit 2026-07-21 (`_bmad-output/planning-artifacts/reviews/full-repository-audit-2026-07-21/`): merged (v1.62.0) and issue #481 closed.** **IMPLEMENTED v1.62.0 (issue #481, closed on merge), spec-first per the crowd-din GDD (`gdd-verticopolis-2026-07-17-crowd-din-ambience`, validated; decision log records all seventeen audition rulings).** The crowd/venue ambience layer (`src/audio/toneCrowd*.ts`) replaces the old synthesized accents outright: per-scene talkers cut live from two owner-recorded voice seeds (81 KB total, the game's first audio assets, licensed in ASSETS-LICENSE.md, PWA-precached), venue one-shots, and composed venue programs (party hall plays a 124 BPM remix of the splash hook with the owner's real laughs and voice-bent whoops; cinema runs plucked score, muffled dialogue, riser-booms; the metro runs scripted train arrival/departure events with a da-dum wheel rhythm). Driven by zoom (rides the bed distance filter), live occupancy (`ViewFocus.crowd`, honest-rooms: empty venues stay silent), and the sim clock (`ViewFocus.hour`: offices workday-gated, condos midday-quiet). Audition rules enforced in code and pinned by tests: voices shift down only, every noise source behind a steep rolloff -48 filter at warm cutoffs (a graph regression test walks every noise node). Earlier interim step v1.61.1 quieted the old accents; this removes them (`maybeAccent`/`accentHit`/`scheduleStep` retired, `toneVoices` is jingles only). `/gds-code-review` ran (Blind Hunter + Edge Case Hunter + Acceptance Auditor against the GDD): the triage patched every mechanics deviation back to spec (silence threshold, honest talker formula, per-scene murmur gains and fixed voices, element-rate scaling, cluster math, program start/stop on live attendance, scene-key settling, the 1 Hz census cache, slot and timer lifecycle races, buffer-source reaping, granular program teardown) plus the owner's two live reports (phone crackle: playback latency hint + capped polyphony + soft dark one-shot envelopes; flat-feeling volume slider: perceptual squared curve); five findings recorded in the Deferral inbox (three texture defers, one evidence note, one dismissal with evidence). **Historical context (the pre-delivery proposal this row was created from; delivered above):** the tower looked alive but did not sound alive: `src/audio/` has a generic per-scene "room rush" noise bed plus a few sparingly-fired zoomed-in accents (`ding`/`clatter`/`keys`/`rumble`/`boom`/`register`/`chatter`), which read as texture, not people. Deepen (not rewrite) that layer into a real crowd bed keyed to what the player views and to live census (honest-rooms pillar: a fuller venue sounds fuller): talking/murmur that scales with crowd, walking/footfall on lobby+transit, eating (cutlery+chatter) for food, playing for recreation, a muffled movie-soundtrack murmur for cinema, and party-hall ambience (music-through-a-wall + cheer) for weddings/parties. Felt zoomed out, resolves to per-venue detail on zoom-in (reuse the existing `detail` ramp + `bedFilter`). All procedural (no files), through the music/ambience volume bus + mute, gesture-gated. Player-facing, so it shipped with a version bump and changelog note (v1.62.0). Landed as its own PR alongside the #479/#480 music work; `/gds-code-review` ran as recorded above. |
| 2026-07-17 | custom-music-track | — | audio-music | feature-request | P2 | — | — | done | **DONE (v1.60.0, PR #482 for #480; issue auto-closed on merge). As shipped, the in-game bed is a standalone calm arpeggio loop that evolves over ~2 minutes (not the overview-motif-that-recedes-on-zoom described below); the owner auditioned and chose that direction over the zoom-reactive theme.** In-game evolving music theme (companion to #479). Same DNA (D major, ~100 BPM, D–Bm–G–A, triangle/sine palette) woven into the engine's overview scene as a recognizable motif that drifts through moods over time (warm overview → calmer "settling" → busier "waking up" → back) instead of a fixed 8-second loop, so it reads as "something that changes occasionally" without grating over a multi-hour session. Reuses the engine's per-scene crossfade and tempo; recedes into per-scene room tone on zoom-in, swells back on zoom-out. Respects music volume/mute; player-facing so version bump + changelog note. May ship with #479 or as a follow-up. `/gds-code-review`. |
| 2026-07-21 | venue-crowd-real-occupancy | — | pixel-art | feature-request | P3 | — | — | resolved | **RESOLVED in the ghost-crowd PR (v1.104.0), closes #552.** Folded from the deferral inbox by #545 (E3/E5/E6 pixel-art reviews plus the `venue-people-routing` traffic-seam defers). Clause by clause: (1) the metro-platform and party-hall `scatterPeople` calls were retired in E5/E3, and this PR deleted the now-callerless helper itself from `sprites/common.ts`, so the idiom cannot come back by accident. (2) The engine-side visible-attendance count the row asked for had ALREADY shipped with #424's attendance-visit flow (`Facility.attendance`, `Unit.customersIn`, `syncAttendanceOccupants` mirroring into `occupants`, census-inert because catalog `population` stays 0, and already a bake-signature input): cinema, party hall and aquatic center draw a real house. This PR closed the last hole in that contract, `drawWeddingHall`, which took no `Unit` at all and so painted the couple plus two full rows of guests into every hall including an untenanted one. It now fills to `visibleOccupants(u)`, couple first. Party hall and aquatic center moved from raw `u.occupants` to `visibleOccupants(u)` to match the spec's Always-rule (behavior-neutral: `outForMeal` is only ever written on a meal trip's ORIGIN room, never on an attendance venue). The unsubtyped shop's `hash(u.id) > 0.4` fallback, which painted a permanent shopper into roughly three of every five empty shops, is gone too. Entrance staff are gated on `tower.units.some(isPresent)`, the party having ratified GATE: a lease keeps `state` at `occupied` around the clock, so a retail-only tower keeps its doorman between meal windows (a live-body count like `totalPopulation` would not). A hotel-only tower does go unstaffed between the housekeeping sweep and the evening check-ins, which follows the leases. (3) The baked ~17px stair/escalator incline rider (AC 151) is RETIRED, not deferred: a baked rider on `cache:true` flight art would show a phantom climber on empty stairs, which contradicts the very empty-tower invariant this row exists to serve. Routed climbers already ride over the flight. `/gds-code-review`. |
| 2026-07-21 | audio-first-cue-latency | — | audio-music | bug | P3 | low | — | resolved | **RESOLVED in PR #2310, closes #554 (open-bug triage party, 2026-11-15): the cue fired by the unlocking gesture is held through the chunk load and the unlock and played once; the jingle bake stays gated on a real latency measurement, as below.** **Ready. Folded from the deferral inbox by #545 (from the audio-baking party, 2026-07-13).** `ToneAudioEngine.sfx()` no-ops until `this.started`, so the very first click/build cue before the Tone graph unlocks is silent; arm or queue the first cue on unlock (its own small PR). Gated sibling: bake the ~6 one-shot jingles (via `Tone.Offline` or small Opus assets) ONLY if a real mid-Android first-cue-latency measurement shows a problem (do not bake on spec; add audio to Workbox `globPatterns` and re-check the precache budget if done). The ambient-score WAV bake was rejected unconditionally; sampled stems are a separate future project. `/bmad-code-review`. |
| 2026-07-21 | lit-string-builder-retirement | — | ui-rendering-engine | task | P3 | — | — | done | **#557 closed done 2026-11-15 (4.x triage): no `*Html` builder or `assertDomEquivalent` remains.** **Gated. Folded from the deferral inbox by #545 (from the E2/E3/E4/E5 lit-migration reviews).** Every migrated dialog left its `*Html` string builder as dead production code feeding an `assertDomEquivalent` guard; retire all of them and their transitional tests in one sweep when the last string dialog (editor/inspector, E6/E7) converts. Parked so far: `confirmHtml`, `eventChoiceHtml`, `updatePromptHtml`, `settingsHtml`, `helpHtml`, `savesHtml`, `stopsHtml`, `newTowerHtml`, `batchPricingHtml`, `buildToolInfoHtml`, `BULLDOZE_TOOL_INFO_HTML`, `INSPECT_TOOL_INFO_HTML`, the three TDT report builders, and the `statsHtml.ts` builders. Where a builder is the sole guard for static copy, add a direct text assertion first. `/bmad-code-review`. |
| 2026-07-15 | render-perf-region-composition | — | render-perf | perf | P2 | med | — | done | **DONE; true-up per full-repository-audit 2026-07-21 (`_bmad-output/planning-artifacts/reviews/full-repository-audit-2026-07-21/`): CAP-2 region composition shipped (PR #388, `towerRegions.ts`, regions e2e green, spec invariants I1-I4 audited and holding); issue #366 closed. The optional drain-tuning story stays gated on field FPS data (see the session-fps-telemetry row) and rides `spec-render-perf-mobile-zoom`.** **Historical context (pre-delivery note, superseded by the DONE prefix):** the row read: ACTIVE INITIATIVE, executing its spec story order (CAP-1 zoom cull PR #296, CAP-3 deferred hour reconcile PR #297, picking via grid lookup PRs #301/#364 all shipped). The then-remaining core story was CAP-2 region composition (since shipped, PR #388) per `_bmad-output/specs/spec-render-perf-mobile-zoom/region-design.md` (room actors collapse into shared region canvases with a budgeted upload drain), gated on the spec's pre-region gates (full-tower day/night visual baseline, one-region pixel-diff spike, texture-upload micro-bench with its verdict already in the memlog, blame-split probe). The optional drain-tuning story rides the same spec. Pixel-hash census (738 day / 1,302 night unique bitmaps) already falsified the shared-bake alternative; regions ruled unanimously (party 2026-07-15). |
| 2026-07-15 | onhour-amortization-consult | — | render-perf | design-decision | P2 | med | — | done | **Promoted from prose (the render-perf S1 defer section) to a row 2026-07-15.** `updateSatisfaction` and `collectTrafficIncome` scan the whole tower on the hour and are load-bearing for determinism and the golden master, so splitting their scans across frames needs a checkpoint-the-inputs design consult first (party verdict 2026-07-14: spec non-goal). Once CAP-2 removes the render share of the on-the-hour hitch, this becomes the residual hitch on big towers. Spec-first; do not attempt as a rider. **Resolved 2026-07-15 (#403, closing #367):** the consult ran (party 2026-07-14, `spec-onhour-boundary-cost`) and shipped the outcome-identical hourly noise-scan memo plus served-set hoists, cutting the owner-save median boundary tick about 36 percent (71 to 45ms) with the golden master unmoved. The determinism-breaking frame-splitting stays a non-goal; reopen #367 only if the Pixel 8a still hitches after on-device acceptance. |
| 2026-07-15 | a11y-shaft-congestion-overlay | #19 | accessibility | feature-request | P3 | — | — | idea | **Gated (needs the small UX pass first; gdd-accessibility phase 2).** **SCOPE ADD per full-repository-audit 2026-07-21 (`_bmad-output/planning-artifacts/reviews/full-repository-audit-2026-07-21/`), finding AUD-026: fold the palette affordability cue into the same color-only sweep: `.pal-item.unaffordable` is opacity-only (`styles.css:298-300`); add `aria-disabled` plus a non-color cue.** **From gdd-accessibility-2026-07-01 (deferred to phase 2; the settings override in the GDD already promises to force this overlay on when it ships).** A congested-band hatch drawn on the shaft plus a small tier badge answers which shaft is choking without color reliance. Distinct from the `congestion-overlay` row (a perf memoization of `congestion()`), despite the similar name. Needs a small UX pass first. |
| 2026-07-15 | pixelart-interior-animations | #18 | pixel-art | feature-request | P3 | — | — | idea | **From gdd-pixel-art-overhaul-2026-07-14 (deferred follow-up design pass; the GDD claimed it was tracked here, record made true 2026-07-15).** Subtle per-unit interior motion (desk fans, TV flicker, diners eating). Hard constraint from the bake architecture: only fire/construction redraw per frame today; any animated room must join the animated set deliberately or the texture cache churns. Design pass first, party-ratified. **Includes the owner-requested cockroach leg-wiggle (2026-07-17): the redesigned roach decals are drawn into the cached hotel sprite, so a wiggle needs the same animated-set opt-in as everything else here (a 2-3 frame leg cycle on a moving actor layer, not the static room bake). Deferred as a fast-follow from the cockroach-visibility PR.** |
| 2026-07-15 | ui-update-decouple-mitigation | — | ui-rendering-engine | design-decision | P3 | — | — | superseded | **#379: CLOSED NOT PLANNED 2026-11-12 (owner-approved open-issue audit): `engine.onUpdate` no longer exists in `src/` after the TypeScript engine's removal (#1956), so the mitigation has nothing to decouple.** **Gated: fires only if the perf gate's profile B regresses. Lit-migration deferred item (c) (promised to the backlog, record made true 2026-07-15).** The structural mitigation decouples `ui.update` cadence from `engine.onUpdate` if lit template re-renders ever show up in the frame budget. Trigger recorded so it is not lost; no action while the perf gate stays green. |
| 2026-07-07 | authenticity-checklist | #22 | OpenSkyscraper docs | review-deferral | P1 | low (cosmetic) | — | open | **Milestone 5.x, top priority (owner, 2026-11-19: 4.x is nearly done, so the Backlog and Triage sweep goes to the top of 5.x).** **Ready: process artifact.** Turn the ~10 original-game screenshots in OpenSkyscraper `doc/simtower/` into a renderer-authenticity checklist for review sessions (underground palette, elevator shaft/car rendering, lobby dressing, hotel room states), incl. the insight that the original's day/night is a **palette swap** (resource 0xFF03): our dusk/dawn should read as a global tint ramp, not per-sprite lighting. |
| 2026-07-08 | background-cityscape | #21 | SimTower parity | feature-request | P3 | — | — | idea | **Gated: needs a spec + art. Owner-requested 2026-07-08** (real-game reference: the New Tower shot from the harness). The 1994 game renders a parallax **city silhouette behind the player's tower**, a teal building skyline on the horizon, day/night palette-swapped. Add a graphical background cityscape layer behind our tower; it must respect the global dusk/dawn tint ramp rather than per-sprite lighting (see the `authenticity-checklist` row: the original's day/night is a palette swap, resource 0xFF03). Cosmetic/atmosphere; no save impact. |
| 2026-07-08 | facility-icons | #34 | SimTower parity | feature-request | P3 | — | — | idea | **Gated: needs a spec + icon art. Owner-requested 2026-07-08** (real-game reference: the SimTower build palette / room glyphs seen via the harness). For Classic especially, represent rooms/modules with little pictographic **icons** (à la the original's palette glyphs) instead of flat color fills + text labels, in the build palette and/or the unit representation. Owner flagged it should read well on **mobile** (icons scale/tap better than text at small sizes). Scope call: palette-only vs also in-world unit glyphs; likely a Classic-mode presentation toggle so Modern can keep its current look. Pairs with the icon set the palette already needs. |
| 2026-07-08 | stairs-render-polish | #20 | UI legibility | feature-request | P3 | low | — | idea | **Ready-ish: art + small render pass. Owner observation 2026-07-08 (real-tower import): "I didn't even see the staircase."** Our stairs/escalator flights read poorly: on import the owner could not spot them. Make walkways legible and nicer: (1) let the flight visually **overlap slightly onto the top landing floor** it connects to (as the diagonal reads in the original), rather than sitting flush; (2) add **shadowing / depth** (drop shadow, edge highlight) so a flight pops against the floor behind it; (3) general walkway UI polish (clearer diagonal, handrail, step shading). Cosmetic only; no engine/save impact. Complements `elevator-floornum-contrast`, `facility-icons`, and `lobby-awnings`. |
| 2026-10-10 | overlay-heatmap-stale-after-load | — | ui-rendering-engine | review-deferral | P3 | low | — | done | **DONE (audit 2026-11-13, #927 closed): the canvas overlay is gone; the Map redraws through `towerTouched` (`src/ui/overviewMapViews.ts`) on every tower swap.** **Ready.** Review deferral from `/gds-code-review` of the #899 symmetric settle (story-engine-test-parity). `towerScene.setSim` (`src/render/excalibur/towerScene.ts`) resets the scene-sync keys (`builtRev`, `mealOverlayRev`, `floorLiveRev`) but not the overlay heatmap's cache keys (`heatmapHour`, `heatmapTowerRev`, `heatmapMealRev`, `heatmapMode`), and `drawStatsMap` (`src/render/excalibur/towerOverlay.ts`) recomputes only when one of them changes. With a map overlay open while another tower is adopted (a loaded save, an undo restore, the gallery's settle), a new tower whose revision and hour match the cached keys keeps the old tower's cells until the hour turns. For congestion the meal revision has to match too, and a fresh instance's meal counter starts again from 0, so it can climb back to the cached value. Pre-existing; no gallery shot that settles after its setup has an overlay open, so the gallery does not render it today. Fix: reset the heatmap keys in `towerScene.setSim`, pinned by a test that adopts a second tower with a matching revision while an overlay is open. |
| 2026-10-20 | ambient-crowd-population-per-frame | — | render | review-deferral | P2 | medium | — | resolved | **RESOLVED 2026-10-27 (facade slice 3, the population cadence PR; issue #1234 to close with it).** `crowdPopulation` (`src/render/excalibur/towerPopulation.ts`) keeps the count and reads it when the revision moves, the sim is replaced, or the sim has stepped and 30 frames have passed, so the walker pass reads it about twice a second at most; the bounded lag is documented beside the cache. The remaining bounded walk is `population-memo-top-speed` (#1335, open) and the `emitMealRushes` walk is `meal-rush-population-per-frame`. Original note: **Ready (Hot-Path Auditor, facade slice 1 review, `/bmad-code-review`; pre-existing, not changed by #1208).** `src/render/excalibur/towerCrowd.ts` reads `engine.sim.population` in `updateMotion` on every rendered frame for the ambient crowd's busyness factor. `Simulation.population` walks every room unit (`routing.totalPopulation`), about 330 µs per read on the large tower (cloud micro-bench, exploratory), over the per-frame budget (HP-2, HP-12). Remedy: read it at most once per step or per HUD tick, or have the adapter memoize it per step, and never per frame (a one-step lag is invisible for a cosmetic factor; say so beside the cache). Facade slice 3 (#1210) is the natural place: the port's header computes `population` once per header object, so a reader that keeps one header for a step or a HUD tick pays the room walk once in that span. |
| 2026-10-27 | population-memo-top-speed | — | render | review-deferral | P3 | medium | — | done | **#1335 closed done 2026-11-15 (4.x triage): the render path reads the view's kept tally (`inspector_recycling`), no room walk.** **Ready (Codex P1 and the independent review of the facade slice 3 population cadence PR; deferral awaiting the owner's words).** `crowdPopulation` (`src/render/excalibur/towerPopulation.ts`) now reads the count only when the revision moves, the sim is replaced, or the sim has stepped and 30 frames have passed, so the room walk (`sim.population`, about 2,900 rooms on the large tower) runs about twice a second at 60 Hz whatever the speed, down from every frame at top speed. It is still a room walk in the render path, so the hot-path page's section 7 treats it as a deferral. Remedy: an engine-owned census counter, or the count on slice 7's once-per-step port header, which makes the read O(1). The count trails the sim by up to about half a second, which the cosmetic crowd gate hides. **Also (2026-10-27, Hot-Path Auditor F4, `/gds-code-review` round 3 of `story-hud-stats-rooms.md`):** #1340 adds that counter on the TypeScript side: the room counts ledger (`roomCounts` in `src/engine/tower/rooms.ts`) keeps the population as the rooms change, so `crowdPopulation` can read `roomCounts(tower).population` (cloud, on the large tower, 0.00007 ms against 0.128 ms for the walk, `story-hud-stats-rooms.md` Result; the first read after a rebuilt rooms list counts every room once). **Also (2026-10-28, independent review F3 on #1411, facade slice 7 PR 5b):** the port's `recyclingFill` on the Rust engine reads `total_population()` (`engine-rs/src/render_reads.rs`), one walk over the rooms per scene sync, about 2,900 visits on the large tower. The TypeScript engine's `recyclingFill` now reads `roomCounts(tower).population`, and the scene sync's other reads walk the rooms at most once (`parkingUsage` reads the office demand by day and the suites by night, and `countOperational` walks the rooms for a room kind), but the Rust engine keeps no room counts yet. Remedy: the same engine-owned population counter, kept as the setters mark the rooms (the view reader's running population in `engine-rs/src/view/reader.rs` is the model), read by `recycling_fill` and `Simulation::population`. |
| 2026-10-21 | stats-report-unit-walks | — | render-perf | perf | P3 | low | — | superseded | **#1262: Folded into #1158 on 2026-11-11 (issue closed as a duplicate; the item is listed on #1158). Pick it up there.** **Ready (Hot-Path Auditor, facade slice 4 PR 4a review, `/gds-code-review` round 1 and `/bmad-code-review` rounds 2 and 3; pre-existing, not changed by 4a, which makes a Modern stats open cheaper).** One Tower Statistics open builds the `statsReport` answer (`src/simport/tsPanels.ts`), whose helpers walk every unit 7 to 12 times and the rooms 4 to 7 times: about 304k to 520k unit visits on the large tower, 6 to 10 ms per open there and 8.0 ms on the owner's save (cloud micro-bench, exploratory), paid per command (each open). The star gates (#539), `stats()` (#905), the booking walk (#1173 F2) and the Rust getters (#1237) are tracked; this row covers the walks no issue lists: the `strandedFloors` candidate walk (`services.ts`, the largest share; over `roomUnits` it measured 3.8 to 0.84 ms large and 4.1 to 0.54 ms owner with identical output), `housekeepingCoverage`'s two whole-unit walks, the `functionalParkingSet` ramp seed (fixed 2026-10-27 by facade slice 4e-1: the seed reads the `rampUnits` index; the flood's string key is #338's), and (from the round 2 review) the repeats inside one open: the report's `recycling` block runs `countOperational("recycling")` twice beside the gate ladder's own (about 0.63 ms large), and the population walks run up to 5 times where 2 would do (about 0.17 ms each). Remedy: walk `roomUnits` where only rooms matter, then compute the per-kind operational counts and the population once per report and pass them down (`demandMet` is `population <= capacity`); per-kind counts must follow unit state, so share them within one report call only (HP-10). **Also (2026-10-27, Hot-Path Auditor P7, `/gds-code-review` round 4 of `story-hud-stats-rooms.md`):** the report reads the tower's kept room counts through `stats()` since #1340 (5.75 ms per open on the large tower, 2.83 medium, 4.70 on the owner's save, cloud), so its population reads can take `roomCounts(tower).population` at no cost. |
| 2026-11-03 | scene-sync-rooms-only | — | render | perf | P2 | low | — | done | **Done (issue #1697 closes with this PR).** The structure pass moved to `src/render/excalibur/towerStructTiles.ts`. A layout, unit list or sim change walks every unit once: it paints the tiles, builds the floor-1 entrance map from that walk's own lobby list (F6, no second walk), and keeps the rooms and the lobby cells in `structPass`. An hour-only or meal-overlay sync walks only the kept rooms (F1), and `engine.d.staffed` comes from that same room loop (F2). A lighting-only flip repaints only the kept lobby cells (F5). The kept rooms stay current because the view patches its room entries in place until it rebuilds the unit list. Cloud headless A/B on the Tier-1 win tower, 8 paired reps (indicative only): the hour-only sync went from 2.65 ms to 1.69 ms (paired ratio 0.695), and the lighting flip from 17.75 ms to 3.45 ms (0.176). F3 (the per-room signature) was measured rather than changed: the whole hour-only sync, flood fill included, is now about 1.7 ms over about 2,900 rooms, so the signature cost sits inside that and is not worth a cache before a PC run shows it. F4 (the parking flood fill) stays with #1158 (A14), #1335 and #1237. |
| 2026-11-04 | meal-overlay-sync-cadence | — | render | perf | P2 | small | — | done | **Done (2026-11-17, closes #1747): a meal-overlay bump alone syncs at most once per `MEAL_SYNC_MS` (200 ms) of real time (`planSceneSync`, `towerSyncSchedule.ts`). Measured: split-tower-4 at top speed bumped on 58% of frames over two days (85% in the 1 PM hour), and one sync costs about 0.6 ms on its 1,699 rooms, so up to about 30 ms of main thread a second becomes at most about 3 ms.** Original note: **Ready (deferred from the `/gds-code-review` Hot-Path Auditor of the rooms-only scene sync, #1697; the owner accepted the deferral on 2026-11-04).** `planSceneSync` syncs at once on any frame whose step bumped `tower.mealOverlayRevision` (unless it crossed an hour), and the Rust engine bumps it per meal return or venue exit, so a busy meal window at top speed can run the room walk (about 2,900 rooms, each building its signature, plus the `regionUnits` spread and the parking flood fill) on nearly every frame. #1697 cut that walk from every unit to the rooms; the cadence is unchanged, and a cloud probe on the Tier-1 win tower saw no meal-overlay bumps at all. Fix: coalesce meal-only syncs to one per short wall-clock window, or drive the room loop from the view's changed-room records. Measure the meal-window cadence with the interaction benchmark first. |

---

## Deferral inbox

The review skills append each `defer` finding here, under a dated `### Deferred from:` heading. The PR that parks it folds it into a curated row before it merges.

---

## History from Verticopolis/web

The deferral notes, triage records and follow-ups below collected in Verticopolis/web's backlog before this repository had its own. They are kept as they were written, under the headings they sat under there.

## Triaged (2026-07-21, #545)

### Deferred from: `gds-code-review` of the crowd/venue ambience (#481/#485, 2026-07-17)

> **RETIRED (#545).** All findings are accepted-for-v1, cosmetic, or dismissed with evidence: the post-load silent-venue window is honest and self-heals, the in-flight voice-tail bleed is masked by the ramps, and the zoom double-attenuation flag was dismissed. The two texture add-later items (condo vacuum / TV melody, hotel cart noise bed) resurface organically when the ambience layer is next touched; not worth a standing row.

- **A busy commercial venue reads silent for the post-load rebuild window (Edge Case Hunter, low).** For population>0 commercial kinds (restaurant, fastFood, shop) the view-focus census reads the live `customersIn` tally, which is deliberately not persisted: right after a save load a venue that was full reads empty (and so plays no ambience) for the seconds it takes the crowd system to re-route diners in. This is honest (the sim really has nobody seated yet) and self-heals, so it is accepted for v1 and documented at the census site in `towerInputCamera.ts`. Fix shape if it ever bothers a player: seed a transient fill estimate from `occupants` for the first post-load hour, or reconcile `customersIn` on load like the attendance mirror does.
- **Condo vacuum pass and TV melody notes (Acceptance Auditor, texture).** Two approved prototype details not yet in the shipped condo scene (the faint TV talker, dish clink, and cupboard thud are in). Add as elements when next touching the layer; the GDD Out of Scope notes the deferral.
- **Hotel cart dark-noise bed (Acceptance Auditor, texture).** The cart ships as a wheel-bump roll rhythm; the approved prototype also had a 220 Hz steep-filtered noise swell underneath. Add if the hallway feels too dry in play.
- **In-flight voice tails bleed briefly across a scene switch (Blind Hunter, low).** A playing phrase or laugh (up to ~1.9 s) is not cut when the scene changes; the murmur filter and level re-ramp around it, so a party laugh's tail can land in the next scene at the new muffle. Masked by the 0.4-0.5 s ramps; fix shape: fade-and-stop live sources on switch.
- **cd-1 decode evidence is empirical, not automated (Acceptance Auditor, low).** The MP3 seeds decode in Chromium and WebKit by direct play testing (owner on laptop and phone, preview and prod); no automated decode check exists. Fine unless the seed files churn.
- **Double zoom-attenuation flag dismissed with evidence (Blind Hunter).** The crowd layer feeds `bedFilter`, whose downstream is the reverb, not `ambGain`; the room-tone bed's own gain sits upstream on its own branch. The layer is zoom-scaled exactly once (its master) plus the shared distance muffle, as designed.

### Deferred from: `gds-code-review` of the composed music tracks (#479/#480, 2026-07-17)

> **RETIRED (#545).** All four are browser-constraint, narrow-window, or cosmetic and accepted for v1: the splash theme only gliding on New Tower (not instant Continue) is the autoplay-gesture constraint, and the crossfade suspend-click, mid-Transport-phase entry, and rapid-toggle silence are unreachable from the two normal UI transitions. No standing work.

- **Splash theme only sounds on the New Tower path, not on an instant Continue dismiss (Blind Hunter + Edge Case Hunter, med).** Audio is autoplay-gated (the Tone chunk loads on the first gesture), and on Continue the only gesture is the one that tears down the splash and sets the program to `"game"` before the engine finishes loading, so it builds straight into the in-game bed. On New Tower (and first run) the splash stays up through the rule-set modal while the chunk loads, so the theme plays and then crossfades to the bed. This is a browser constraint: audio cannot sound before a gesture, and that gesture dismisses the splash. Accepted for v1 (the primary "start a tower" path works, and the changelog is worded to that). If we want Continue to glide too, the fix shapes are: eagerly begin the audio-chunk load when the splash mounts (build the engine under `"splash"` before dismiss), or hold the `"game"` handoff until the engine has actually started under `"splash"`. Documented at the wiring site in `src/main.ts`.
- **Crossfade uses a wall-clock `setTimeout` alongside audio-context `rampTo` (Edge Case Hunter, low).** If the AudioContext suspends mid-dip (tab backgrounded), the fade-out ramp freezes while the swap timer still fires on wall-clock time, so on resume the gain can jump into the swell instead of dipping first (a possible click). Narrow window (program switches are gestures that keep the context running, and `update()` nudges resume). Revisit if it ever surfaces.
- **A crossfaded-in track begins at the Transport's current phase, not the track's opening (Edge Case Hunter, low).** `part.start(0)` on a rebuild mid-Transport enters the loop at `transportTime mod loopEnd`. Harmless for the ambient game bed; a switch back to the splash theme (rare) would drop into the middle of the hook. Cosmetic.
- **Rapid `setProgram` toggling faster than the 0.8 s fade holds the music near silence (Edge Case Hunter, low).** Each call re-ramps to 0 and re-arms the swap timer, so the swell is deferred until the toggling stops. Not reachable from the two normal UI transitions.

### Deferred from: code review of spec-pixelart-retail (E4) (`gds-code-review` adversarial, 2026-07-14)

> **RETIRED (#545).** Both defers are watch-only and gated on hypothetical future changes: the latent interior geometry underflow only bites if shops ever become variable-size (they are fixed 132x44 and each bakes into its own clipped canvas today), and the salon seated-client stand-in is spec-compliant and only worth revisiting if the honesty model tightens to real per-shop occupancy. Resurface with those changes; no standing row.

Change: enriched the eleven canon retail interiors in `src/render/pixelSprites/shop.ts`
plus a new `src/render/pixelSprites/shop.interiors.ts` (per-trade draws, a lit sign
board, a board-faithful `pen()` rect helper), ported tile for tile from
`page-04-retail.build.js`. Three review layers (Blind Hunter, Edge Case Hunter,
Acceptance Auditor). No `patch`-level finding: the one applied fix was reverting a
comment inside the byte-stable generic branch so that branch stays literally
untouched. Two findings deferred, both watch-only:

- **Latent geometry underflow at non-shipping shop sizes** (Edge Case Hunter, Blind
  Hunter): the interiors and the `railY = awningBottom + 8` band assume the fixed
  shipping footprint (`shop` is catalog `width: 12` = 132px, 1 floor = 44px, so
  `fy=39`, `railY=14`). For a shop narrower than ~16px or shorter than ~11px, fixed
  offsets (counters at `w-16`, the electronics clerk at `x + w - 16`, tall props at
  `fy-16`) underflow or overrun and `pen.F` clamps them to 1px slivers or draws off
  the room's left edge. NOT reachable today: shops are fixed 132x44 and each room
  bakes into its own `w x h` canvas (any overrun is clipped, never bleeds into a
  neighbor). Only `screens()` carries an explicit right-edge break. If shops ever
  become variable-size, add an interior-band guard (`railY < floorY`) and clamp the
  fixed-offset props. Watch-only. (Ready, cheap, gated on shops becoming resizable.)
- **Salon renders the hash stand-in as a seated (mid-haircut) client, not a standing
  browser** (Edge Case Hunter, acceptance-flavored): when `u.occupants === 0` and
  `hash(u.id) > 0.4`, station 0 draws a seated client while both stylists always
  draw as staff. This is spec-compliant (the I/O matrix lists the Hair Salon client
  as a sanctioned seated figure, gated on the same single hash signal every shop
  uses; the client count is monotonic and never yields a second ghost), but it reads
  as a stronger presence than the "single browsing customer" other trades show for
  the same stand-in. If the honesty model tightens (real per-shop occupancy), revisit
  whether the salon client should gate on a real occupant rather than the stand-in.
  Watch-only, no behavior change wanted now.

### Deferred from: E3 pixel-art food and entertainment (`/gds-code-review`, 2026-07-14)

> **ABSORBED + RETIRED (#545).** The entertainment honest-attendance gap (cinema and party hall draw an empty house because they are population 0) and the metro-platform `scatterPeople` retirement fold into `venue-crowd-real-occupancy` (#552). Retired: the `f`/`glow`/`box`/`twall` primitives and geography seed duplicated across `food.interiors.ts` and `venue.ts` are an eventual shared-helper cleanup with no behavior risk, and the ice-cream parlor clock `#E8A050` passes the reserved-color rule (outside the within-10 collision band of notice amber `#E8A030`).

Change: enriched the food and entertainment rooms (5 fast-food subtypes, 5
restaurants, the two-floor cinema, and `drawPartyHall`) and tied every visible
figure to real occupancy. Bookkeeping and open follow-ups from this PR:

- DONE here: the party-hall `scatterPeople` ghost crowd is retired. Dancers
  (standing build), the DJ, and banquet guests (seated build) now gate on the
  hall's `u.occupants` and fill in seed order, so an empty hall draws none.
- OPEN (entertainment honest-attendance, cinema AND party hall): both kinds are
  population 0 (`facilitiesData.ts`), so `occupants` (and thus
  `visibleOccupants`) is pinned to 0, and the occupancy-gated audience/dancers
  render an EMPTY house on every real cinema and party hall. Per the frozen spec
  this is the honest read (n === 0 draws empty; "do not leave a constant
  crowd"), and it is exactly what the acceptance matrix states, so E3 ships it as
  drawn. The real fix is engine-side, not draw-code: give entertainment venues a
  visible-attendance count (a foot-traffic or booking-derived number), then feed
  it to the room as a reviewed bake-signature input (spec "Ask First"). Until
  then the cinema and party hall read empty. Flagged by the E3 `/gds-code-review`
  Edge Case Hunter. Do not reintroduce a population-independent ghost crowd to
  paper over it.
- OPEN (metro-platform `scatterPeople`): the metro-platform `scatterPeople`
  call (`src/render/sprites/facilities/service.ts`) is out of scope for E3 and
  still uses the seeded-scatter crowd idiom. It stays with the
  people-system/structure work and its own backlog follow-up.

Second review pass (three adversarial layers) on the finished branch:

- PATCHED here (Edge Case Hunter): person-implying props were drawn outside the
  occupancy gate, so an empty venue showed a floating prop. The seat filler now
  reports whether it drew an occupant, and the sushi chef's hat, the teahouse
  boba cups, the coffee-shop lounge laptop, and the coffee-shop window-bench cup
  all gate on that, matching the party-hall pattern (furniture always draws;
  person-implying props only when the seat fills). Re-verified with the gates.
- PATCHED here (Acceptance Auditor): `drawPartyHall` left the bottom ~6px of its
  two-floor 88px rect unpainted (the food rooms cover it with `pfloor`). Added a
  floor base band so the composition now fills the full rect height.
- DEFER (minor, Blind Hunter): the `f` / `glow` / `box` / `twall` primitives and
  the `(floor * 131 + x * 17)` geography seed are duplicated between
  `pixelSprites/food.interiors.ts` and `sprites/facilities/venue.ts` (different
  render modules). Left as-is to avoid cross-module coupling; a shared
  low-level helper module is the eventual cleanup. No behavior risk today.
- DEFER (low, Acceptance Auditor): the ice-cream parlor wall clock uses
  `#E8A050`. This is not the reserved notice amber `#E8A030` (blue differs by
  0x20, outside the within-10 collision band) and reads as a gold clock, not a
  state cue, so it passes the reserved-color rule. Noted for a future glance if
  the amber hue family is ever tightened.

### Deferred from: code review of spec-pixelart-structure-transport (`gds-code-review`, 2026-07-14)

> **ABSORBED + RETIRED (#545).** The metro-platform / party-hall `scatterPeople` retirement and the un-baked ~17px stair/escalator incline rider fold into `venue-crowd-real-occupancy` (#552). Retired: the reception/info desk occupying lobby variant slot 1 is a spec-internal doc inconsistency to reconcile in a spec touch-up (the contract, `LOBBY_VARIANTS` and the sentinels, is untouched), and the two 2px full-height elevator guide-rail fills are cosmetic and pre-existing, to fold in only if a future pass bands the shaft backing per-floor.

Change: E6 structure and transport pixel art. Ports the page-05 board
composition into `structure/shell.ts` (banded deck), `structure/lobby.ts`
(marble concourse, reception/info desk, sky-lobby glass), `structure/entrance.ts`
(storefront skyline), `facilities/venue.ts` (two-floor wedding hall), and
`transport.ts` (stairs/escalator single-flight-plus-landing, warm elevator
shaft, brass-and-walnut car). Three review layers (Blind Hunter, Edge Case
Hunter, Acceptance Auditor). All eight frozen invariants verified preserved
(LOBBY_VARIANTS=4 and the four entrance sentinels, the `u.floor===1` ground
key with decoration reading only `lit`/`variant`/`ground`, the express
see-through glass backing, floor-number legibility, the FULL red bar, the
direction lantern, one flight per two-floor unit, no mode branch / no save
change). No reserved state-cue color used decoratively. Patched in-PR: the
wedding aisle runner (was red, spec mandates white) plus its test; the wedding
garland color rotation (`Math.abs(ax)%4` was constant); the storefront skyline
block heights (`(bx*3)%4` was constant); the wedding pilaster loop step (could
round to 0 and hang at a degenerate width); the floor-slab clamp (could paint
above a very short tile). Four findings deferred:

- **`scatterPeople` is still drawn on the metro platform and in the party
  hall** (`facilities/service.ts:156`, `facilities/venue.ts:28`). The E6 spec
  calls to retire or gate the ambient crowd so an empty tower reads empty, but
  that gating is owned by `spec-pixelart-people-system.md` and rides the E6
  read-only occupancy seam (`ElevatorQueueView` / real-occupant projection),
  which is not wired here. The enriched lobby and sky-lobby tiles already draw
  no ambient pedestrians; only these two venue/platform calls remain. Pick up
  with the people-system overlay story so the retirement and the real-occupant
  draw land together. (Medium; cross-spec, gated on the E6 seam.)
- **Stairs and escalator bake no ~17px rider** (`transport.ts` flight
  helpers). AC 151 and the I/O matrix describe a climbing rider on the incline,
  but the flight sprites are static `cache:true` art; baking a rider would show
  a phantom climber on empty stairs, contradicting the "empty tower reads
  empty" AC. The engine's routed climbers ride over the flight instead.
  Revisit if the people-system overlay wants a baked rider on the incline.
  (Low; reconciliation with the empty-tower invariant.)
- **The reception/info desk occupies lobby variant slot 1** (`structure/lobby.ts`),
  which the frozen I/O matrix line enumerates as "plain." The spec's own Ground
  and Sky I/O rows and Code Map both call for the desk, and `LOBBY_VARIANTS`
  and the sentinels are untouched, so this is a content realization, not a
  contract change; flagged as a spec internal inconsistency to reconcile in a
  spec touch-up. (Low; cosmetic / doc.)
- **Two 2px full-height guide-rail fills on the opaque elevator shafts**
  (`transport.ts`, non-express only) are drawn at full shaft height. They
  mirror the pre-existing full-height edge shadows and backing fill on the same
  shaft, so the incremental texture-safety cost is negligible, but they are
  additional full-height fills. If a future pass bands the shaft backing into
  per-floor strips, fold these in too. (Low; cosmetic, pre-existing pattern.)

### Deferred from: code review of pixelart-elevator-queue-seam (`/gds-code-review`, 2026-07-14)

> **RESOLVED (#545).** Delivered 2026-07-15 in E6-S7 (#314): `ElevatorQueueView.boarded` now reads the drawn `crowd.carRiders` (single-population invariant), with a real non-hand-written same-individuals reconciliation test (`queueView.test.ts`). Nothing open; the original defer text is kept below for the record.

- **DELIVERED 2026-07-15 (E6-S7, GH #314, branch `claude/queue-view-reconcile`).**
  Picked `crowd.carRiders` (the drawn per-car occupancy) as the single population.
  `ElevatorQueueView.boarded` now reads `crowd.carRiders` keyed `shaftId:carIndex`
  in `elevatorQueueView` (`src/engine/crowd/routing.ts`), replacing the statistical
  `t.carLoad` read, so both halves of the view count the same drawn crowd. The doc
  comments in `routing.ts` and `person.ts` now state the single-population
  invariant. `src/engine/crowd/queueView.test.ts` pins a real, non-hand-written
  same-individuals reconciliation (routed people board via `crowd.advance`, a
  poisoned `carLoad` proves it is ignored, and `boarded` is asserted against the
  independently counted riders aboard the car), plus an alight-lifecycle guard.
  Golden master unchanged (the view is a derived read, not in `serialize()`); no
  version bump (nothing consumes `boarded` visually yet, the render consumer is the
  separate queue-render story). The `/gds-code-review` layers cleared it with no
  patch or defer findings beyond two test-quality fixes applied in the same PR.
  Coordinator: close GH #314. ORIGINAL DEFER (kept for the record): the queue
  view's two halves read two different populations: reconcile boarded against the
  drawn crowd in E6-S7. `ElevatorQueueView.landings` counts the
  DRAWN `crowd.people` (real routed sims in the `waiting` state), but
  `ElevatorQueueView.boarded` reads the dispatch's statistical `t.carLoad`, which
  comes from the aggregate demand model, not the drawn crowd. The drawn per-car
  occupancy is `crowd.carRiders`, and a drawn waiter boarding does NOT change
  `carLoad`, so the two halves are unrelated counts. This seam PR keeps the
  spec-mandated `boarded = t.carLoad[i]` on purpose (it is the value the cab fill
  draws today, and nothing consumes `boarded` visually yet: the render consumer
  is the separate E6-S7 queue-render story). The spec's INTENT ("the leftover
  line is the same individuals, now shorter") is only truly honored if boarded
  and the queue are the same population. The engine unit test
  (`src/engine/crowd/queueView.test.ts`) reconciles boarded against the queue by
  HAND-WRITING `shaft.carLoad`, which stands in for the dispatch. E6-S7 must
  decide whether `boarded` reads `carLoad` or `crowd.carRiders` (the drawn
  occupancy) and add a real, non-hand-written "same individuals" reconciliation
  test then. Deferred: surfaced by the Edge Case Hunter, kept per the frozen spec
  for this seam-only PR. (Judgment call, flagged in the PR body.)

### Follow-up: evaluate a Preact (or similar) UI rendering layer (2026-07-14, from Wave C-2)

While splitting `UI.ts`, the owner raised moving the DOM generation to
React/Preact instead of hand-built HTML strings + imperative wiring. Deferred to
its OWN initiative on purpose: the Wave C-2 split is behavior-preserving (the
view moves to pure `uiTemplates.ts` string builders, the controller stays vanilla
imperative), whereas adopting a framework is a UI-architecture change (new
dependency, declarative components replacing `ui.update()/showX()/toast()`, and a
ripple into the e2e / visual-snapshot baselines). Pick up as a specced, party-run
initiative after the Wave C splits land: scope the component boundary, the
imperative-to-declarative bridge for `main.ts`, and a baseline-regeneration plan.
(Feature-request / architecture; open; owner-requested.)

### Deferred from: party consultation on audio baking (2026-07-13)

> **ABSORBED + RETIRED (#545).** The first-gesture-silence bug (the concrete deliverable) and the gated jingle-bake fold into `audio-first-cue-latency` (#554). Retired: baking the ambient score to WAV was rejected unconditionally (a closed decision, net loss on bytes/feel/CPU), and feeding sampled stems through the mixer is a separate future exploration to park if the procedural palette ever feels thin.

Owner follow-up to the Tone.js audio work: should we bake WAV files into the
PWA cache instead of generating tones on the fly? Party (dev + UX voices,
general-purpose research on how comparable browser games ship audio) returned a
clear verdict with three separate threads:

- **Music stays procedural. Baked WAV for the ambient score is rejected,
  unconditionally.** The three streaming scene beds are generated live by the
  Tone graph today; pre-rendering them to WAV is a net loss on every axis. Bytes:
  a few minutes of looping stereo WAV dwarfs the 66 KB gzipped Tone.js chunk and
  would blow well past the 6 MB Workbox precache ceiling (or force runtime
  fetches the offline install is meant to avoid). Feel: the procedural beds
  crossfade and re-voice per zoom scene (`OVERVIEW_ZOOM`/`DETAIL_ZOOM`), which a
  fixed loop cannot do without a much larger sample set. CPU: decoding and
  scheduling a large buffer is not obviously cheaper than the current synths on
  the target phones. No measurement could flip this one, so it is a closed
  decision, not a gated one.

- **Jingle-bake is a GATED follow-up, not scheduled work.** The one place baking
  could help is the short one-shot cues (build-complete, star-up, error, etc.):
  bake those ~6 jingles once (via `Tone.Offline` into an `AudioBuffer`, or ship
  small compressed Opus/Ogg assets) so a cue can fire from a decoded buffer
  instead of spinning up synth voices. The ONLY justification is first-gesture
  latency on a mid Android device: if the first click/build cue is audibly late
  or dropped while the Tone graph warms, baked buffers fix it. The gate is a real
  measurement of that first-cue latency on mid Android hardware, which cannot be
  taken in this headless environment. Per the dev voice: if the measurement comes
  back fine, the correct action is status quo and we ship nothing. Do not bake on
  spec. If we do bake the jingles, add them to `globPatterns` (currently
  `js,css,html,ico,png,svg,woff,woff2`, no audio) and re-check the precache
  budget.

- **First-gesture-silence bug (fix regardless of the bake decision).**
  `ToneAudioEngine.sfx()` no-ops until `this.started` is true, so the very first
  click or build cue before the Tone graph is unlocked is silent. This is a
  latent bug independent of baking (baking would mask it, but the graph should
  simply queue or arm the first cue on unlock). Fix it on its own small PR; it is
  the concrete deliverable this consultation surfaced.

- **Sampled stems into the existing mixer is a SEPARATE future project.** Feeding
  recorded instrument samples through the current Tone mixer for richer timbre is
  a different idea from "cache WAV to skip synthesis" and was not evaluated here.
  Park it as its own future exploration if the procedural palette ever feels thin.

### Deferred from: code review of ToneAudioEngine split (`bmad-code-review` adversarial, 2026-07-14, Wave C-1)

> **RETIRED (#545).** Nothing was left deferred: both findings (the throwaway `AccentNodes` alloc on no-accent scenes and the empty-`def.scale` NaN in `scheduleStep`) were patched in-PR, the latter with a `toneVoices.test.ts` case.

Change: `ToneAudioEngine.ts` (831 lines) split into `toneScenes.ts` (data + pure
math), `toneVoices.ts` (synthesis free functions), and the orchestrator class.
Behavior-preserving. Two review layers (Blind Hunter, Edge Case Hunter) plus
Copilot. Nothing left deferred; both findings were patched in-PR:

- Throwaway `AccentNodes` allocation on zoomed-in no-accent scenes, now
  short-circuited before node resolution (`onStep` checks `def.accent !== "none"`).
- **`scheduleStep` NaN on an empty `def.scale`** (Edge Case Hunter + Copilot):
  the else branch indexed `def.scale[degree]` with no length guard, so an empty
  scale would produce a NaN note. Unreachable for the built-in `SCENES` (all 12
  have non-empty scales), but `scheduleStep` is now an exported helper whose
  `SceneDef` param does not constrain the scale to non-empty, so the extraction
  changed the risk profile. Fixed with a behavior-preserving `if (!def.scale.length) return;`
  guard (never fires for the shipped scenes) plus a `toneVoices.test.ts` case
  covering both the finite-frequency contract and the empty-scale short-circuit.

### Deferred from: gds-code-review E3.1 (parking ratio + one-car sprite), 2026-07-07

> **RETIRED (#545).** The dev sprite catalog stretching the single-stall parking sprite to the full cell width is dev-only tooling and cosmetic (not player-facing); render parking at its true footprint, and revisit the sprite-gallery shot, when the E1b parking width change (6 to 4) lands and screenshots regenerate.

- **Dev sprite catalog stretches parking to the cell width**, `gallery.ts:144`
  (`w≈292`) and `preview.ts:79` render `drawParking` at the full catalog-cell
  width, so the new single-stall parking sprite reads as one small car adrift in
  a wide empty bay. Dev-only tooling (not player-facing), cosmetic. Fix (optional):
  render parking at its true `u.width * TILE` footprint in the catalog rather than
  stretching to the cell. _Note: relevant when the E1b width change (parking 6→4)
  lands and screenshots regenerate, revisit the sprite-gallery shot then._

### Deferred from: gds-code-review (rain shaping / overview doubling), 2026-07-12

> **RETIRED (#545).** The overview melody doubling passing through the 650 Hz distance lowpass was shipped as-is and verified to still land (500-2000 Hz energy rose 5.6x zoomed out in the built app); route the doubling dry to the music bus only if phones read too quiet zoomed out.

- **The overview melody doubling passes through the 650 Hz distance lowpass**,
  which attenuates the upper half of its 523-1975 Hz range by roughly 9-19 dB
  (the band it exists to supply for phone speakers). Empirically the effect
  still lands (500-2000 Hz energy rose 5.6x zoomed out in the built app), so
  shipped as is; if phones still read as too quiet zoomed out, route the
  doubling dry to the music bus like the rain layer, at the cost of dodging
  the reverb/scene mix. (Edge Case Hunter, 2026-07-12.)

## Completed / superseded

### Deferred from: code review of E1 pixel-art shared language (`/gds-code-review`, 2026-07-14)

> **RETIRED (#545).** No residual defers: every finding was patched in-PR, including the one Edge Case Hunter parking item (`shade()` yielding `rgb(NaN,...)` for a non-hex argument), which now returns a non-hex argument unchanged so the helpers degrade gracefully while every shipped caller stays byte-identical.

Change: E1 adds the finalized `person()` build family, `moodTint`, new `PAL`
keys, and the shared helpers (`windowView`, `roomGlow`, `ceilingFixture`,
`dado`, `castShadow`) to `pixelSprites/common.ts`, plus the food/shop
look-table splits into `food.looks.ts` / `shop.looks.ts`. Three review layers
(Blind Hunter, Edge Case Hunter; the Acceptance Auditor timed out, and its
spec-conformance scope was independently re-verified by the Edge Case Hunter:
build heights 15/18/24/17/22, new `PAL` keys vs the art bible, byte-identical
look data, barrel surface). Patched in-PR: the width-6 leg-gap bug (fixed leg
columns), the `windowView` `lit` inversion plus night-gating of the city
lights, the `RESERVED_COLORS` docstring overstatement, and per-wrapper build
tests. No residual defers: the one Edge Case Hunter parking item (the exported
`personFigure` / `dado` / `ceilingFixture` passing a bare color into `shade()`,
which yielded `rgb(NaN,...)` for a non-hex argument) was patched in-PR after
Copilot raised the same point on the PR. `shade()` now returns a non-hex
argument unchanged, so those helpers degrade gracefully; every shipped caller
still passes a `#RRGGBB` literal, so current output is byte-identical.

### Deferred from: code review of E2 pixel-art tenant rooms (`/gds-code-review`, 2026-07-14)

> **RETIRED (#545).** No residual defers: all ten findings were patched in-PR and the rest were dismissed as intended-by-design or already-guarded (sub-production window math, occupancy-keyed downlights, per-layout seat caps, the `w > 44` grade exclusions, draw order, the mirrored sleeper, and the minimal-barrel `residential.looks.ts`/`dollhouse.ts` non-export).

Change: E2 ports office, condo, and the three hotel grades to the ratified
page-02 warm-dollhouse composition. New `pixelSprites/dollhouse.ts` (the
composition primitives `fill`, `bevelBox`, `glow`, `interiorWall`,
`ceilingCap`, `downlights`, `plankFloor`, `curtain`, `framedArt`) and
`pixelSprites/residential.looks.ts` (the wall and picture look tables, re-tinted
to warm variants held within 10 per channel of each anchor); `residential.ts`
rewritten to compose the shell over the shared E1 helpers (`windowView`,
`dado`, `ceilingFixture`, `roomGlow`) and to adopt `personSeated`.

All three adversarial layers ran to completion (Blind Hunter, Edge Case
Hunter, Acceptance Auditor). Patched in-PR (10 findings). Two from the final
review pass: the suite coffee table drawn at the bed origin
(`x + suiteSofaW + 14`) and fully occluded by the bed painted afterward, so a
spec-required suite element rendered zero pixels (moved into the sitting area,
in front of the sofa, where it is visible and clear of the bed); and the condo
study's bottom book-spine row overflowing the bookcase by 1px onto the floor
line (rows anchored at `railY - 1` so all four 3px rows end at `floorY - 1`).
The Edge Case Hunter found no genuine unhandled edge cases. The earlier eight:
the 1px unpainted seam at row `y+3`
between the ceiling cap and the interior wall (interior wall now butts under
the cap at `y+3`, with the downlights/ceiling fixture drawn over it); the
misleading `cueTop` comment plus its single-use indirection (the asleep "z"
baseline is now inlined at `floorY - 10`); the duplicated suite `sofaW`
(hoisted to one `suiteSofaW`); the conditional `globalAlpha` reset in `fill`
(now unconditional, matching its docstring); the hotel asleep sleeper gating
on raw `u.occupants` (now `visibleOccupants(u)`, matching office/condo and the
file's occupancy contract); the asleep "z" not gated on occupancy while the
sleeper figure was (now both gated on `visibleOccupants(u) > 0`, so an empty
bed never shows a "z"); the narrow-meeting chair count that could over-claim a
seat (`Math.max(2, ...)` to `Math.max(1, ...)`, so seated never exceeds the
chairs that fit); and a documenting comment that a hotel has no vacancy shell
by design (state "empty" reads as ready-to-rent, the ready lamp lit, which the
shipped `sprites.test.ts` already pins).

No residual defers. Dismissed as intended-by-design or already-guarded: the
window off-rect math for sub-production widths (guarded by the `fill` /
`windowView` min-1 clamps, and production room widths are fixed at 44/66/99/
110/176px); the office downlights keying on occupancy rather than `d.lit` (the
spec I/O matrix wants downlights off for an empty office, with the empty-at-
night scrim handling the dim); the per-layout seat caps differing by geo
layout (the spec caps seated figures at the layout's seats, and the executive
corner is ratified as one exec plus two cubicles); the `w > 44` exclusion of
the single-grade ceiling light and framed art (mirrors the build's `if(W>44)`
at page-02 lines 50 and 54, the pixel-exact port reference; the single is the
deliberately plainest grade); the meeting worker drawn after the table
(matches the reference build's draw order); the hotel asleep sleeper drawn
inside `maybeMirrored` (the Code Map at spec line 104 directs it to stay in the
`bed` closure so the sleeper's head tracks the flipped headboard; only the
corner state cues, tray, ready lamp, and the "z" text, must be pixel-identical
across the mirror, and those do draw outside); the asleep "z" x-position being
flip-compensated (`zx = flip ? 2*x + w - zSrc - 5 : zSrc`) rather than literally
identical (it must float over the flipped bed, and it still draws outside the
wrapper so the text is never backward; the "identical pixels" AC wording is
imprecise); and the extracted `residential.looks.ts` tables and `dollhouse.ts`
helpers not being re-exported through the `pixelSprites.ts` barrel (they are
consumed directly by `residential.ts` and its test, have no cross-module barrel
consumer like the food/shop look tables do, and the `barrelSurface.test.ts`
deliberately curates a minimal barrel surface, so re-exporting would add dead
surface against an intentional guard).

### Deferred from: E5 pixel-art utilities and service (`/gds-code-review`, 2026-07-14)

> **ABSORBED (#545) into `venue-crowd-real-occupancy` (#552).** All three items ride the people-system traffic seam: the metro real-commuter platform crowd (this PR removed the ghost `scatterPeople` and left the platform empty per spec), the party-hall `scatterPeople` retirement, and the fixed-size figures not scaling with the room rect at non-bake sizes (handle figure sizing in the people-system compositor, not per facility). No live defect: the real render bakes at identity.

Change: E5 enriches the seven utilities-and-service looks (recycling, metro,
medical, security, housekeeping, parking, parking ramp) by porting each from its
pixel-exact Figma reference build script through a shared `refMap` scaler, maps
every figure to the finalized `person()` family (`personSeated` guard,
`personStanding` nurse/doctor/housekeeper with a white-coat overlay for medical
staff, `personHiVis` recycling hand), keeps the `recycleFill` pile plus green /
amber / red FULL gauge and the `parkingUse` / `parkingDead` car gate, and splits
`service.ts` into `service.ts` (five interior kinds), `garage.ts` (parking and
ramp), and `serviceKit.ts` (shared port helpers).

- **Metro real-commuter platform crowd (follow-up, depends on the people-system
  traffic seam).** This PR removes the `scatterPeople` ghost crowd from
  `drawMetro` and leaves the baked platform empty, per spec. The real routed
  commuters are meant to ride the redraw overlay that the people-system traffic
  seam owns (walkers at the 24px scale, tinted content then amber then stress red
  by wait). That overlay is not landed here; when the seam ships, wire the metro
  platform crowd to it. Until then an empty tower correctly shows an empty
  platform. Type: review-deferral / feature-dependency.
- **Party-hall `scatterPeople` retirement is out of scope here.** `drawPartyHall`
  in `facilities/venue.ts` still calls the ghost `scatterPeople`; that retirement
  belongs to the food-and-entertainment spec, not this one. Noted so it is not
  lost.

Review findings (`/gds-code-review`, three layers). The Acceptance Auditor
returned compliant on every pinned constraint (reserved colors, the
`recycleFill` gauge, the `parkingUse` / `parkingDead` gate, no ghost crowd,
figures mapped to the shared family, integer coordinates, no per-frame scan, no
lease card). Patched in-PR: the `refMap` zero-size guard (a genuine 0-size
reference rect now paints nothing instead of being floored to a stray 1px, which
removes both the empty-gauge green sliver and the ramp-foot void pixel and
restores reference fidelity), `Number.isFinite` normalization of `recycleFill`
and `parkingUse` (a non-finite input can no longer blank the pile/gauge or
silently suppress a car), and a tightened metro test that now also asserts no
skin-tone figure of the finalized family is baked. One defer:

- **Fixed-size figures do not scale with the room rect at non-bake sizes
  (follow-up, people-system figure scaling).** The shared `person()` builds and
  the `whiteCoat` overlay draw at native 1x at a scaled anchor, so at the
  canonical bake size (`w === RW`, `h === RH`, identity map) they align with the
  furniture exactly, but at a non-identity rect the figures keep their pixel size
  while the furniture scales. The real render bakes at identity, so this is not a
  live defect; fixed-size character sprites are also the intended pixel-art
  behavior. Captured so that if the people-system traffic seam ever composites
  figures at a non-bake scale, figure sizing is handled there, not re-derived per
  facility. Type: review-deferral / render-consistency.

## E9 integration (PR #266): cross-cutting review defers and shipping followups

The six art epics merged into the integration branch and shipped as one overhaul
PR. Two defers came out of the cross-cutting `/gds-code-review` over the whole
integrated diff, and a set of E6 art-quality followups were split out so the
strong overhaul (E2 through E8) could ship without waiting on the E6 polish.

Cross-cutting review defers (both log-only, integration was otherwise clean):

- **Wedding-hall composition test lives in `sprites.transport.test.ts`.** After
  the `sprites.test.ts` split, the wedding-hall paint test sits in the transport
  sibling file. Harmless (it is grouped with structure and event coverage) but an
  odd home for a venue test. Relocate to `sprites.test.ts` next time these files
  are touched. Type: test-organization.
- **Reserved-color / integer-pixel sweep does not cover the venue kinds or
  cinema.** The `sprites.test.ts` guard sweeps the seven service kinds but not
  `partyHall` / `weddingHall` (in `venue.ts`) or `cinema`, which only get
  occupancy and paints-without-throw assertions. Venue colors were verified by
  hand at merge, but a guard over the venues would harden the merge-resolved
  `venue.ts` against future edits. Add a venue reserved-color guard next touch.
  Type: test-coverage.

E6 structure and transport art followups (owner-flagged from live play, split
into a fast-follow so the overhaul could ship). E2 (offices, hotels, condos) and
the other kinds read well in game; these are contained to the ground lobby and
the stair / escalator sprites:

> RESOLVED on branch `claude/pixelart-e6-followup`: the ground-lobby receptionist
> repeat, the sky-lobby night glare, the stair and escalator geometry, and the
> grand-entrance prominence are all fixed in that PR. The gallery multi-floor
> sizing shipped in part 1 of the same branch. Review defers from that PR are in
> the "code review of E6 structure/transport art followup" section below.

- **Ground lobby repeats the seated receptionist at every fourth tile.** The
  lobby tiles four baked variants by `x % 4`, and variant 1 is a staffed
  reception desk (`receptionDesk` with `personSeated`), so the same attendant
  reappears every four structural tiles across a wide concourse. A staffed
  reception is a once-per-lobby feature, not a tiling motif. Move the reception
  desk and attendant out of the repeating cycle (into the grand-entrance tile,
  which is placed once), and make variant 1 a tile-friendly architectural element
  (a wall panel or bench) instead. `src/render/sprites/structure/lobby.ts`.
- **Stair flight geometry reads badly.** `drawStairFlight`
  (`src/render/sprites/transport.ts`) renders a broken, jagged diagonal that does
  not read as a clean staircase and sits awkwardly over the lobby floor. Rework
  the flight so the treads, risers, stringer, and handrail compose a readable
  staircase at play zoom.
- **Escalator run reads badly.** `drawEscalatorRun` (same file) reads as a long
  shallow zigzag ramp rather than an escalator. Rework toward a clean inclined
  belt with a handrail and legible step edges.
- **Grand entrance / awning is not prominent in play.** The enriched grand
  storefront and doorman (`src/render/sprites/structure/entrance.ts`) do not read
  as a grand entrance at the lobby's frontage edge in game (it appears as a small
  green sliver). Confirm the grand-entrance tiles are being placed and consider a
  projecting marquee or awning so the entrance reads as grand.
- **Gallery squishes multi-floor kinds.** `src/gallery.ts` sizes every cell to
  about one floor, so genuinely multi-floor kinds (cinema, party hall, recycling,
  housekeeping floors 2; metro floors 3) render vertically crushed and cannot be
  judged in the baseline. Size each gallery cell by the facility's `floors` so
  multi-floor compositions show at their true proportion (clamp to the cell,
  scale width to preserve aspect). Regenerate the baseline and screenshots after.

### Deferred from: code review of E6 structure/transport art followup (`gds-code-review`, 2026-07-14)

> **RETIRED (#545).** The sky-lobby-unstaffed item was resolved by owner decision (the sky lobby stays unstaffed; amend the frozen I/O matrix line, no code). The stairs/escalator no-rider item is an intentional spec renegotiation for traceability (amend the frozen AC via the renegotiation ritual). The marquee overpainting the compact grand-solo door header and a narrow 1-tile lobby showing no receptionist are low, degenerate-case cosmetics.

Change: `src/render/sprites/structure/lobby.ts` (reception moved out of repeating
variant 1 into a person-free console/bench; `skyGlass` tones down the sky lobby),
`src/render/sprites/structure/entrance.ts` (one reception desk + attendant in the
grand-left slice; a projecting marquee on the wide and compact grand entrances),
and `src/render/sprites/transport.ts` (clean figure-free stair flight and
escalator run that land on the second-floor deck). Three review layers (Blind
Hunter, Edge Case Hunter, Acceptance Auditor). Patch findings fixed and
re-verified: the stair/escalator drop shadow no longer paints the `bandBottom`
row (height reduced to 1 so the deepest column stays inside the band), the newel
post is drawn after the top landing so it reads, and the once-per-lobby comments
were corrected to note the compact 1-tile fallback shows no receptionist. Defers:

- **Sky lobby shows zero attendants after de-repeat. RESOLVED: owner chose to
  keep the sky lobby UNSTAFFED (zero attendants).** De-repeating removed the tiled
  attendant, and there is no single-placement path for sky lobbies (the floor-1
  entrance map that hosts the ground lobby's one reception is `u.floor === 1`
  only). The owner decided the sky lobby stays unstaffed, so this is closed, not
  an open item, and the frozen I/O matrix line ("an info desk with an attendant")
  should be amended to match. No code change; do not add a sky-lobby placement
  seam. (Acceptance Auditor; owner decision 2026-07-14.)
- **Stairs/escalator no longer bake a rider; the frozen AC should be amended.**
  The frozen structure/transport spec AC and I/O matrix say the incline carries
  the ~17px rider build, but per the owner directive the flights bake no
  climber/rider (empty tower reads empty; the engine's routed sims ride over the
  static flight). This is an intentional renegotiation, not a defect. The frozen
  `spec-pixelart-structure-transport.md` AC should be amended to record it. Do not
  edit the frozen spec without the human renegotiation ritual. (Acceptance
  Auditor; supersedes the earlier "Stairs and escalator bake no ~17px rider"
  defer above. Low; spec traceability.)
- **Marquee overpaints the compact grand-solo door's top header row.** In
  `drawGrandCompact` the marquee is drawn last across the full tile; its body
  (y+3..y+6) meets the compact door header at `doorTop = y+6`, so the canopy sits
  over the door's top row. It reads correctly as "canopy in front of the door"
  and the wide facade avoids it by lowering its chandelier, but the compact path
  did not nudge the door top. Nudge `doorTop` down a pixel or trim the marquee on
  the solo tile if a future pass wants the door header fully clear. (Blind Hunter
  / Edge Case Hunter. Very low; cosmetic.)
- **A narrow (1-tile) floor-1 lobby run shows no receptionist.** The wide grand
  entrance (leftmost run of width >= 2) hosts the single reception; a 1-tile run
  maps to `grand-solo`, which has no room for a counter. Reachable for a toy
  lobby or a lobby whose leftmost contiguous run is split to width 1 by a gap.
  Both reviewers judged it acceptable for a degenerate lobby; revisit only if the
  owner wants a compact reception on the solo tile. (Edge Case Hunter. Low;
  degenerate-case cosmetic.)

### Deferred from: code review of E6 grand hotel entrance redraw (`gds-code-review`, 2026-07-14)

> **RETIRED (#545).** The wide grand entrance carrying one palm (right flank) rather than one on each side is a 22px layout conflict with the required reception desk that needs an owner decision, not a code fix. The fixed 18px door height (not proportional to `h`) is test-fidelity/robustness only: entrance tiles always bake at `FLOOR = 44` in production. Derive the door height from `h` only if entrances ever bake at another height.

Change: `src/render/sprites/structure/entrance.ts` grand forms redrawn from the
glass storefront + green marquee to the page-05 `grandEnt` grand hotel entrance
(red scalloped awning, gold double doors, glass curtain wall, red carpet, potted
palm, doorman) on the wide (`drawGrandFacadeLeft` + `drawGrandFacadeRight`) and
compact (`drawGrandCompact`) forms; the service entrance is untouched. Three
review layers. Patch findings fixed and re-verified: the compact doorman was
moved from `lc + 4` to `lc + 3` so his 2px sway frame no longer clips column 11
off the 11px tile; the compact palm was resized to fit inside the tile instead of
spilling off the left edge; the compact door's right handle was mirrored about the
center split; the wide doorman was nudged to composite `dcx + 3` so both feet stay
on the carpet and clear of the right palm's pot; and the left reception desk now
derives its base from the `fy = h - 6` floor line. Defers:

- **Wide grand entrance carries one palm (right flank), not one on each side.**
  The reference `grandEnt` and the owner directive want a palm flanking the doors
  on both sides, but the left flank of the wide 2-tile form (22px) hosts the
  required single relocated reception desk + attendant (6px), which leaves no
  floor room for a left palm beside the left door leaf. The two requirements
  (keep the reception AND a palm on each side) conflict in 22px. Shipped with
  reception on the left, palm on the right, doorman on the carpet. Owner to
  decide: keep the reception plus one palm, or drop the reception here for a
  second palm. (Acceptance Auditor. Low; needs an owner decision, not a code fix.)
- **Door geometry is a fixed 18px tall, not proportional to `h`.** `doorH = 18`
  and `doorTopY = fy - 18` are constants tuned for the game's `FLOOR = 44`
  (`fy = 38`, door spans ry 20..38). At the unit tests' `h = 34` the door top
  rises into the awning band, and for `h <= 24` `doorTopY` would go negative (the
  `Filler` clamps rect SIZE, not position). Not reachable in production (entrance
  tiles always bake at `FLOOR = 44`), and the tests only assert `painted()` /
  `sig()` inequality, so it is test-fidelity / robustness only. Derive the door
  height from `h` if a future change ever bakes entrances at another height.
  (Edge Case Hunter. Low; robustness.)

## Crowd + vehicle read-right fast-follow (v1.32.1)

Read-right pass over the in-tower vehicles and crowd, driven by the owner's prod
screenshots:

- Metro train rescaled from a 9px sliver to 20px (`METRO_TRAIN_H`).
- Garbage truck rescaled from 16px to 42px (`GARBAGE_TRUCK_H`), filling most of
  the recycling center's bottom story; redrawn so the body/cab/wheel rows derive
  their vertical extents from the height constant.
- Ambient walkers no longer float on the upper stories of multi-floor facilities.
- Lobby walkers fan into evenly spaced lanes instead of clumping at the ping-pong
  ends (layout math in `towerCrowdLayout.ts`, unit-tested).
- Elevator landing queues: per-waiter spacing widened from 0.6 to 1.1 tiles and
  reach from 16 to 30, and a jammed landing now compresses its line to fit the
  built floor instead of piling the overflow onto one wall tile.

`/gds-code-review` (Blind Hunter + Edge Case Hunter) ran across two rounds with
no confirmed findings. Copilot's real catch (a `(i * 7 + 3) % count` lane
interleave that collapses at counts divisible by 7) was fixed by switching to
evenly spaced lanes with an explicit multiple-of-7 non-collapse test.

Follow-up (owner + party ratified): a 60px "1.5 floor" metro train on a redrawn
high-platform station, plus real routed platform commuters (task #24), since the
metro platform draws empty today (the crowd never routes there as a destination).

### Render-perf S1: zoom cull of the moving layer (2026-07-15)

CAP-1 of the mobile render-perf spec
(`_bmad-output/specs/spec-render-perf-mobile-zoom/`). Review triage patched
everything the layers confirmed (reconcileCrowd running the idempotent
hysteresis step itself; the accidental milestone-PNG clobber reverted; the
loop-skip pinned at unit tier; the e2e crowd leg de-vacuumed with seeded
people; re-show leaving routed people to reconcileCrowd so a figure that
departed while culled never flashes at a stale position). Standing defers:

- **Engine `onHour` amortization stays out of scope** (spec non-goal, party
  verdict 2026-07-14). `updateSatisfaction` and `collectTrafficIncome` are
  load-bearing for determinism and the golden master; splitting their scans
  across frames needs a checkpoint-the-inputs design consult first. The
  render-side share of the on-the-hour hitch is CAP-3's target instead.
- **`TowerEngine.ts` sits at exactly the 500-line ceiling** after gaining the
  one-line `crowdCulled` latch. The next line added there forces a split (it
  is not in `fileSize.ratchet.txt`); plan the seam then rather than balancing
  on the limit.
- **`e2e/milestones.spec.ts` writes into `docs/screenshots/milestones/` as a
  side effect of any local run**, which is how host-browser captures snuck
  into a commit this story. Consider pointing its output at `test-results/`
  (or gating the write behind the screenshot workflow env) so a local e2e run
  can never dirty the committed gallery.

### Deferred from: `/gds-code-review` of cockroach sprite redesign (2026-07-17)

> **RETIRED (#545).** The one robustness gap (`roachOval` divide-by-zero into a NaN rect) was patched in-PR, and the owner-requested leg-wiggle is already tracked under `pixelart-interior-animations` (#377). The two remaining notes are dismissed cosmetics: roach decals drawing outside `maybeMirrored` (the cue is pixel-identical regardless of flip, as intended) and the `seam`/`collar` verticals using `cx`/`cy` rather than the flip helpers (stays inside the symmetric body).

Three-layer adversarial review (Blind Hunter, Edge Case Hunter, Acceptance
Auditor) of the redesigned roach decals (`drawRoach`/`roachOval`/`roachLine` and
the infested/dirty placement in `residential.ts`). One robustness gap was PATCHED
in the same PR: `roachOval` now floors both radii to 1 so a future tiny-`L` roach
can never divide by zero into a NaN rect (both adversarial layers flagged the
`ry`-guard asymmetry, though no current caller reaches it). No live correctness,
determinism, or caching defect was found. The owner-requested leg-wiggle is
tracked under #377 above. Non-actionable notes (dismissed):

- **Roach decals draw outside `maybeMirrored`, so absolute positions don't flip
  with the room (Edge, cosmetic).** A satellite can land on a bed in the
  unflipped layout and on wallpaper in the flipped one. The infestation cue is
  pixel-identical regardless of flip (the stated intent and what `residential.test.ts`
  asserts), so this is variety noise, not a bug.
- **`seam`/`collar` verticals use `cx`/`cy` rather than the `X()`/`Y()` flip
  helpers (Edge, cosmetic).** On upside-down (`fy=-1`) satellites the seam runs
  the "wrong" way, but stays inside the symmetric body silhouette.

### Render-perf S3: deferred hour reconcile (2026-07-15)

CAP-3 of the mobile render-perf spec. Review triage patched the confirmed
findings: the drain moved to frame start ahead of the sim advance (a
catch-up frame crossing the next hour re-stacked the deferred repaint with
that hour's scans, found by both Codex and the review layers), meal-overlay
repaints now dodge hour-crossing frames, the crane no longer double-flags
on a lit flip, the boot/tick lighting derivation is one shared helper, and
the module doc states the honest pre-change mechanics (the hour-triggered
reconcile ran the frame AFTER the scans; the true same-frame stack came
through the meal-overlay trigger). Standing defers:

- **Deep catch-up residual:** when every frame crosses an hour (throttled
  top speed), the hourly scans run every frame, so the drain halves the
  sync cadence instead of fully separating the costs. Full separation needs
  the engine-side onHour amortization, the recorded spec non-goal.
- **Sky leads the building by up to two frames at the hour flip:** the sky
  color reads the live clock while room lighting rides the deferred
  reconcile. Cosmetic and transient; lockstep would mean deriving the sky
  from the adopted display hour.
- **`start()` wiring has no test repo-wide** (pre-existing; the boot bake
  is behavior-pinned only through the shared displayLit helper's unit test
  and the deferral tests). A boot-path harness would need a real Excalibur
  engine; revisit if boot regressions ever surface.
- **`setSim` mid-deferral safety rests on `Tower.revision` never equaling
  the -1 reset sentinel** (revision starts at 0 and only increments), which
  guarantees a structural sync that absorbs any stale pending flag. Not
  separately pinned; a future setSim variant that adopts the revision
  directly must clear `hourSyncPending` itself.
- **Tooling gotcha, recorded for the next contributor:** vitest's mock
  hoisting detects the literal text "vi.mock (" even inside comments and
  rewraps the module, which silently broke TowerEngine's FLOOR/TILE
  re-exports in integration tests until the comment was reworded. Do not
  name that API with a following parenthesis in prose inside src modules.

## People-tracking priority ruling (2026-07-15)

### Render-perf S2a: picking via grid lookup (2026-07-15, PR #301 + review-fix PR)

The pointer-path story ahead of region composition. The three review
layers confirmed no patch-mandatory defect in the merged diff; the
follow-up PR carries their actionable notes (two stale collider-hit-test
comments reworded, boundary/basement/out-of-grid/stale-transport/z-tie
pins added to the pick tests, vestigial roomActors/getUnit fixture stubs
swept). Consciously accepted, on the record:

- **Boundary tie-break changed at exact pixel lines.** The old actor
  ray-cast was right-edge-inclusive and left-edge-exclusive; the grid
  cell owns its left edge and top line instead. Measure-zero lines a
  float pointer essentially never hits, and the new mapping agrees with
  the (tile, floor) arguments every consumer already receives, where the
  old pick could disagree on those same pixels. A consistency fix, not a
  regression; now pinned by exact-edge tests.
- **The rush-probe-per-PR spec constraint was met with a reasoned waiver**
  (pointer path runs on input events; an O(rooms) scan became O(1), so a
  probe could only show improvement or noise). Precedent: waivers are
  acceptable for PRs with no frame-loop surface, stated in the PR body.

### Render-perf S2b: region composition (2026-07-15, PR #388)

The CAP-2 story (issue #366). Three review layers ran on the branch; every
patch-graded finding was fixed in the follow-up commit (initial-load queue
waste wired through `drainAllRegions` after the boot bake, demolition drops
made same-frame, animated-room z moved off the garage-car tie to 0.45,
membership recomputed per mark against footprint drift, `regionsOf` range
clamped with corner tests, the visual-spec settle now waits for queue-empty
per region-design I4, banned-vocabulary reword). Consciously deferred, on
the record:

- **Fire-cycle canvas churn in single-member regions (Hunter F3):** ignite
  evicts the region, extinguish re-materializes it, and the killed texture
  lingers until Excalibur's GC interval, so a burn/extinguish cycle briefly
  holds two 352x880 textures. Rare, bounded to one canvas per cycle, and
  keeping evicted regions alive on a grace period would trade away the
  eviction guarantee. Accepted cost.
- **Dead-parking X repaints stagger through the queue (Hunter F4 residual):**
  a ramp demolition orphans many spaces whose dead bits ride the sig into
  queued marks, so the X's appear over a few frames under a busy queue.
  Bounded by the drain budget and invisible outside mass-demolition;
  revisit only with player reports.
- **Pan-into-view rasters are unbounded by the drain budget (Hunter F2):**
  the budget bounds repaint flags; a flagged off-screen region rasters when
  it scrolls into view, so a fast pan after a full-tower flip can raster
  several regions in one frame. Per-unit canvases behaved identically;
  noted in the module header, no action.
- **towerRegions has no unit-test tier (Edge E6):** eviction-on-empty,
  sameFrame coalescing, membership idempotence, deadParking plumbing, and
  visible-first ordering are covered only by the regions e2e plus the CI
  visual gate. A vitest harness needs an Excalibur engine fake; take it up
  if towerRegions grows another feature.
- **Multi-region lifecycle is pixel-unverified (Edge E6):** the metro (12
  column regions) and a 2-story row-straddler never appear in the star-4
  baseline fixture or the regions e2e; basic straddle clipping is inside
  the baselines via the x=34+9k offices. Add a star-5 fixture or a targeted
  spike if a seam report ever comes in.
- **The regions e2e hardcodes budget literal 2 (Auditor note):** importing
  REGION_DRAIN_BUDGET would pull Excalibur into the Playwright node context;
  the literal carries a comment instead. Drift risk accepted.
- **Pinned-renderer baseline re-mint (CI e2e):** the four tower-scene
  baselines moved by ~1,735 px (0.27%) on the pinned Chromium while the
  local venue decodes byte-identical; re-minted on the branch via the
  sanctioned workflow, image diff reviewed as the blessing of the new
  visual truth. Canvas rasterization differing across Chromium builds is
  the documented reason local mints never bind.

### Deferred from: `/gds-code-review` of elevator floor-number overlay (v2.25.1, 2026-08-09)

The fix moved elevator floor numbers out of the baked shaft bitmap (which
garbled under a fractional device-pixel ratio) into a screen-space overlay
renderer (`src/render/excalibur/towerShaftNumbers.ts`). Patch findings were all
fixed in the same change (shared-ctx save/restore, O(floors+cars) car-occlusion
precompute with a `carPositions` guard, an em-dash in a rewritten comment, and a
tightened wiring test). Two findings are deferred:

- **Numbers now paint over sim people standing in the shaft column** (low,
  parity/cosmetic). The overlay is the topmost layer (`z:100`), so where the old
  baked numbers sat under cars (`z:2`) and walkers (`z:3`), a digit can now draw
  over a person waiting inside the shaft footprint. Car occlusion is handled
  (`carPositions`); people are not. Marginal in practice (the digit is centered
  in the shaft; riders in cars are already occluded), but it is a real z-order
  change from the baked path. Fix shape if ever wanted: skip a floor whose
  centered digit overlaps a routed person in that column, or accept it as the
  cost of screen-space text.

- **Per-frame text-op worst case on a wide+tall low-zoom view** (low, perf). The
  renderer runs every frame; the readable-zoom gate (`FLOOR*zoom >= 13`, i.e.
  zoom >= ~0.29) plus the visible-floor-band and horizontal shaft culls bound
  typical cost to a few dozen `strokeText`/`fillText` calls, but a pathological
  view (many distinct shafts across a wide viewport, ~60 floors tall, at the gate
  zoom) could reach ~2,900 text ops per frame. The engine disabled physics
  specifically to keep phones above 2fps, so this is worth watching. Not observed
  as a regression in normal play (few shafts align horizontally at readable
  zoom). Fix shape if it bites: a per-frame text-op cap, a coarser zoom gate, or
  a cached per-shaft number strip.

Also note (not a code defect): the `/gallery` facility catalog draws its elevator
previews via `drawTransport` directly (`src/gallery.ts`), so those thumbnails now
render numberless shafts and `docs/screenshots/**` gallery images will drift.
Regenerate the gallery via the pinned-container drift flow when this ships.

Dismissed with reason: fractional-floor iteration (screenToFloor uses Math.ceil,
always integer); the cy vertical anchor (verified to match the ruler and
explosion painters, `worldToScreenY(floor)` is the floor's top edge); a NaN car
position (carPositions is a required number[] and dispatch never yields NaN);
`new Set(t.skipFloors)` per express shaft per frame (a Set is the correct
structure for a large express skip list, and it is one allocation per express
shaft, not per floor).
