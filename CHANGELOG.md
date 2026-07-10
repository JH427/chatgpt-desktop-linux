# Changelog

All notable compatibility-layer changes are documented here.

## Unreleased

### Added

- Native Arch Linux x86_64 runtime assembly for the unified ChatGPT desktop app.
- Strict, fail-closed Electron compatibility patches.
- Official Linux Codex app-server, code-mode host, and ripgrep integration.
- Electron 42 rebuilds for SQLite, PTY, and HID native modules.
- Linux CUA Node, Sharp, and Canvas runtime replacements.
- Linux Computer Use MCP with X11 Sky and Wayland `grim`/`ydotool` backends.
- XDG desktop, MIME, and `codex://` protocol integration.
- Hash-pinned upstream refresh workflow, runtime diagnostics, and smoke checks.
- Public documentation, contribution guidance, security policy, and CI policy checks.

### Known limitations

- Browser automation is unavailable without an OpenAI-compatible Linux `node_repl` host.
- Portal/libei desktop automation, ARM64, and non-Arch packaging remain future work.
