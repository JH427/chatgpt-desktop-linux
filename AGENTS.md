# Project guidance

- Never commit or redistribute OpenAI application binaries, `app.asar`, authentication state, or extracted proprietary resources.
- The user must obtain the upstream package directly from OpenAI. Build scripts may verify, extract, and transform it locally.
- Keep Linux adaptations in readable source files. Prefer runtime shims and generated overlays over modifying minified upstream JavaScript.
- Treat authentication, sandboxing, screen capture, input injection, and automatic updates as security-sensitive code.
- Support Arch Linux x86-64 first. Keep architecture and distro assumptions isolated so other Linux targets can follow.
- Run static checks and smoke tests before packaging. Never weaken the Codex sandbox to make a feature pass.
