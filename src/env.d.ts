/// <reference types="vite/client" />

/** Build constants a host defines (Vite `define`, or the host's bundler).
 *  The game's own build sets them in its vite.config.ts. */
declare const __APP_VERSION__: string;
/** Short git SHA of the host's build, or "unknown". */
declare const __APP_SHA__: string;
/** True when the engine the host serves is the tooling package, with the
 *  binding's tier 3 ops. */
declare const __TOOLING_ENGINE__: boolean;
/** The engine package the host was built with (see
 *  src/wasmhost/enginePackageRecord.ts), or null. */
declare const __ENGINE_PACKAGE__: import("./wasmhost/enginePackageRecord").ExpectedEnginePackage | null;
