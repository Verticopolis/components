#!/usr/bin/env sh
# Installs a packed @verticopolis/components tarball into an empty project
# with only its peers and checks that every module it serves loads there:
#
#   scripts/node-consumer.sh dist/verticopolis-components-<version>.tgz
#
# - npm installs the tarball with its peers (Excalibur, lit-html, Tone) at the
#   versions this checkout's lockfile resolved, and nothing else.
# - scripts/node-consumer.mjs imports every module the exports map serves
#   under Node, with happy-dom standing in for the browser, so a module that
#   needs a package the components don't declare fails to resolve.
# - A file that imports every declaration type-checks against the shipped
#   .d.ts files with skipLibCheck off.
#
# Run from the repository root after npm ci.
set -eu

tarball=$(cd "$(dirname "${1:?usage: scripts/node-consumer.sh TARBALL}")" && pwd)/$(basename "$1")
root=$(pwd)
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT

ver() { node -p "require('$root/node_modules/$1/package.json').version"; }

cd "$work"
printf '{ "name": "components-consumer", "private": true, "type": "module" }\n' > package.json
npm install --silent --no-audit --no-fund "$tarball" \
  "excalibur@$(ver excalibur)" "lit-html@$(ver lit-html)" "tone@$(ver tone)" \
  "happy-dom@$(ver happy-dom)" "typescript@$(ver typescript)"

cp "$root/scripts/node-consumer.mjs" .
node node-consumer.mjs
npx tsc --noEmit --strict --skipLibCheck false --module esnext --moduleResolution bundler \
  --target es2022 --lib es2022,dom,dom.iterable consumer.ts
echo "The declarations type-check with only the peers installed."
