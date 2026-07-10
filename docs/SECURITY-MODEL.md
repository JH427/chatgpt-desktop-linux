# Security model

## Trust boundaries

This project combines three categories of code:

1. Original, reviewable compatibility code from this repository.
2. Pinned third-party open-source build/runtime dependencies.
3. OpenAI's proprietary application, acquired directly by each user.

The repository never treats category 3 as redistributable source.

## Supply-chain controls

- The upstream DMG and Node runtime are SHA-256 pinned.
- npm dependencies use an exact lockfile.
- Electron and Linux native packages use exact versions.
- Upstream minified transformations use exact match counts.
- Runtime checks verify expected ELF executables and reject active Mach-O payloads.
- CI rejects proprietary archive types, generated directories, large files, private-key markers, common token formats, and machine-specific home paths.
- GitHub secret scanning is supplemented with Gitleaks in CI.

Checksums establish artifact identity, not trustworthiness. Users still choose whether to run the upstream application and its dependencies.

## Credentials

Do not put OpenAI access tokens, API keys, browser cookies, GitHub tokens, keyring exports, `.env` files, authentication databases, or application logs in this repository or an issue. The application uses the user's local credential store at runtime; build scripts do not read or copy those credentials.

## Desktop control

Screen capture and input injection are privileged capabilities:

- X11 has weak isolation; the Sky helper can interact with the desktop available to that X server.
- Wayland capture uses compositor tooling.
- Wayland input requires a separately configured `ydotoold` service with access to `/dev/uinput`.

The package does not automatically grant `/dev/uinput` access, start a privileged daemon, or modify system security policy. Users must understand and authorize that separately.

## Browser runtime

The upstream macOS `node_repl` host includes security and trusted-client behavior that a basic Node evaluator would not reproduce. This project removes the Mach-O host and reports browser automation unavailable. It will not ship an unsandboxed substitute merely to expose the feature.

## Reporting

Follow [SECURITY.md](../SECURITY.md) for private vulnerability reporting. Do not open a public issue containing a working exploit, credential, private prompt, or personal data.
