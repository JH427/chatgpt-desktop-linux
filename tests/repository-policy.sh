#!/usr/bin/env bash
set -euo pipefail

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo 'repository-policy.sh must run inside a Git worktree' >&2
  exit 1
fi

failure=0
for script in run.sh scripts/*.sh packaging/chatgpt-linux tests/*.sh; do
  if [[ ! -x "$script" ]]; then
    echo "launcher or shell script is not executable: $script" >&2
    failure=1
  fi
done

while IFS= read -r -d '' path; do
  case "$path" in
    *.dmg|*.AppImage|*.pkg.tar.zst|*.asar|*.node|*.so|*.dylib|*.exe|*.dll|build/*|.cache/*|.tools/*|node_modules/*)
      echo "forbidden generated, binary, or proprietary path: $path" >&2
      failure=1
      ;;
  esac
  if [[ -f "$path" ]] && (( $(stat -c %s "$path") > 10485760 )); then
    echo "tracked file exceeds 10 MiB: $path" >&2
    failure=1
  fi
done < <(git ls-files -z)

if git grep -En '/home/[^/[:space:]]+|/Users/[^/[:space:]]+|BEGIN (RSA|OPENSSH|EC|DSA|PGP) PRIVATE KEY' -- . \
  ':(exclude)tests/repository-policy.sh'; then
  echo 'machine-specific path or private-key marker found' >&2
  failure=1
fi

if git grep -En 'gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9_-]{20,}|AKIA[0-9A-Z]{16}' -- . \
  ':(exclude)tests/repository-policy.sh'; then
  echo 'possible credential token found' >&2
  failure=1
fi

(( failure == 0 ))
echo 'Repository policy checks passed.'
