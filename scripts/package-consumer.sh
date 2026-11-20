#!/usr/bin/env sh
# Installs the packed tarball into an empty project the way a game would, with
# its peers, and type-checks one import of every declaration the package
# exports, with skipLibCheck off, under both module resolutions a game may
# use: `bundler` (what a Vite game uses) and `nodenext` (what a project that
# resolves modules the way Node does uses).
#
#   scripts/package-consumer.sh dist/verticopolis-components-<version>.tgz
#
# Excalibur's own declarations do not resolve under nodenext (every relative
# import in them lacks an extension, from excalibur.d.ts's `export * from
# './index'` down), so its namespace reads as empty there and every excalibur
# type in our declarations would fail with it. Before the nodenext check the
# script gives excalibur's declarations in the throwaway project their `.js`
# with scripts/dts-extensions.ts, the same rewrite lib/ gets, so the check
# sees excalibur's real types. Errors reported in excalibur's own files are
# then not counted; an error in any other file, ours included, fails.
# Run from the repository root, after npm ci (it uses the repository's tsc).
set -eu

tarball=$(cd "$(dirname "${1:?usage: scripts/package-consumer.sh <tarball>}")" && pwd)/$(basename "$1")
repo=$(pwd)
tsc="$repo/node_modules/.bin/tsc"
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT

peer() { node -p "require('./package.json').peerDependencies['$1']"; }
engine=$(peer @verticopolis/engine)
excalibur=$(peer excalibur)
lit=$(peer lit-html)
tone=$(peer tone)

cd "$work"
echo '{ "name": "components-consumer", "private": true, "type": "module" }' > package.json
npm install --silent --no-audit --no-fund "$tarball" "@verticopolis/engine@$engine" "excalibur@$excalibur" "lit-html@$lit" "tone@$tone" "@types/node@22"
node "$repo/scripts/package-consumer/entries.mjs"

check() {
  "$tsc" --noEmit --strict --skipLibCheck false --target es2022 --module "$1" --moduleResolution "$2" \
    --lib es2022,dom,dom.iterable,esnext.disposable entries.ts > "tsc-$2.log" 2>&1 || true
}
check esnext bundler
if [ -s tsc-bundler.log ]; then
  cat tsc-bundler.log
  echo "the declarations do not type-check under bundler resolution" >&2
  exit 1
fi
echo "bundler: every entry type-checks"

node "$repo/scripts/dts-extensions.ts" node_modules/excalibur/build/esm
check nodenext nodenext
# The first line of each error names the file it is reported in; tsc indents
# the rest. Only errors reported in excalibur's own files are excused.
own=$(grep -E '^[^ ].*error TS' tsc-nodenext.log | grep -vE '^node_modules/excalibur/' || true)
if [ -n "$own" ]; then
  echo "$own"
  echo "the declarations do not type-check under nodenext resolution" >&2
  exit 1
fi
echo "nodenext: every entry type-checks ($(grep -cE '^node_modules/excalibur/.*error TS' tsc-nodenext.log || true) errors in excalibur's own declarations not counted)"
