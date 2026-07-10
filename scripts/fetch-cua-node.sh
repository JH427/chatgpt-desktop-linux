#!/usr/bin/env bash
set -euo pipefail

root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
version=24.14.0
sha=41cd79bb7877c81605a9e68ec4c91547774f46a40c67a17e34d7179ef11729df
cache="$root/.cache/cua-node"
archive="$cache/node-v$version-linux-x64.tar.xz"
node="$cache/node-v$version-linux-x64/bin/node"

if [[ ! -x "$node" ]]; then
  mkdir -p "$cache"
  curl --fail --location --proto '=https' --tlsv1.2 \
    --output "$archive" "https://nodejs.org/dist/v$version/node-v$version-linux-x64.tar.xz"
  echo "$sha  $archive" | sha256sum --check --status
  tar -xJf "$archive" -C "$cache"
fi
[[ $($node --version) == "v$version" ]]
printf '%s\n' "$node"
