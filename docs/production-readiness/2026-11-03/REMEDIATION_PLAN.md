# ArsenalLint remediation plan

## Roadmap overview

This plan is staged for an implementation repo with partial evidence. The first priority is to close evidence gaps, then fix the confirmed documentation portability issue, then harden verification around platform claims and artifact generation. There is no deployment target or production runtime to recover; release policy here means “ship a verified tag/artifact set, and revert it cleanly if a check fails.”

### Phase 0 — Baseline and evidence closure

**Entry:** current review is based on README/package/tests only; `src/` and workflow content were not materialized in numbered-source form.

**Exit:** implementation source is available for citation, and every claim in the review can be tied either to a numbered-source range or an explicit limitation note.

#### ARS-T0 — Materialize the missing implementation evidence
- Linked requirement: preventive; closes the evidence gap noted in the review
- Observed path: `src/arsenallint.ts`, `src/arsenallint-cli.ts`, `.github/workflows/arsenal-lint.yml`, and the fixture tree
- Prerequisites: none beyond the existing snapshot
- Steps:
  1. Add numbered-source copies for the implementation files that actually drive `check`, `gate`, `guard`, `replay`, `receipt`, and `verify`.
  2. Add the workflow file content in numbered-source form so the CI path can be cited without relying on snapshot JSON.
  3. Map each major claim in README/tests to a concrete source range and label anything still uninspected.
- Expected deliverable: a complete evidence pack that supports a full-line review rather than a partial one.
- Verification: every line in the next review draft points to a true numbered-source range or a clearly stated limitation.
- DoD:
  - [ ] `src/` implementation is visible in numbered-source form
  - [ ] workflow content is visible in numbered-source form
  - [ ] no uncited runtime claim remains

### Phase 1 — Confirmed defect fix

**Entry:** evidence closure complete enough to edit docs safely.

**Exit:** the README no longer contains a machine-specific absolute path.

#### ARS-T1 — Replace the hard-coded AI-Arsenal path example
- Linked finding: **ARS-001**
- Proposed path: `README.md`
- Prerequisites: none, but keep the `doctor` explanation intact
- Steps:
  1. Replace `/Users/macbookprom1pro/AI-Arsenal/data` with a portable example such as `"$HOME/AI-Arsenal/data"` or `~/AI-Arsenal/data`.
  2. Keep the note that `doctor` reports the actual containing Git commit so readers understand that path portability and provenance are separate concerns.
  3. Re-read the install section to make sure no other host-specific strings remain in the example block.
- Expected deliverable: portable onboarding text that copy/pastes on any host.
- Verification: manual read-back of the README example; no machine-specific absolute path remains.
- DoD:
  - [ ] example path is host-neutral
  - [ ] `doctor` meaning is unchanged
  - [ ] no other user-specific path leaks into the docs

### Phase 2 — Risk-based security and compatibility hardening

**Entry:** docs are portable; implementation evidence is available for review.

**Exit:** platform/support claims match actual validation, or the README narrows them to what is truly proven.

#### ARS-T2 — Validate or narrow the Windows/offline support claim
- Linked finding: **ARS-002**
- Proposed path: `README.md` plus CI/workflow/test updates
- Prerequisites: evidence closure from Phase 0
- Steps:
  1. Decide whether Windows is a release target or an informational compatibility note.
  2. If it is a target, add at least one platform-specific smoke check for the CLI path; if not, narrow the README language.
  3. Make sure the offline claim is backed by local-only tests and that no hidden network dependency is introduced in the judgment path.
- Expected deliverable: a claim that is either proven by CI or reduced to a truthful scope statement.
- Verification: the docs and tests say the same thing about supported platforms and offline operation.
- DoD:
  - [ ] platform claim matches validation
  - [ ] offline claim is still true after changes
  - [ ] no hidden network dependency is added

### Phase 3 — Meaningful automation

**Entry:** security/compatibility claims are aligned with reality.

**Exit:** negative tests fail when the guarded/reporting behavior regresses.

#### ARS-T3 — Strengthen the demo/report regression checks
- Linked requirement: preventive; protects the artifact path documented in README
- Observed path: `tests/arsenallint.test.ts`, `package.json`, and the demo/report path described in `README.md`
- Prerequisites: Phase 0 evidence closure
- Steps:
  1. Add a regression that proves the demo/report flow still emits the HTML artifact on the expected path.
  2. Add a negative case that fails if the report is not produced, if the guard stops failing closed, or if unsupported syntax is accepted.
  3. Keep the tests deterministic: no external services, no live catalog fetch, no runtime randomness.
- Expected deliverable: stronger proof that the command-line story and report artifact are still wired end to end.
- Verification: deliberately break the report path or the fail-closed condition and observe a failing test.
- DoD:
  - [ ] report artifact path is asserted
  - [ ] broken guard behavior fails the test
  - [ ] tests remain deterministic and local-only

### Phase 4 — Release and rollback policy

**Entry:** the CLI path is verified and the docs are truthful.

**Exit:** a maintainer can ship or back out a release without guessing.

#### ARS-T4 — Define release/rollback guardrails for the repo
- Linked requirement: preventive; no live deployment target exists
- Proposed path: `CODEX_HANDOFF.md`, `README.md`, or a dedicated release note
- Prerequisites: Phases 0–3
- Steps:
  1. State the release unit explicitly: tag, commit SHA, and generated artifact set.
  2. Define rollback as a revert of the release commit or tag removal, not as a runtime restart.
  3. Record which verification gates must pass before publish: build, tests, demo, and any platform-specific smoke checks.
- Expected deliverable: a simple release policy that matches the repo’s file-artifact nature.
- Verification: a maintainer can point to the exact ship and backout steps without inventing them.
- DoD:
  - [ ] release unit is named
  - [ ] rollback path is explicit
  - [ ] required pre-publish gates are listed

## Dependency map

| Task | Depends on | Notes |
|---|---|---|
| ARS-T0 | — | evidence closure first |
| ARS-T1 | ARS-T0 | safe doc edit after evidence is bounded |
| ARS-T2 | ARS-T0, ARS-T1 | claim validation after portability cleanup |
| ARS-T3 | ARS-T0, ARS-T2 | automation should reflect the final scope |
| ARS-T4 | ARS-T0, ARS-T3 | release policy should mirror verified behavior |

## Production acceptance checklist

- [ ] README no longer contains a user-specific absolute path
- [ ] supported-platform wording matches the actual test/CI evidence
- [ ] fail-closed behavior is still asserted by tests
- [ ] HTML report generation is still asserted by tests
- [ ] release/rollback steps are written down for maintainers

## Changes requiring owner approval

- Any change to the meaning of `doctor`, policy pinning, source binding, or receipt verification
- Any change that weakens fail-closed behavior or removes a negative test
- Any change to the supported-platform claim in `README.md`

## Rollback and release policy

Prefer a one-commit revert over a partial rollback. Do not publish a release until the negative tests and artifact checks pass. If a future change breaks portability or fail-closed semantics, revert the offending commit and re-run the documented verification gates before shipping again.
