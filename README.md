# ChatGPT Desktop for Linux

[![CI](https://github.com/JH427/chatgpt-desktop-linux/actions/workflows/ci.yml/badge.svg)](https://github.com/JH427/chatgpt-desktop-linux/actions/workflows/ci.yml)
[![Secret scan](https://github.com/JH427/chatgpt-desktop-linux/actions/workflows/secret-scan.yml/badge.svg)](https://github.com/JH427/chatgpt-desktop-linux/actions/workflows/secret-scan.yml)
[![License: MIT](https://img.shields.io/badge/compatibility_layer-MIT-blue.svg)](LICENSE)
[![Platform: Arch Linux](https://img.shields.io/badge/platform-Arch%20Linux-1793d1.svg)](docs/COMPATIBILITY.md)

An unofficial, source-auditable Linux compatibility layer and Arch Linux package for OpenAI's unified ChatGPT desktop application.

This project does **not** redistribute ChatGPT, Codex, OpenAI credentials, or extracted proprietary assets. Each user downloads the official application from OpenAI and builds the Linux runtime locally. The build applies narrow, version-checked compatibility patches and replaces active macOS binaries with Linux implementations.

> [!IMPORTANT]
> This project is community-maintained, experimental, and not affiliated with or endorsed by OpenAI. OpenAI, ChatGPT, and Codex are trademarks of OpenAI. The upstream application remains proprietary and is subject to OpenAI's terms.

## Current status

The pinned release is ChatGPT `26.707.31428` (build `5059`). Native Wayland startup, the complete application renderer, Codex app-server, account state, Git/worktrees, terminal sessions, local persistence, OpenAI's primary Linux document runtime, and the Linux Computer Use plugin have been validated on Arch Linux x86_64 with Hyprland.

| Area | Implementation | Status |
|---|---|---|
| Desktop GUI | Electron 42 with Ozone | Working on native Wayland and X11 |
| Codex agent | Official Linux Codex app-server and helpers | Working |
| Terminal and database | Rebuilt `node-pty` and `better-sqlite3` | Working |
| Authentication and secrets | `codex://` callback and libsecret | Working |
| Files, audio, notifications | GTK, XDG portals, PipeWire | Working |
| Documents, spreadsheets, slides | Official OpenAI Linux primary runtime | Working |
| X11 desktop automation | OpenAI's bundled Linux Sky helper | Working |
| Wayland screenshots | `grim` backend | Working on wlroots compositors |
| Wayland input | Explicitly authorized `ydotoold` backend | Optional |
| Chrome/in-app browser automation | Requires OpenAI's private `node_repl` host | Blocked upstream on Linux |
| Appshots and macOS overlays | No Linux equivalent yet | Not implemented |

See the complete [compatibility matrix](docs/COMPATIBILITY.md) before installing. “The GUI runs” does not imply universal feature parity across every distribution, compositor, and architecture.

## Quick start — Arch Linux

### Requirements

- Arch Linux or a close derivative on x86_64
- A graphical Wayland or X11 session
- Approximately 5 GB of temporary disk space
- The official `ChatGPT.dmg` downloaded from [chatgpt.com/download](https://chatgpt.com/download/)

Install the build dependencies:

```bash
sudo pacman -S --needed base-devel nodejs npm python unzip 7zip libsecret \
  pipewire xdg-desktop-portal
```

Clone and build:

```bash
git clone https://github.com/JH427/chatgpt-desktop-linux.git
cd chatgpt-desktop-linux
cp ~/Downloads/ChatGPT.dmg .
makepkg -si
```

Launch from your application menu or run:

```bash
chatgpt-linux
```

The DMG and generated package are ignored by Git. Do not add either with `git add --force`.

## Development build

To build and run without installing a system package:

```bash
scripts/build.sh ~/Downloads/ChatGPT.dmg
./run.sh
```

The build fetches and verifies Node.js `24.14.0` when OpenAI's matching primary runtime is not already cached. Run the desktop integration diagnostic with:

```bash
scripts/doctor.sh
```

More detail is available in [Building](docs/BUILDING.md) and [Troubleshooting](docs/TROUBLESHOOTING.md).

## How it works

```text
Official ChatGPT.dmg supplied by the user
                  │
                  ▼
          validated local extraction
                  │
          ┌───────┴────────┐
          ▼                ▼
 strict Electron       Linux runtime
 compatibility         replacements
 patches               and native addons
          └───────┬────────┘
                  ▼
       generated local Linux runtime
                  │
                  ▼
       Arch package under /opt/chatgpt-linux
```

The upstream patcher uses exact-match counts and stops when a new release changes the expected code. Runtime validation rejects active Mach-O executables and checks Linux architectures before packaging. See [Architecture](docs/ARCHITECTURE.md) and the [Security model](docs/SECURITY-MODEL.md).

## Updating the upstream application

Updates are deliberately reviewable rather than automatic:

```bash
scripts/refresh-upstream.sh
scripts/build.sh ./ChatGPT.dmg
git diff -- upstream-lock.json PKGBUILD package-lock.json
npm run check
```

Never commit the downloaded DMG, extracted ASAR, generated runtime, cached OpenAI runtime, authentication state, or build package. See [Maintainer update procedure](docs/MAINTAINING.md).

## Project scope

This repository currently targets Arch Linux x86_64. Contributions for portal/libei automation, GNOME/KDE integration, ARM64, Debian, Fedora, Flatpak, or Nix are welcome when they preserve the source-auditable and no-redistribution model.

Before contributing, read [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md), and the [Code of Conduct](CODE_OF_CONDUCT.md).

## License and legal notice

Original compatibility-layer code in this repository is available under the [MIT License](LICENSE). That license does not apply to OpenAI's application, trademarks, services, or proprietary assets. Users are responsible for obtaining the upstream application legitimately and complying with all applicable terms and laws. See [NOTICE.md](NOTICE.md) for trademark and upstream-asset notices.
