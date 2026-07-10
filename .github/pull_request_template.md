## Summary

Describe the focused change and its user impact.

## Security and legal boundaries

- [ ] No proprietary application payloads, generated runtimes, credentials, personal data, or unredacted logs are included.
- [ ] The change does not weaken sandboxing, archive validation, browser trust, or desktop permission boundaries.
- [ ] New dependencies or downloads are pinned and justified.

## Validation

- [ ] `tests/source-checks.sh`
- [ ] `npm run check` when a local runtime is available
- [ ] Relevant desktop/distribution testing is documented

## Documentation

- [ ] Compatibility, troubleshooting, and changelog documentation is updated where needed.
