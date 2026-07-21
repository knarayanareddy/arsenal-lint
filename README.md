# ArsenalLint

ArsenalLint is an offline, deterministic policy typechecker and proof loop for a deliberately supported TypeScript agent-manifest convention. It proves only that a supported manifest/code path passed the versioned checks and supplied replay tests; it is not a proof of general agent safety, production compliance, or complete TypeScript analysis.

## Architecture

`TypeScript defineAgent literal → capability extraction/diff → versioned deterministic rules → fail-closed guard → JSONL replay → Ed25519 receipt → self-contained HTML report`.

The supported convention is a literal `defineAgent({ roles, runtime, guardrails })` call. Roles have literal `id`, `tools`, and optional `irreversible_tools`; runtime and guardrail values must be literals. Spread assignments, computed names, shorthand/dynamic properties, and other unsupported syntax are reported as unknown and make source-policy gates and attestations fail closed. Runtime enforcement covers only calls routed through the guard. No LLM or network/API call participates in the verdict.

The catalog is read-only. Set `ARSENAL_DATA_PATH=/path/to/AI-Arsenal/data`; its actual loaded commit is authoritative and a differing `policy.catalog_commit` is rejected. `fixtures/catalog` is the minimal offline catalog used by tests and CI.

## Install and verify

Requires Node 22+ and pnpm 9+. Supported platforms are macOS, Linux, and Windows. The fully offline judge path needs no model credentials, network access, or AI-Arsenal checkout.

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm test
pnpm demo:ci
```

The final command writes `output/arsenallint-report.html` and demonstrates the supplied unapproved `apply_change` being blocked, followed by retry-limit blocking.

For the real read-only catalog, use the checked-out contract pin:

```bash
export ARSENAL_DATA_PATH=/Users/macbookprom1pro/AI-Arsenal/data
pnpm arsenallint doctor
```

`doctor` reports the actual containing Git commit; ArsenalLint rejects any `policy.catalog_commit` that differs from it.

## CLI

```bash
pnpm arsenallint doctor
pnpm arsenallint extract examples/hardened-agent.ts
pnpm arsenallint diff examples/baseline-agent.ts examples/unsafe-agent.ts
pnpm arsenallint check fixtures/pass.yaml --report output/report.html
pnpm arsenallint gate --policy fixtures/pass.yaml --source examples/hardened-agent.ts
pnpm arsenallint guard fixtures/pass.yaml --source examples/hardened-agent.ts
pnpm arsenallint replay fixtures/pass.yaml fixtures/traces/adversarial.jsonl
pnpm arsenallint keygen --out output/keys
pnpm arsenallint attest fixtures/pass.yaml --source examples/hardened-agent.ts --trace fixtures/traces/adversarial.jsonl --private-key output/keys/private.pem --out output/receipt.json
pnpm arsenallint verify output/receipt.json --policy fixtures/pass.yaml --source examples/hardened-agent.ts --trace fixtures/traces/adversarial.jsonl --public-key output/keys/public.pem
pnpm arsenallint demo
```

The concise narrated walkthrough is in [docs/demo-script.md](docs/demo-script.md). Its sequence is hidden capability → cited FAIL → guarded block → PASS → signed receipt → tamper rejection.

Receipts use Ed25519 and bind policy and capability digests, cited tips, portable Git/fixture catalog provenance and content digest, source commit and source-content digest, rule result, and replay result. Attestation rejects source-policy contradictions; `gate` is the CI policy/source check. Tampering with any bound input makes verification fail. Signatures establish payload integrity and key possession—not safety, signer trust, or deployment correctness.

## License

ArsenalLint code is licensed under the MIT License. See [LICENSE](LICENSE).

Bundled Arsenal fixture/catalog content is derived from [AI-Arsenal](https://github.com/knarayanareddy/AI-Arsenal) at commit `ca724eb19ae55efc04611817452b5c8e00ec9f2d` and is licensed under CC-BY-4.0. See [LICENSE-CONTENT](LICENSE-CONTENT).

Attribution does not imply upstream endorsement.

## Limits and development evidence

`RULES.md`, `rules.map.json`, and the golden fixtures are the evaluator contract. The runtime guard protects only calls routed through it. Replay is deterministic for the hand-authored JSONL trace and does not reproduce model or external-service nondeterminism. The report’s trust badges expose catalog provenance; independent findings are a ranked remediation plan, never tip contradictions.

Codex and GPT-5.6 were used as development collaborators to translate the written contract into typed predicates, fixtures, tests, replay, report, and CI. GPT-5.6 is not a runtime dependency and does not participate in any verdict.

`CODEX_SESSION_ID: 019f85cb-b4e6-7d83-a1fd-b562f378061c`
