# ArsenalLint

## Working rules

- Keep the core library independent of CLI and transport concerns.
- Treat AI-Arsenal generated JSON as read-only input.
- Never emit or trust an Arsenal citation unless its ID exists in the loaded catalog.
- Keep fixture mode working without network access or credentials.
- Generated scaffold output must remain under `output/` and must not overwrite without `--force`.
- Run `pnpm build && pnpm test` after changes.

## MVP boundary

The deterministic bounded-agent proof loop is the primary demo. No runtime model/API synthesis is part of ArsenalLint.
