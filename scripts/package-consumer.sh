#!/usr/bin/env sh
# Installs the packed tarball into an empty project the way a game would, with
# its peers, and type-checks one import of every declaration the package
# exports, with skipLibCheck off, under both module resolutions a game may
# use: `bundler` (what a Vite game uses) and `nodenext` (what a project that
# resolves modules the way Node does uses).
#
#   scripts/package-consumer.sh dist/verticopolis-components-<version>.tgz
#
# Under nodenext, excalibur's own declarations do not resolve (its
# excalibur.d.ts re-exports './index' without an extension), so its namespace
# reads as empty there. Those errors, which name excalibur's files, are
# excalibur's to fix and are reported but not counted; any other error fails.
# Run from the repository root, after npm ci (it uses the repository's tsc).
set -eu

tarball=$(cd "$(dirname "${1:?usage: scripts/package-consumer.sh <tarball>}")" && pwd)/$(basename "$1")
repo=$(pwd)
tsc="$repo/node_modules/.bin/tsc"
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT

peer() { node -p "require('./package.json').peerDependencies['$1']"; }
engine=$(node -p "require('./package.json').devDependencies['@verticopolis/engine']")
excalibur=$(peer excalibur)
lit=$(peer lit-html)
tone=$(peer tone)

cd "$work"
echo '{ "name": "components-consumer", "private": true, "type": "module" }' > package.json
npm install --silent --no-audit --no-fund "$tarball" "$engine" "excalibur@$excalibur" "lit-html@$lit" "tone@$tone" "@types/node@22"
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

check nodenext nodenext
# Keep only the first line of each error (tsc indents the rest).
own=$(grep -E '^[^ ].*error TS' tsc-nodenext.log | grep -v 'node_modules/excalibur/' || true)
if [ -n "$own" ]; then
  echo "$own"
  echo "the declarations do not type-check under nodenext resolution" >&2
  exit 1
fi
echo "nodenext: every entry type-checks ($(grep -c 'error TS' tsc-nodenext.log || true) errors from excalibur's own declarations not counted)"
