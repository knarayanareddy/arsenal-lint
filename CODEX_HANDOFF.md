# Codex implementation handoff — ArsenalLint

## State of this handoff

This archive intentionally contains only the corrected contract, rule map, and golden policy
fixtures. It contains no implementation, package scaffold, catalog copy, generated output, demo,
or tests. `README.md` describes the target product and must not be treated as evidence that those
features already exist.

The core must be implemented in this GPT-5.6 Codex thread. Keep design, implementation, test
results, and corrections in this thread; once the core proof loop passes, run `/feedback` here and
capture the resulting feedback and Session ID here before recording the Session ID in `README.md`.

## Goal

Build the bounded, proof-carrying TypeScript developer tool specified by `RULES.md`,
`rules.map.json`, the fixtures, and the target boundaries in `README.md`. The evidence chain is:

`TypeScript source → capability extraction → capability diff → deterministic rules → generated
runtime guard → deterministic adversarial replay → Ed25519 signed receipt → PR HTML/CI report`.

Do not replace any verdict step with an LLM evaluator. Given the same source, policy, rule map,
catalog, and replay trace, all normalized artifacts and decisions must be reproducible.

## Start here

1. Read `RULES.md` end-to-end; it and `rules.map.json` are the authoritative evaluator contract.
2. Create a Node.js/TypeScript project with strict types, safe YAML parsing, input validation, a
   CLI, and tests.
3. Load or construct the pinned offline catalog fixture needed by tests without changing the
   supplied golden contract fixtures. Production loading must use `$ARSENAL_DATA_PATH/tips.json`.
4. First implement catalog loading, policy normalization, the 12 deterministic rules, claims,
   remediation ranking, trust badges, and the contract seal.
5. Deep-compare `fail.yaml`, `pass.yaml`, and `conflict.yaml` with
   `fixtures/expected/*.json`; assert `seal` separately as non-null and deterministic.
6. Add focused tests for R2 (missing/empty role tools), R9 (code execution without sandboxing),
   and WARN (all required gates pass but substantiated claims are only theoretical/draft).
7. Then implement and test the complete proof loop below. Do not stop at YAML linting.

## Required proof loop

### 1. Actual TypeScript capability extraction

- Implement AST/static extraction for a deliberately bounded, documented TypeScript
  `defineAgent({...})` convention.
- Extract roles and explicit tool allowlists; tool registration; irreversible, network, and
  code-execution capabilities; approval wrappers; guardrails; and runtime limits.
- Normalize output into a deterministic capability artifact with file and line evidence.
- Reject or explicitly mark unsupported dynamic constructs. Do not imply whole-program analysis.
- Include unsafe, baseline, and hardened TypeScript fixtures that exercise the supported convention.

### 2. Capability diff

- Compare baseline and changed normalized capability artifacts, not raw source text.
- Report additions/removals and indirect privilege changes such as a newly reachable irreversible
  tool, weakened approval, changed guardrail, or loosened budget.
- Distinguish declared, statically inferred, and replay-observed evidence.
- Make the hidden `apply_change` capability path a first-class tested/demo artifact.

### 3. Deterministic Arsenal rule engine

- Bind extracted evidence and normalized YAML policy to all 12 curated rules.
- Preserve capability-inferred requirements and optional claims exactly as specified.
- Load `$ARSENAL_DATA_PATH/tips.json`; every citation must resolve in the loaded catalog.
- Treat the actually loaded catalog commit as authoritative. Reject a mismatched
  `policy.catalog_commit`; never sign or seal a user-supplied commit as if it were loaded.
- Recompute severity, confidence, and weight from loaded catalog metadata so tests detect map or
  catalog drift.
- Emit trust badges for every cited tip. `remediation_plan` is a ranked set of independent repairs,
  never a fabricated tip conflict.
- Make fixture and CI execution fully offline and credential-free.

### 4. Generated runtime guard

- Generate an actual TypeScript enforcement wrapper from the same normalized policy checked by the
  rules engine.
- Enforce role/tool allowlists, approval for irreversible actions, maximum steps, wall-clock
  timeout, retry cap, token budget, and cost budget at the supported integration boundary.
- Fail closed when required policy, generated metadata, or bound receipt/policy digest is absent or
  mismatched.
- Execute the demo agent through the generated guard; do not merely print suggested configuration.

### 5. Deterministic adversarial replay

- Define a checked-in, hand-authored trace format and deterministic runner.
- Replay an unsafe attempt to call `apply_change` without approval and repeated calls that exceed a
  limit.
- Prove in tests that the naive fixture executes/fails its safety expectation while the generated
  hardened guard blocks the actions.
- Record ordered observed events and stable results; do not claim to reproduce model or external
  service nondeterminism.

### 6. Ed25519 signed receipt

- Keep the contract SHA-256 `seal`, but add a distinct canonical signed proof receipt.
- Canonical payload must bind policy digest, capability digest, cited tips, loaded catalog commit,
  source commit, rule/test result, and replay result.
- Implement real Ed25519 key generation or key loading, signing, and independent verification.
- Verification must fail after changing any bound policy, source, capability, catalog, or replay
  input. Test tampering.
- Call this an attestation only because it is signed; do not conflate signature integrity with
  safety, compliance, signer trust, or correct deployment.

### 7. PR HTML report and CI

- Render one polished, dependency-light, self-contained PR-style HTML artifact from the same
  canonical result used by CLI/CI.
- Include capability before/after, findings, source evidence, catalog trust badges, replay timeline,
  ranked remediation, and signature verification state.
- Add a GitHub Actions workflow (and local equivalent) that installs from a frozen lockfile,
  builds, tests, runs the offline proof loop, exits non-zero on failure, and uploads the HTML report.
- Keep a concise under-three-minute demo path showing: hidden capability → blocked behavior →
  tamper detection.

## Required CLI surface

Choose coherent flags and document them, while supporting these capabilities:

- extract a supported TypeScript agent into normalized capabilities;
- diff baseline and changed capabilities;
- check policy and/or supported source and print canonical JSON;
- generate the runtime guard;
- replay an adversarial trace;
- generate/load Ed25519 keys, attest, and verify;
- render the PR HTML report;
- run the complete offline demo/CI proof loop.

## Test and acceptance requirements

- Unit tests for schema validation, canonicalization, all 12 rule predicates, catalog pin rejection,
  citation existence, metadata-derived weights, claims, trust badges, remediation ordering, and
  deterministic seal.
- Golden tests for every supplied expected JSON fixture without rewriting expected output to fit
  implementation mistakes.
- Extraction tests with exact file/line evidence and unsupported-syntax behavior.
- Semantic capability-diff tests.
- Generated-guard integration tests for allowlists, approval, budgets, retries, and fail-closed
  digest/missing-policy behavior.
- Deterministic unsafe-versus-hardened replay tests.
- Ed25519 positive verification and bound-input tamper tests.
- HTML assertions for every required report section and CI behavior tests where practical.
- Build, test, and offline CI/demo commands must pass from a clean checkout.

## Accuracy boundaries

The strongest permitted claim is: “ArsenalLint proves this supported agent manifest/code path
passed these versioned checks and replay tests.”

State the supported extraction syntax and threat-model limits prominently. Never claim that the
tool proves an agent safe, proves production compliance, performs complete TypeScript program
analysis, observes hidden prompt/service behavior, or guarantees host integration. Capability diffs
show bounded policy/privilege drift; guards protect only correctly routed calls; replay proves
deterministic behavior for the supplied trace; Ed25519 proves payload integrity and possession of
the signing key only.

Do not add generic live LLM explanations, vector search, all 171 Arsenal rules, a general fuzzer,
multi-language AST support, unrelated dashboards, or invented Arsenal recipes. These dilute the
single proof loop.

## Build order and Codex evidence

1. Deterministic contract engine and golden tests.
2. Supported TypeScript extractor, source evidence, and unsafe/baseline/hardened fixtures.
3. Capability diff and binding of extracted evidence to rules.
4. Generated fail-closed guard and deterministic replay.
5. Canonical Ed25519 receipt and tamper verification.
6. PR HTML report, CI, clean-checkout verification, and concise demo.
7. In this same GPT-5.6 Codex thread, run `/feedback`, capture the feedback and Session ID, then add
   the Session ID to `README.md`.
