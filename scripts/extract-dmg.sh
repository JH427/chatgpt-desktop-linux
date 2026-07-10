#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 2 ]]; then
  echo "usage: $0 <ChatGPT.dmg> <output-directory>" >&2
  exit 2
fi

dmg=$(realpath "$1")
output=$(realpath -m "$2")
project_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)

if command -v 7z >/dev/null 2>&1; then
  seven_zip=$(command -v 7z)
elif [[ -x "$project_root/.tools/7zip/usr/lib/7zip/7z" ]]; then
  seven_zip="$project_root/.tools/7zip/usr/lib/7zip/7z"
else
  echo "7z is required (Arch package: 7zip)" >&2
  exit 1
fi

rm -rf "$output"
mkdir -p "$output"
set +e
"$seven_zip" x -y "-o$output" "$dmg" 'ChatGPT Installer/ChatGPT.app/Contents/*'
extract_status=$?
set -e

# 7-Zip 26 refuses relative npm .bin symlinks as "dangerous" and reports 2.
# None is used by this port. Accept that status only after validating every
# payload required by the assembler; all other statuses remain fatal.
if (( extract_status != 0 && extract_status != 2 )); then
  echo "7z extraction failed with status $extract_status" >&2
  exit "$extract_status"
fi

test -f "$output/ChatGPT Installer/ChatGPT.app/Contents/Resources/app.asar"
test -f "$output/ChatGPT Installer/ChatGPT.app/Contents/Resources/cua_node/manifest.json"
test -x "$output/ChatGPT Installer/ChatGPT.app/Contents/Resources/cua_node/lib/node_modules/@oai/sky/bin/linux/sky_linux_x64"
test -f "$output/ChatGPT Installer/ChatGPT.app/Contents/Resources/plugins/openai-bundled/.agents/plugins/marketplace.json"
if (( extract_status == 2 )); then
  echo "Accepted 7z status 2 after validating required payloads (npm .bin symlinks were skipped)." >&2
fi
