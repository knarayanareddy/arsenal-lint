# ArsenalLint review

## 1) Scope and verdict

- Repo: `arsenal-lint`
- Pinned SHA: `d34928583b525da4f55b6a62f0af2acd086418fd`
- Stage: implementation, with sampled docs/tests only
- Sampled evidence: `evidence/arsenal-lint/numbered-sources/README.md.txt`, `package.json.txt`, `tests/arsenallint.test.ts.txt`
- Runtime: **NOT RUN**; no `pnpm install`, build, test, demo, or CLI execution in this session

Verdict: the repository’s written contract is unusually explicit and the sampled tests cover the main fail-closed paths well. The main limitations are evidence scope and a small set of doc-level portability/validation gaps. Historical CI metadata in the snapshot shows the workflow last completed successfully at the same SHA (`https://github.com/knarayanareddy/arsenal-lint/actions/runs/29864762882`).

Uninspected boundaries: the actual implementation sources under `src/`, the workflow file content under `.github/workflows/`, and the fixture payloads themselves were present in the snapshot tree but not materialized in numbered-source form here. I therefore treat runtime behavior as bounded by the sampled docs/tests, not fully audited.

## 2) Architecture and product boundary

This is a CLI-first TypeScript tool, not a general-purpose agent runtime. The documented flow is `defineAgent` literal → capability extraction/diff → deterministic rules → fail-closed guard → JSONL replay → Ed25519 receipt → HTML report (`README.md:7-11`). The package scripts reinforce that shape: `build`, `test`, `arsenallint`, `demo`, and `demo:ci` (`package.json:8-13`).

The product boundary is narrow and intentional: supported manifests are literal `defineAgent({ roles, runtime, guardrails })` calls, while unsupported syntax is reported as unknown and fails closed (`README.md:9-11`). The tests show that boundary is enforced against source shape, policy pin mismatch, fabricated claims, receipt tampering, and guard misuse (`tests/arsenallint.test.ts:11-27`).

There is no evidence of a network-dependent verdict path. The docs explicitly say no LLM or network/API call participates in the verdict (`README.md:9-11`), and the test suite focuses on local file inputs, Git source binding, and deterministic replay (`tests/arsenallint.test.ts:18-25`). That means web UI, auth/session, and deployment concerns are largely inapplicable here; the important trust boundary is source/policy/receipt integrity.

## 3) Findings ledger

### ARS-001 — Machine-specific catalog path in the README
- Severity: low
- Status: confirmed static
- Evidence: `README.md:28-33` — `"export ARSENAL_DATA_PATH=/Users/macbookprom1pro/AI-Arsenal/data"`
- Pinned URL: `https://github.com/knarayanareddy/arsenal-lint/blob/d34928583b525da4f55b6a62f0af2acd086418fd/README.md#L28-L33`
- Impact: the documented “real read-only catalog” example is not portable and will fail copy/paste on any other host. That weakens onboarding and contradicts the otherwise portable framing of the tool.
- Recommended correction: replace the absolute path with a shell-neutral portable example (`$HOME`, `~`, or a placeholder path) and explain that `doctor` resolves the actual Git commit, not a machine-specific path.

### ARS-002 — Cross-platform/offline support is claimed, but not evidenced in the sampled set
- Severity: low
- Status: unverified risk
- Evidence: `README.md:15-15` — `"Supported platforms are macOS, Linux, and Windows. The fully offline judge path needs no model credentials, network access, or AI-Arsenal checkout."`
- Pinned URL: `https://github.com/knarayanareddy/arsenal-lint/blob/d34928583b525da4f55b6a62f0af2acd086418fd/README.md#L15-L15`
- Impact: this is a strong product claim, but the sampled evidence does not include Windows-specific tests or platform-matrix evidence. A reader could infer validation that is not shown here.
- Recommended correction: either add platform-matrix CI/smoke coverage or narrow the claim to the environments actually verified.

## 4) Five-discipline assessment

- Correctness / code review: strong local contract coverage. The tests check deterministic seals, explicit rule failures (R2/R9/WARN), pin mismatch, fabricated claims, unsupported syntax, source-role drift, receipt binding, and CLI exit codes (`tests/arsenallint.test.ts:10-27`).
- Automation / testing: good unit-level regression coverage, but no runtime execution here. `package.json` gives a minimal command surface and the tests intentionally verify negative cases, including malformed source and invalid receipts (`package.json:8-13`, `tests/arsenallint.test.ts:15-27`).
- DevOps / operations: release is file-artifact oriented (`output/report.html`, receipts, keys) rather than service-oriented. The docs mention a demo report and CI artifact upload, but I did not inspect the workflow file content directly, so deployment/rollback details remain unverified.
- Security / OWASP: this is the strongest discipline in the repo. The design is fail-closed by default; receipts bind policy, capability, source commit/digest, catalog provenance, cited tips, and replay result; HTML output is escaped and CSP-protected; private keys are mode-600 and duplicate generation is rejected (`README.md:53-65`, `tests/arsenallint.test.ts:19-26`). No auth/session surface is present in the sampled scope.
- UI / UX / accessibility: no interactive app UI is visible in the sampled material. The only user-facing surface is a generated HTML report, and the tests only prove escaping/CSP, not accessibility or layout quality (`tests/arsenallint.test.ts:26-26`).

## 5) Production blockers and owner questions

1. Should the catalog path example be made portable now, or is the current machine-specific example intentional for internal use only?
2. Is Windows support a committed release target, or just an aspirational compatibility note?
3. Should the evidence pack be expanded to include the implementation source files under `src/` so future reviews can cite runtime behavior directly rather than infer it from docs/tests?

## 6) Evidence inventory and limitations

Inspected ranges:

- `README.md:1-69`
- `package.json:1-17`
- `tests/arsenallint.test.ts:1-27`

Not run:

- all repository commands (`pnpm install`, `pnpm build`, `pnpm test`, `pnpm demo:ci`, `pnpm arsenallint ...`)
- any GitHub Actions rerun or artifact fetch
- any browser/UI interaction
- any platform-specific execution on Windows/macOS/Linux beyond reading the docs

Bottom line: the sampled evidence shows a deliberate, well-tested fail-closed design, but the review is still bounded by missing implementation-source evidence and one portable-doc gap.
