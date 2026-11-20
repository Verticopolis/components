import { readdirSync } from "node:fs";
import { join, relative } from "node:path";
import ts from "typescript";
import { defineConfig, type Plugin } from "vite";

// The package build (`npm run build`): every source module compiled to one
// ES module in lib/, at the same path, so a game's bundler drops whatever it
// does not import, the way it would with the sources. Nothing is bundled
// together and nothing is minified. Every bare import (the engine, Excalibur,
// lit-html, Tone, fflate, Node's own modules) stays an import for the game to
// resolve. The build constants (`__APP_VERSION__` and the rest, src/env.d.ts)
// and `import.meta.env` stay as written: the game's bundler defines them.
// scripts/build-lib.sh runs this, then writes the declarations and copies the
// stylesheets, the fixtures and the declaration-only modules beside it.
const SRC = "src";
const SKIP = /\.(test|fixture|integration\.test)\.ts$|\.d\.ts$/;
const SKIP_DIRS = new Set(["tests", "testing"]);

function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const path = join(dir, e.name);
    if (e.isDirectory()) return SKIP_DIRS.has(e.name) ? [] : sources(path);
    return e.name.endsWith(".ts") && !SKIP.test(e.name) ? [path] : [];
  });
}

/**
 * Keeps `import.meta.env` for the game's bundler. Vite's library mode bakes
 * it in (`import.meta.env.DEV` becomes `false`, `BASE_URL` becomes `"/"`),
 * which would fix the game's dev checks and its base path for good, so each
 * use is swapped for a stand-in as a module is compiled (see
 * {@link transpileKeepingComments}, after TypeScript has dropped any `as`
 * cast between `import.meta` and `.env`) and swapped back in the written
 * modules.
 */
const ENV_STAND_IN = "__VC_IMPORTENV_"; // as long as `import.meta.env`, so columns and source maps hold
function keepImportMetaEnv(): Plugin {
  return {
    name: "keep-import-meta-env",
    renderChunk(code) {
      return code.includes(ENV_STAND_IN) ? { code: code.replaceAll(ENV_STAND_IN, "import.meta.env"), map: null } : null;
    },
  };
}

/**
 * Compiles each module with TypeScript itself in place of esbuild, which
 * drops every comment but a legal one. The shipped modules keep their
 * comments: the doc comments a reader of `lib/` follows, and the provenance
 * and license header of vendored content (`ui/iconPaths.generated.ts`
 * carries pixelarticons' MIT notice), which every copy must keep.
 */
function transpileKeepingComments(): Plugin {
  // tsconfig.json's own options, so class fields, the target and the rest
  // compile the way the game's bundler compiled the sources before.
  const config = ts.getParsedCommandLineOfConfigFile(
    "tsconfig.json",
    {},
    {
      ...ts.sys,
      onUnRecoverableConfigFileDiagnostic: (d) => {
        throw new Error(ts.flattenDiagnosticMessageText(d.messageText, "\n"));
      },
    },
  );
  if (!config) throw new Error("tsconfig.json did not parse");
  const compilerOptions: ts.CompilerOptions = {
    ...config.options,
    noEmit: false,
    declaration: false,
    module: ts.ModuleKind.ESNext,
    sourceMap: true,
    inlineSources: true,
    removeComments: false,
  };
  return {
    name: "transpile-keeping-comments",
    enforce: "pre",
    transform(code, id) {
      if (!id.endsWith(".ts")) return null;
      const out = ts.transpileModule(code, { fileName: id, compilerOptions });
      const js = out.outputText.replace(/\n\/\/# sourceMappingURL=.*$/, "").replaceAll("import.meta.env", ENV_STAND_IN);
      return { code: js, map: out.sourceMapText ?? null };
    },
  };
}

const entries = Object.fromEntries(sources(SRC).map((f) => [relative(SRC, f).replace(/\.ts$/, ""), f]));

export default defineConfig({
  plugins: [keepImportMetaEnv(), transpileKeepingComments()],
  esbuild: false,
  publicDir: false,
  build: {
    outDir: "lib",
    emptyOutDir: true,
    target: "es2022",
    minify: false,
    sourcemap: true,
    copyPublicDir: false,
    lib: { entry: entries, formats: ["es"] },
    rollupOptions: {
      // Bare specifiers are dependencies; relative and absolute paths are ours.
      external: (id) =>
        !id.startsWith(".") && !id.startsWith("/") && !/^[A-Za-z]:[\\/]/.test(id) && !id.startsWith("\0"),
      output: {
        preserveModules: true,
        preserveModulesRoot: SRC,
        entryFileNames: "[name].js",
      },
      treeshake: false,
    },
  },
});
