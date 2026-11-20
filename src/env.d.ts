/// <reference types="vite/client" />

/** Build constants a host defines (Vite `define`, or the host's bundler).
 *  The game's own build sets them in its vite.config.ts. */
declare const __APP_VERSION__: string;
/** Short git SHA of the host's build, or "unknown". */
declare const __APP_SHA__: string;
