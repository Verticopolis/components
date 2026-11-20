// The deprecated modules that re-export @verticopolis/engine until components
// 1.0 removes them (engine#89, step 2). They are the only modules that may
// reach the engine; everything else reads the render model
// (src/render/renderModel.ts). eslint.config.js and scripts/engine-free.ts
// both read this list.

/** Folders under src/ (and lib/) whose every module is a shim. */
export const SHIM_FOLDERS = ["catalog", "engineBinding", "events", "simport", "wasmhost"];

/** Shim modules in src/model/, which also holds modules of components' own. */
export const SHIM_MODELS = ["types", "engineTypes", "unitState", "viewZoom", "floorRuns", "serializedGame"];
