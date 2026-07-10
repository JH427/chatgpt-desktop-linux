#!/usr/bin/env bash
set -euo pipefail

root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
dmg=${1:-${CHATGPT_DMG:-}}
linux_node=${2:-${CHATGPT_LINUX_NODE:-}}
if [[ -z "$dmg" ]]; then
  echo "usage: $0 <official-ChatGPT.dmg>" >&2
  exit 2
fi

cd "$root"
if [[ -z "$linux_node" ]] && [[ ! -x "$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node" ]]; then
  linux_node=$(scripts/fetch-cua-node.sh)
fi
if [[ -n "$linux_node" ]]; then
  export CHATGPT_LINUX_NODE=$linux_node
fi
npm ci --ignore-scripts
node scripts/install-electron.mjs
node scripts/patch-native-modules.mjs
npx electron-rebuild --version 42.1.0 --force --which-module better-sqlite3,node-pty,node-hid
scripts/extract-dmg.sh "$dmg" .cache/upstream
node scripts/build-runtime.mjs ".cache/upstream/ChatGPT Installer/ChatGPT.app/Contents"
scripts/check-runtime.sh build/runtime
