import { isOperational, isPresent } from "@verticopolis/engine/model/unitState";
import { VIEW_ZOOM_MAX, VIEW_ZOOM_MIN } from "@verticopolis/engine/model/viewZoom";
import { catalogFor } from "./catalogFixture";
import { useFallbackSource } from "../render/towerSource";
import { bindViewWorld } from "../presentation/viewWorld";
import { bindViewKinds } from "../presentation/viewKinds";

// Unit and integration tests draw, place and lay out without a running scene,
// so the view is bound to the Modern catalog's world up front, the same world
// the game binds from the tower's catalog when it builds the scene (#921). The
// catalogs are the Rust engine's (the engine package's testing/catalogFixture).
bindViewWorld(catalogFor("modern").world);
bindViewKinds(catalogFor("modern"));

// A tower a test builds by hand has no app to set its source, so it reads the
// engine's catalog from the fixture and the engine's rules, the way an app
// composes them. One that names no mode reads Classic's, the rules a mode-less
// tower ran on before.
useFallbackSource({
  catalog: (mode) => catalogFor(mode ?? "classic"),
  rules: { isPresent, isOperational, viewZoom: { min: VIEW_ZOOM_MIN, max: VIEW_ZOOM_MAX } },
});
