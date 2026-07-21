# ArsenalLint under-three-minute demo

1. **Hidden capability (0:00–0:20).** Run `extract examples/unsafe-agent.ts` and `diff examples/baseline-agent.ts examples/unsafe-agent.ts`. Point out the inferred `apply_change` irreversible capability and weakened approval gate.
2. **Cited FAIL (0:20–0:45).** Run `check fixtures/fail.yaml`. Show R1 and the catalog-derived trust badge; the verdict is deterministic and offline.
3. **Guarded block (0:45–1:15).** Run the unsafe replay, then `replay fixtures/pass.yaml fixtures/traces/adversarial.jsonl`. The naive route executes `apply_change`; the bound guard blocks it without approval and blocks repeated calls after the retry cap.
4. **PASS (1:15–1:35).** Run `check fixtures/pass.yaml --report output/arsenallint-report.html`. Show the PASS verdict and report source evidence, findings, replay timeline, and remediation section.
5. **Signed receipt (1:35–2:10).** Run key generation and `attest`, then `verify`. Explain that Ed25519 binds the exact policy, extracted manifest capabilities, cited tips, catalog commit, source commit, and replay result.
6. **Tamper rejection (2:10–2:35).** Change a copied policy version and verify the same receipt. Verification fails. Close with: “ArsenalLint proves this supported code path passed versioned checks and replay tests—not that an arbitrary agent is safe or compliant.”
