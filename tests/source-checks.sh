#!/usr/bin/env bash
set -euo pipefail

root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$root"

bash -n run.sh scripts/*.sh packaging/chatgpt-linux tests/*.sh
for source in scripts/*.mjs integrations/computer-use/*.mjs; do
  node --check "$source"
done
desktop-file-validate packaging/chatgpt-linux.desktop
shellcheck -x run.sh scripts/*.sh packaging/chatgpt-linux tests/*.sh
tests/repository-policy.sh
echo 'Source checks passed.'
