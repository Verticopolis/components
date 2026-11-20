#!/usr/bin/env sh
# Installs a packed @verticopolis/components tarball into an empty project
# WITHOUT the engine and checks that everything outside the deprecated shims
# (scripts/engineShims.mjs) works there:
#
#   scripts/engine-free-consumer.sh dist/verticopolis-components-<version>.tgz
#
# - npm installs the tarball with its required peers (Excalibur, lit-html,
#   Tone) at the versions this checkout's lockfile resolved, and leaves out
#   the engine, an optional peer only the shims need.
# - scripts/engine-free-consumer.mjs imports every non-shim module the exports
#   map serves under Node, with happy-dom standing in for the browser, so a
#   module that reaches the engine fails to resolve.
# - A file that imports every non-shim declaration type-checks against the
#   shipped .d.ts files with skipLibCheck off, so a declaration that names an
#   engine type fails too.
#
# Run from the repository root after npm ci.
set -eu

tarball=$(cd "$(dirname "${1:?usage: scripts/engine-free-consumer.sh TARBALL}")" && pwd)/$(basename "$1")
root=$(pwd)
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT

ver() { node -p "require('$root/node_modules/$1/package.json').version"; }

cd "$work"
printf '{ "name": "components-consumer", "private": true, "type": "module" }\n' > package.json
npm install --silent --no-audit --no-fund "$tarball" \
  "excalibur@$(ver excalibur)" "lit-html@$(ver lit-html)" "tone@$(ver tone)" \
  "happy-dom@$(ver happy-dom)" "typescript@$(ver typescript)"
if [ -e node_modules/@verticopolis/engine ]; then
  echo "::error::npm installed @verticopolis/engine, which must stay an optional peer" >&2
  exit 1
fi

cp "$root/scripts/engine-free-consumer.mjs" "$root/scripts/engineShims.mjs" .
node engine-free-consumer.mjs
npx tsc --noEmit --strict --skipLibCheck false --module esnext --moduleResolution bundler \
  --target es2022 --lib es2022,dom,dom.iterable consumer.ts
echo "The declarations type-check without the engine."
