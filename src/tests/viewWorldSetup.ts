import { catalogFor } from "./catalogFixture";
import { testRules } from "./renderRules";
import { useFallbackSource } from "../render/towerSource";
import { bindViewWorld } from "../presentation/viewWorld";
import { bindViewKinds } from "../presentation/viewKinds";

// Unit and integration tests draw, place and lay out without a running scene,
// so the view is bound to the hand-written Modern render catalog up front, the
// way a game binds its tower's catalog when it builds the scene.
bindViewWorld(catalogFor("modern").world);
bindViewKinds(catalogFor("modern"));

// A tower a test builds by hand has no app to set its source, so it reads the
// test catalogs and rules. One that names no mode reads Classic's.
useFallbackSource({
  catalog: (mode) => catalogFor(mode ?? "classic"),
  rules: testRules,
});
