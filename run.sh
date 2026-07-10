#!/usr/bin/env bash
set -euo pipefail

root=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
export ELECTRON_OZONE_PLATFORM_HINT=${ELECTRON_OZONE_PLATFORM_HINT:-auto}
export ELECTRON_ENABLE_LOGGING=${ELECTRON_ENABLE_LOGGING:-1}
export CODEX_ELECTRON_ENABLE_LINUX_COMPUTER_USE=${CODEX_ELECTRON_ENABLE_LINUX_COMPUTER_USE:-1}
exec "$root/build/runtime/chatgpt" "$@"
