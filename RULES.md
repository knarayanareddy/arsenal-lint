# ArsenalLint — Rule Contract (single source of truth)

> Policy typechecker for agent systems. Proves — with a cryptographic seal — which
> Arsenal guardrail tips a policy satisfies at catalog commit `ca724eb…`, and flags
> when your claims don't match your gates.

**Category:** Developer Tools. **Built with:** Codex + GPT-5.6 (core implemented in the
Codex session; this contract was produced by the planning agents).

This file and `rules.map.json` are the canonical contract. The engine, tests, and fixtures
must stay in sync with them.

---

## 1. Verdict object schema

```json
{
  "policy": "string (fixture name)",
  "status": "FAIL | WARN | PASS",
  "findings": [
    { "rule": "R1", "arsenal_tip_id": "require-human-approval-for-irreversible-actions",
      "severity": "high", "weight": 3.0,
      "evidence": "irreversible tool 'apply_change' exposed without human_approval_for gate",
      "verification_status": "production-verified" }
  ],
  "remediation_plan": {
    "ranked": [ { "rule":"R1", "weight":3.0, "resolution":"..." },
                { "rule":"R11","weight":0.6, "resolution":"..." } ],
    "resolution_set": ["...", "..."]
  },
  "unsubstantiated_claims": ["require-human-approval-for-irreversible-actions"],
  "cited_tips": ["allowlist-tools-per-agent-role", "..."],
  "trust_badges": [
    { "arsenal_tip_id": "allowlist-tools-per-agent-role", "verification_status": "community-reported", "enrichment_status": "draft" }
  ],
  "seal": null
}
```

`seal` is `null` in the expected fixtures; tests assert it separately (see §5).

---

## 2. Status definitions (WARN paragraph — authoritative)

- **FAIL** — any *required* (capability-inferred) rule is violated.
- **WARN** — all required gates pass, BUT the policy either (a) claims a tip it does not
  enforce (`unsubstantiated_claims` non-empty), or (b) makes one or more substantiated claims
  but **none** of those claimed tips is `production-verified` or `enrichment_status = reviewed`.
  A policy may cite draft/community guidance alongside reviewed or production-verified controls
  without being downgraded solely for that citation.
- **PASS** — all required gates pass, no unsubstantiated claims, and the policy either makes no
  claims or has at least one substantiated `production-verified`/`reviewed` claim.

Golden fixtures demonstrate **FAIL** (`fail.yaml`, `conflict.yaml`) and **PASS** (`pass.yaml`).
**WARN** is covered by a dedicated unit test (a policy that passes all gates but cites only a
theoretical tip).

---

## 3. Blast-radius weighting (data-driven, auditable)

Weight = `impact_rank(impact) × verification_conf(verification_status)`, read directly from each
tip's own fields in `data/tips.json`. When asked "where did the weights come from?" the answer
is: the dataset's own `impact` and `verification_status` values.

```
impact_rank:      transformative=4, high=3, medium=2, low=1
verification_conf: production-verified=1.0, lab-verified=0.8, community-reported=0.6, theoretical=0.3
```

| Rule | Tip impact | Verification | Weight |
|---|---|---|---|
| R1, R5, R7, R10 | high | production-verified | **3.0** |
| R2, R3, R4, R6, R8, R9 | high | community-reported | **1.8** |
| R11 | medium | theoretical | **0.6** |
| R12 | (meta) | uses claimed tip's weight | n/a |

`remediation_plan.ranked` is sorted by `weight` descending → the minimal resolution set is
presented highest-weight first. This is not a claim that two Arsenal tips contradict; it is a
prioritized repair plan for independent failed rules.

---

## 4. The 12 rules

`severity` = the tip's `impact`. `weight` per §3. Predicates are deterministic (no LLM in the
verdict). `fixture trigger` notes where each fires among the golden fixtures; R2 and R9 are
exercised by dedicated unit tests (golden fixtures keep allowlists explicit and contain no
code-exec tool).

| ID | Arsenal tip ID | Predicate (summary) | Evidence template | Fixture trigger | Weight |
|---|---|---|---|---|---|
| R1 | require-human-approval-for-irreversible-actions | every `role.irreversible_tools` ∈ `guardrails.human_approval_for` | irreversible tool '{tool}' exposed without human_approval_for gate | fail, conflict (human_approval_for: []) | 3.0 |
| R2 | allowlist-tools-per-agent-role | every role declares explicit non-empty `tools` | role '{role}' exposes tools without an explicit allowlist | unit (role w/ omitted tools) | 1.8 |
| R3 | set-a-token-and-cost-budget-per-agent-run | `runtime.token_budget` set & >0 | token_budget is null/0; token spend unbounded | fail (token_budget: null) | 1.8 |
| R4 | set-a-token-and-cost-budget-per-agent-run | `runtime.cost_budget_usd` set & >0 | cost_budget_usd is null/0; spend uncapped | fail (cost_budget_usd: null) | 1.8 |
| R5 | add-a-max-step-budget-to-every-agent | `runtime.max_steps` set & finite (>0) | max_steps is null/unbounded; agent can loop indefinitely | fail (max_steps: null) | 3.0 |
| R6 | set-wall-clock-timeouts-for-agent-runs | `runtime.wall_clock_timeout_sec` set & >0 | wall_clock_timeout_sec is null; run can hang | fail (wall_clock_timeout_sec: null) | 1.8 |
| R7 | keep-a-kill-switch-for-agent-actions | `guardrails.kill_switch == true` | kill_switch is false; cannot halt runaway agent | fail (kill_switch: false) | 3.0 |
| R8 | block-ssrf-by-validating-outbound-urls | `guardrails.ssrf_guard == true` | ssrf_guard is false; outbound tool URLs unvalidated | fail (ssrf_guard: false) | 1.8 |
| R9 | sandbox-model-generated-code-execution | if `runtime.code_exec_tools` non-empty ⇒ `guardrails.sandbox_code_exec == true` | code-executing tool(s) {tools} present without sandbox_code_exec | unit (code tool + sandbox false) | 1.8 |
| R10 | cap-agent-tool-retries | `runtime.retry_cap` set & finite (>0) | retry_cap is null; agent can retry a broken tool infinitely | fail (retry_cap: null) | 3.0 |
| R11 | budget-context-before-adding-tools | if distinct tool count > 8 ⇒ `runtime.token_budget` set AND `runtime.context_compaction == true` | policy exposes {n} tools with no context_compaction; context-overflow risk | conflict (19 tools, no context_compaction) | 0.6 |
| R12 | (meta / attestation engine) | every `policy.claims[]` tip is enforced by its corresponding rule | claims tip '{tip}' but policy does not enforce it (unsubstantiated claim) | fail (claims safety, not enforced) | n/a |

### Required-vs-claimed logic
- **Required tips** are *inferred from declared capabilities*: if a rule's precondition is met by
  the policy (e.g., `irreversible_tools` present ⇒ R1's tip is required), the rule must pass;
  failure ⇒ a `findings` entry and a FAIL contributor.
- **`claims`** are *optional self-attestation*. Each claimed tip must be enforced by its rule;
  otherwise it appears in `unsubstantiated_claims` (WARN contributor; if the underlying required
  rule also fails, it is already a FAIL finding).
- This gives both the deterministic lint (required) and the compliance story (claims) without
  promising semantic auto-derivation.

---

## 5. Catalog pin & loader contract

- **Pinned commit:** `ca724eb19ae55efc04611817452b5c8e00ec9f2d` (HEAD of
  `knarayanareddy/AI-Arsenal` at clone time; `data/` generated 2026-07-19, same day).
- **Loader:** read `$ARSENAL_DATA_PATH/tips.json` → object
  `{ schema_version, generated_at, count, items:[…] }`. Key `items` by `id`; for each rule,
  resolve its `arsenal_tip_id` to `{ impact, verification_status, enrichment_status, title }`.
- **Pin authority:** the loader owns the authoritative loaded catalog commit. If `policy.catalog_commit`
  is present and differs from that loaded commit, the engine must reject the policy with a pin-mismatch
  error; it must never seal a user-supplied commit string.
- **Seal:** `seal = sha256( canonical_json(policy_without_seal) + "\n" + cited_tips_sorted.join(",") + "\n" + loaded_catalog_commit )`.
  Tests assert the engine emits a non-null seal matching this formula for every fixture
  (independently of `status`).

---

## 6. Fixtures (see `fixtures/`)

- `fail.yaml` — broken bounded agent: irreversible `apply_change` un-gated, unbounded steps,
  null budgets/timeouts, ssrf off, kill_switch off, and a false safety claim ⇒ **FAIL**.
- `pass.yaml` — same agent hardened: all gates present, claims only what is enforced ⇒ **PASS**.
- `conflict.yaml` — broad agent (19 distinct tools) with missing approval gate AND no context compaction
  ⇒ triggers R1 (weight 3.0) and R11 (weight 0.6); `remediation_plan.ranked` orders the minimal
  resolution set ⇒ **FAIL** with a prioritized prescription.

Expected verdicts live in `fixtures/expected/{fail,pass,conflict}.json` and are the test oracle.
