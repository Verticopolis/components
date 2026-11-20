/** Folders under src/ (and lib/) whose every module is a deprecated engine
 *  shim (`engineShims.mjs`). */
export const SHIM_FOLDERS: readonly string[];

/** Shim modules in src/model/, which also holds modules of components' own. */
export const SHIM_MODELS: readonly string[];
