# Architecture

## Design goals

The port is designed around four constraints:

1. Do not redistribute OpenAI's proprietary application.
2. Keep Linux-specific code readable and reviewable.
3. Fail closed when an upstream release changes patched code.
4. Preserve upstream security boundaries instead of bypassing them for feature parity.

## Build pipeline

### 1. Acquire and verify upstream inputs

The user supplies the official `ChatGPT.dmg`. `upstream-lock.json` and `PKGBUILD` pin its expected version, build number, URL, and SHA-256. Node.js is downloaded from the official Node.js distribution and independently pinned.

### 2. Extract locally

`scripts/extract-dmg.sh` extracts the application without mounting the image. Current 7-Zip releases reject several relative npm `.bin` links. The extractor accepts that specific status only after validating all payloads required by the assembler.

### 3. Apply narrow compatibility patches

`scripts/patch-upstream.mjs` enables Linux startup and the Linux Computer Use descriptor. Every minified-code transformation must match an exact expected count. A changed upstream bundle therefore stops the build for human review.

### 4. Replace platform components

`scripts/build-runtime.mjs` assembles a Linux Electron runtime and replaces active platform components:

| Upstream component | Linux replacement |
|---|---|
| Electron macOS framework | Pinned Electron Linux x86_64 distribution |
| Codex and code-mode host | Official `codex-linux-x64` vendor binaries |
| ripgrep | Official Codex Linux vendor binary |
| `better-sqlite3` | Rebuilt for Electron ABI 146 |
| `node-pty` | Rebuilt for Electron ABI 146 |
| `node-hid` | Rebuilt for Electron ABI 146 |
| CUA Node | Verified Node.js 24.14.0 Linux binary |
| Sharp/canvas native addons | Pinned Linux x86_64 packages |
| Computer Use on X11 | OpenAI Sky Linux x64 helper |
| Computer Use on Wayland | Reviewable `grim`/`ydotool` MCP adapter |
| Sparkle and LaunchServices | Removed; handled by package tooling and XDG registration |

### 5. Validate

`scripts/check-runtime.sh` checks required ELF binaries, the CUA Node version, and remaining active Mach-O files. `tests/computer-use-smoke.sh` verifies the Linux MCP protocol and tool inventory.

### 6. Package

The Arch package installs the runtime under `/opt/chatgpt-linux`, a launcher under `/usr/bin`, and an XDG desktop entry with the `codex://` protocol and supported MIME types.

## Runtime boundaries

The Electron renderer and most main-process logic are portable. Platform boundaries are isolated to native addons, executable helpers, desktop registration, privileged screen/input access, and the update mechanism.

OpenAI's private `node_repl` binary is a distinct boundary. The macOS build cannot execute on Linux, and this project does not replace it with an unsandboxed JavaScript evaluator. Browser automation remains unavailable until a compatible, auditable host exists.
