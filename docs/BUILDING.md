# Building

## Supported build host

The maintained build host is Arch Linux x86_64 with glibc. Other distributions may be able to run the assembled runtime, but the supplied package recipe and dependency names are Arch-specific.

## Inputs

- Official `ChatGPT.dmg` matching `upstream-lock.json`
- Node.js and npm for build orchestration
- C/C++ toolchain for Electron native addons
- 7-Zip and unzip
- Internet access for pinned npm, Electron, and Node artifacts

No OpenAI authentication token or API key is required to build.

## Arch package

```bash
sudo pacman -S --needed base-devel nodejs npm python unzip 7zip
cp /path/to/ChatGPT.dmg .
makepkg -si
```

`makepkg` verifies the DMG before `build()` begins. If OpenAI has replaced the download with a newer release, use the exact pinned DMG or perform the maintainer update procedure rather than bypassing the checksum.

## Development runtime

```bash
scripts/build.sh /path/to/ChatGPT.dmg
npm run check
./run.sh
```

Useful overrides:

| Variable | Purpose |
|---|---|
| `CHATGPT_LINUX_NODE` | Path to a Linux Node.js 24.14.0 executable |
| `CHATGPT_LINUX_NODE_REPL` | Path to an audited compatible Linux node-repl host |
| `CODEX_JS` | Path used to locate the installed official Codex Linux vendor package |
| `ELECTRON_OZONE_PLATFORM_HINT` | Electron display backend preference (`auto`, `wayland`, or `x11`) |
| `ELECTRON_ENABLE_LOGGING` | Enable Electron diagnostic logging |
| `CODEX_ELECTRON_ENABLE_LINUX_COMPUTER_USE` | Enable the Linux Computer Use plugin; defaults to `1` in supplied launchers |

## Outputs

All generated and proprietary material stays in ignored paths:

- `.cache/` — extracted upstream and downloaded build inputs
- `.tools/` — project-local extraction tools
- `build/` — assembled runtime
- `node_modules/` — build dependencies
- `*.pkg.tar.zst` — Arch packages

None of these paths belongs in source control.
