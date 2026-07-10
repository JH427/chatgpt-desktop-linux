#!/usr/bin/env bash
set -euo pipefail

root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
url=$(node -p "require('$root/upstream-lock.json').source")
destination=${1:-"$root/ChatGPT.dmg"}
temporary=$(mktemp --suffix=.dmg)
trap 'rm -f "$temporary"' EXIT

curl --fail --location --proto '=https' --tlsv1.2 --output "$temporary" "$url"
sha=$(sha256sum "$temporary" | cut -d ' ' -f1)
"$root/scripts/extract-dmg.sh" "$temporary" "$root/.cache/upstream-refresh"
plist="$root/.cache/upstream-refresh/ChatGPT Installer/ChatGPT.app/Contents/Info.plist"
version=$(sed -n '/<key>CFBundleShortVersionString<\/key>/{n;s:.*<string>\(.*\)</string>.*:\1:p;q}' "$plist")
build=$(sed -n '/<key>CFBundleVersion<\/key>/{n;s:.*<string>\(.*\)</string>.*:\1:p;q}' "$plist")
[[ -n "$version" && -n "$build" ]] || { echo "could not read upstream version" >&2; exit 1; }

node - "$root" "$version" "$build" "$sha" <<'NODE'
const fs = require("node:fs");
const path = require("node:path");
const [root, version, build, sha] = process.argv.slice(2);
const lockPath = path.join(root, "upstream-lock.json");
const lock = JSON.parse(fs.readFileSync(lockPath, "utf8"));
Object.assign(lock, { version, build, sha256: sha, checkedAt: new Date().toISOString() });
fs.writeFileSync(lockPath, JSON.stringify(lock, null, 2) + "\n");
const pkgbuildPath = path.join(root, "PKGBUILD");
let pkgbuild = fs.readFileSync(pkgbuildPath, "utf8");
pkgbuild = pkgbuild.replace(/^pkgver=.*$/m, `pkgver=${version}`);
pkgbuild = pkgbuild.replace(/sha256sums=\('[a-f0-9]{64}'/, `sha256sums=('${sha}'`);
fs.writeFileSync(pkgbuildPath, pkgbuild);
NODE

mv "$temporary" "$destination"
trap - EXIT
echo "Pinned ChatGPT $version ($build), sha256=$sha"
echo "Run scripts/build.sh '$destination', then review compatibility changes before packaging."
