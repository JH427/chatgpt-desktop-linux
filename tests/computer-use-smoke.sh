#!/usr/bin/env bash
set -euo pipefail

root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
adapter=${1:-"$root/build/runtime/resources/plugins/openai-bundled/plugins/computer-use/linux/sky-mcp.mjs"}
output=$(mktemp)
trap 'rm -f "$output"' EXIT

{
  printf '%s\n' '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26"}}'
  printf '%s\n' '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}'
  if [[ ${2:-} == --screenshot ]]; then
    printf '%s\n' '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"computer_screenshot","arguments":{}}}'
  fi
} | node "$adapter" >"$output"

grep -q '"id":1,"result"' "$output"
grep -q '"id":2,"result"' "$output"
[[ $(grep -o '"name":"computer_' "$output" | wc -l) -eq 7 ]]
if [[ ${2:-} == --screenshot ]]; then
  grep -Eq '"id":3,"result":\{"content":\[\{"type":"image","data":".{1000}' "$output"
fi
echo 'Computer-use MCP smoke passed (7 tools).'
