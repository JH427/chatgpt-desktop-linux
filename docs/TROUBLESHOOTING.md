# Troubleshooting

Start with:

```bash
scripts/doctor.sh
```

Review the output before sharing it. Remove usernames, filesystem paths, repository names, prompts, account identifiers, and other personal information.

## The application does not launch

Run the development launcher with logging:

```bash
ELECTRON_ENABLE_LOGGING=1 ./run.sh
```

Confirm that `npm run check` passes and that `ldd build/runtime/chatgpt` reports no missing libraries.

## Blank or black window

Force a display backend:

```bash
ELECTRON_OZONE_PLATFORM_HINT=wayland ./run.sh
```

or:

```bash
ELECTRON_OZONE_PLATFORM_HINT=x11 ./run.sh
```

The executable must remain named `chatgpt`; Electron uses packaged-mode detection to select the bundled renderer instead of a development server.

## Login callback does not reopen the app

Register the protocol handler:

```bash
xdg-mime default chatgpt-linux.desktop x-scheme-handler/codex
xdg-mime query default x-scheme-handler/codex
```

## File dialogs or screen sharing do not appear

Install one portal backend appropriate for the desktop and restart the user portal services or session. Common choices are:

- `xdg-desktop-portal-hyprland`
- `xdg-desktop-portal-wlr`
- `xdg-desktop-portal-gnome`
- `xdg-desktop-portal-kde`

## Computer Use is unavailable

Confirm the plugin is installed:

```bash
codex plugin list
codex mcp list
```

On Wayland, install `grim` for screenshots. Input also requires `ydotool` and a functioning, explicitly authorized `ydotoold` socket. The project intentionally does not configure this privileged service for you.

## Browser Use reports `node-repl-missing`

This is an expected limitation. OpenAI does not currently include a Linux `node_repl` host in the upstream package. Do not copy the macOS binary or replace it with an unsandboxed evaluator.

## Upstream patch failure

An exact-match failure means the upstream application changed. Do not loosen the match until the new code has been reviewed. Follow [MAINTAINING.md](MAINTAINING.md).
