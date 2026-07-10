# Compatibility

## Supported baseline

| Dimension | Maintained baseline |
|---|---|
| Distribution | Arch Linux |
| Architecture | x86_64 |
| C library | glibc |
| Display | Wayland and X11 |
| Tested compositor | Hyprland |
| Electron | 42.1.0 |
| Upstream app | 26.707.31428, build 5059 |

Arch derivatives will often work but are not automatically equivalent to the maintained baseline.

## Desktop environments

| Environment | GUI | Portals | Computer Use |
|---|---|---|---|
| Hyprland/wlroots | Expected | Install `xdg-desktop-portal-hyprland` | `grim`; optional `ydotoold` input |
| Sway/wlroots | Expected | Install `xdg-desktop-portal-wlr` | `grim`; optional `ydotoold` input |
| GNOME Wayland | Expected | `xdg-desktop-portal-gnome` | Portal capture backend not implemented |
| KDE Plasma Wayland | Expected | `xdg-desktop-portal-kde` | Portal capture backend not implemented |
| X11 desktops | Expected | Desktop-specific portal recommended | OpenAI Sky Linux helper |

## Known limitations

- No ARM64 build.
- No Alpine/musl support.
- No official Debian, RPM, Flatpak, AppImage, or Nix package.
- No headless mode.
- Chrome and in-app browser automation require an unavailable Linux `node_repl` host.
- Wayland input through `ydotoold` requires explicit `/dev/uinput` authorization and is not enabled merely by installing this package.
- GNOME and KDE need an XDG ScreenCast/RemoteDesktop plus libei backend for feature-complete desktop automation.
- macOS Appshots, avatar overlay, Chronicle, Sparkle, and LaunchServices helpers are not portable and are removed.

Report compatibility results with the diagnostic output requested by the issue template. Never attach account state, logs containing prompts, or authentication files.
