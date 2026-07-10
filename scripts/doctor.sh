#!/usr/bin/env bash
set -u

status=0
check_command() {
  local name=$1 description=$2
  if command -v "$name" >/dev/null 2>&1; then
    printf 'ok   %-24s %s\n' "$name" "$description"
  else
    printf 'miss %-24s %s\n' "$name" "$description"
    return 1
  fi
}

printf 'Session: type=%s desktop=%s wayland=%s display=%s\n' \
  "${XDG_SESSION_TYPE:-unknown}" "${XDG_CURRENT_DESKTOP:-unknown}" \
  "${WAYLAND_DISPLAY:-none}" "${DISPLAY:-none}"

check_command xdg-open 'links and browser authentication' || status=1
check_command git 'Codex repositories and worktrees' || status=1
check_command secret-tool 'libsecret credential-store diagnostics' || true
check_command grim 'Wayland screenshots' || true
check_command ydotool 'Wayland input automation (also requires ydotoold)' || true
check_command wl-copy 'Wayland clipboard' || true

if busctl --user --no-pager status org.freedesktop.portal.Desktop >/dev/null 2>&1; then
  printf 'ok   %-24s %s\n' 'desktop portal' 'file picker, screen cast, URI integration'
else
  printf 'miss %-24s %s\n' 'desktop portal' 'install/start a portal backend for your compositor'
  status=1
fi

if [[ -n ${WAYLAND_DISPLAY:-} ]] && command -v ydotool >/dev/null 2>&1; then
  if ydotool debug >/dev/null 2>&1; then
    printf 'ok   %-24s %s\n' 'ydotoold' 'Wayland input socket is reachable'
  else
    printf 'miss %-24s %s\n' 'ydotoold' 'daemon/socket or /dev/uinput permission is not ready'
  fi
fi

if [[ -x build/runtime/chatgpt ]]; then
  scripts/check-runtime.sh build/runtime || status=1
else
  printf 'info %-24s %s\n' 'runtime' 'not built in this checkout'
fi

exit "$status"
