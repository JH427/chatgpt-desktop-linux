#!/usr/bin/env bash
set -euo pipefail

runtime=${1:-build/runtime}
resources="$runtime/resources"
fail=0

require_elf() {
  local file_path=$1
  if [[ ! -x "$file_path" ]] || ! file -Lb "$file_path" | grep -q '^ELF 64-bit'; then
    echo "FAIL: expected Linux ELF executable: $file_path" >&2
    fail=1
  fi
}

require_elf "$runtime/chatgpt"
require_elf "$resources/codex"
require_elf "$resources/codex-code-mode-host"
require_elf "$resources/rg"
require_elf "$resources/cua_node/bin/node"
require_elf "$resources/plugins/openai-bundled/plugins/computer-use/linux/sky_linux_x64"

if find "$resources" -maxdepth 2 -type f -perm /111 -exec file -b {} \; | grep -q 'Mach-O'; then
  echo "FAIL: a macOS executable remains in the active resource tree" >&2
  fail=1
fi

node_version=$("$resources"/cua_node/bin/node --version)
[[ "$node_version" == v24.14.0 ]] || { echo "FAIL: unexpected CUA Node $node_version" >&2; fail=1; }

if [[ -e "$resources/cua_node/bin/node_repl" ]] && ! file -Lb "$resources/cua_node/bin/node_repl" | grep -q '^ELF 64-bit'; then
  echo "FAIL: node_repl override is not a Linux ELF" >&2
  fail=1
fi

(( fail == 0 ))
echo "Runtime architecture checks passed."
