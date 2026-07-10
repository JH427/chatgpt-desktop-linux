# Maintainer update procedure

## 1. Refresh the official package

```bash
scripts/refresh-upstream.sh
```

The script downloads from the pinned official URL, computes the digest, extracts metadata, and updates `upstream-lock.json` and `PKGBUILD`.

## 2. Inspect before adapting

- Verify the download origin and new digest.
- Review upstream Electron, Node, Codex, and native-addon versions.
- Inventory new executable files and native modules.
- Inspect every exact patch target in context.
- Check whether OpenAI has introduced a supported Linux package or runtime; prefer it over this compatibility path.

## 3. Rebuild

```bash
scripts/build.sh ./ChatGPT.dmg
npm run check
```

Exercise login, workspace selection, a Codex turn, terminal execution, Git state, file dialogs, microphone permission, and Computer Use where supported.

## 4. Security review

- Run `tests/repository-policy.sh`.
- Run `npm audit --omit=dev` and review development findings separately.
- Confirm no generated/proprietary files appear in `git status`.
- Search new code for shell interpolation, path traversal, unsafe archive handling, credential access, and sandbox bypasses.
- Never change browser runtime behavior merely to silence `node-repl-missing`.

## 5. Release

Update `CHANGELOG.md`, increment the package release when packaging changes, and document compatibility regressions. Source releases must not attach the DMG, ASAR, runtime, or Arch binary package containing OpenAI assets.
