#!/usr/bin/env sh
# Builds the package into lib/ (`npm run build`): one ES module per source
# module (vite.lib.config.ts), the TypeScript declarations beside them
# (tsconfig.build.json), and the files that ship as written: the stylesheets
# and the declaration-only modules, with `.js` on every relative import in
# the declarations (scripts/dts-extensions.ts), and the skyline image
# (scripts/gen-splash-skyline.ts). Run from the repository root.
set -eu

npx vite build -c vite.lib.config.ts --logLevel warn
npx tsc -p tsconfig.build.json

# Everything under src/ that is neither a TypeScript module nor a test helper
# ships at the same path: *.d.ts, *.css, *.json, and the Astro components a
# docs site builds with (src/astro/*.astro).
(cd src && find . -type f \( -name '*.d.ts' -o -name '*.css' -o -name '*.json' -o -name '*.astro' \) \
  ! -path './tests/*' ! -path './ui/testing/*' ! -name 'env.d.ts') | while read -r f; do
  mkdir -p "lib/$(dirname "$f")"
  cp "src/$f" "lib/$f"
done
# The declarations import without extensions, as the sources do; give each
# relative import its .js so nodenext resolution follows them too.
node scripts/dts-extensions.ts lib
# The title screen's skyline as an image, beside the stylesheet that tiles it.
node scripts/gen-splash-skyline.ts lib/styles
echo "Built lib/ ($(find lib -name '*.js' | wc -l | tr -d ' ') modules)."
