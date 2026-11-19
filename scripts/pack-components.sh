#!/usr/bin/env sh
# Packs @verticopolis/components into the tarball a release carries, with its
# SHA-256 checksum beside it, in OUT (default dist/):
#
#   scripts/pack-components.sh VERSION [OUT]
#
# VERSION is written into the packed package.json only, so a pull request's
# or main's test build never touches the committed version, which only a
# release PR raises. The tarball holds lib/, the compiled JavaScript and types
# that npm pack's prepack script builds (scripts/build-lib.sh), and leaves
# out the TypeScript sources and tests. Run from the repository root.
set -eu

version=${1:?usage: scripts/pack-components.sh VERSION [OUT]}
out=${2:-dist}
mkdir -p "$out"
out=$(cd "$out" && pwd)

stage=$(mktemp -d)
trap 'rm -rf "$stage"' EXIT

# Pack from a copy, so the version the tarball carries never touches the
# committed package.json.
npm pack --silent --pack-destination "$stage" > /dev/null
tar -xzf "$stage"/verticopolis-components-*.tgz -C "$stage"
node -e '
  const fs = require("node:fs");
  const [file, version] = process.argv.slice(1);
  const pkg = JSON.parse(fs.readFileSync(file, "utf8"));
  pkg.version = version;
  delete pkg.scripts;
  delete pkg.devDependencies;
  fs.writeFileSync(file, JSON.stringify(pkg, null, 2) + "\n");
' "$stage/package/package.json" "$version"

name="verticopolis-components-$version.tgz"
# npm pack again, not tar, so the same tree gives the same bytes every time
# (npm fixes the entries' times and owners). The staged package.json has no
# scripts left, so no lifecycle script runs.
(cd "$stage/package" && npm pack --silent --pack-destination "$out" > /dev/null)
test -f "$out/$name"
(cd "$out" && sha256sum "$name" > "$name.sha256")
echo "$out/$name"
