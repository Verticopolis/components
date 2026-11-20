#!/usr/bin/env sh
# Builds the package into lib/ (`npm run build`): one ES module per source
# module (vite.lib.config.ts), the TypeScript declarations beside them
# (tsconfig.build.json), and the files that ship as written: the stylesheets
# and the declaration-only modules, with `.js` on every relative import in
# the declarations (scripts/dts-extensions.ts). The `./fixtures/*` export
# serves the installed engine's own fixtures, copied in at build time, until
# components 1.0 drops it. Run from the repository root.
set -eu

npx vite build -c vite.lib.config.ts --logLevel warn
npx tsc -p tsconfig.build.json

# Everything under src/ that is neither a TypeScript module nor a test helper
# ships at the same path: *.d.ts, *.css, *.json.
(cd src && find . -type f \( -name '*.d.ts' -o -name '*.css' -o -name '*.json' \) \
  ! -path './tests/*' ! -path './ui/testing/*' ! -name 'env.d.ts') | while read -r f; do
  mkdir -p "lib/$(dirname "$f")"
  cp "src/$f" "lib/$f"
done
# The engine writes these from its Rust catalog; components keeps no copy.
mkdir -p lib/simport/fixtures
cp node_modules/@verticopolis/engine/fixtures/*.json lib/simport/fixtures/

# The declarations import without extensions, as the sources do; give each
# relative import its .js so nodenext resolution follows them too.
node scripts/dts-extensions.ts lib
echo "Built lib/ ($(find lib -name '*.js' | wc -l | tr -d ' ') modules)."
