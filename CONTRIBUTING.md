# Contributing

Thank you for helping improve ChatGPT Desktop for Linux.

## Before opening a change

- Search existing issues and pull requests.
- Keep changes focused on the compatibility layer, packaging, documentation, or Linux integration.
- Do not submit OpenAI binaries, extracted application code, screenshots containing private data, authentication state, or generated runtimes.
- Discuss broad platform or architecture work in an issue before investing in a large implementation.

## Development setup

```bash
npm ci --ignore-scripts
bash -n run.sh scripts/*.sh packaging/chatgpt-linux tests/*.sh
node --check scripts/*.mjs integrations/computer-use/*.mjs
tests/repository-policy.sh
```

Runtime validation additionally requires a locally supplied official DMG:

```bash
scripts/build.sh /path/to/ChatGPT.dmg
npm run check
```

## Pull requests

- Explain the problem, approach, security impact, and verification performed.
- Keep proprietary upstream observations paraphrased; do not paste large sections of extracted or minified application code.
- Add or update tests for compatibility logic.
- Update documentation and the compatibility matrix when behavior changes.
- Preserve exact upstream patch assertions.
- Do not disable Electron, Codex, browser, archive, or desktop security mechanisms to make a test pass.

By contributing, you agree that your original contribution is licensed under the MIT License and that you have the right to submit it.
