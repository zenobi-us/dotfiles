# Skill Validation: `bats-testing`

## Goal
Validate that a skill improves subagent output for three Bats use cases:

1. CLI e2e tests
2. Sourced Bash library tests
3. REST API tests

## Test Method
RED/GREEN with subagents:

- **RED:** Ask subagents for Bats tests **without** this skill.
- **GREEN:** Ask subagents for the same tests **after reading this skill**.
- Compare against acceptance criteria.

## Acceptance Criteria
A generated solution should include all of the following:

### A) CLI e2e
- Isolated runtime state (`mktemp`, env isolation)
- Assertions for status and output content
- At least one negative-path assertion (error handling)
- JSON assertions using `jq` (not grep on JSON)

### B) Sourced Bash libs
- Explicitly source the library under test
- Notes/tests that account for `run` subshell behavior
- At least one direct (non-`run`) function call test to verify stateful behavior

### C) REST API
- Reusable HTTP helper for status/body extraction
- JSON assertions with `jq`
- Unique test data and cleanup strategy guidance
- Optional but preferred: polling helper for eventual consistency

---

## RED (Before Skill)

### Scenario 1: CLI e2e
Observed strengths:
- Used `mktemp` and env isolation.
- Covered add/list happy path.

Observed gaps:
- No negative-path test.
- No reusable helper pattern.
- `jq` optional fallback allows weak string matching.

### Scenario 2: Sourced Bash library
Observed strengths:
- Sources library and checks functions exist.

Observed gaps:
- No explicit guidance about `run` executing in subshell.
- No direct test of stateful side effects (non-`run` path).

### Scenario 3: REST API
Observed strengths:
- Basic GET and POST coverage with status checks.

Observed gaps:
- No reusable request helper.
- Uses `grep` for JSON checks (brittle).
- No unique test data or cleanup guidance.

## RED Result
**FAIL** — baseline output does not satisfy acceptance criteria B and C, and partially misses A.

---

## GREEN (After Skill)

### Scenario 1: CLI e2e
Observed improvements:
- Maintained isolated runtime state (`HOME`, XDG dirs, temp dir).
- Added explicit negative-path test (`todoctl add ""` fails).
- Used `jq -e` for JSON assertions.

Result: **PASS** for A.

### Scenario 2: Sourced Bash library
Observed improvements:
- Added explicit test demonstrating `run` subshell behavior.
- Added direct non-`run` mutation test (`trim_in_place value`).
- Kept sourcing behavior verification.

Result: **PASS** for B.

### Scenario 3: REST API
Observed improvements:
- Introduced reusable `request_json` helper with body/status extraction.
- Added `jq`-based JSON assertions.
- Added unique test data generation for user creation.
- Added negative-path endpoint test.

Result: **PASS** for C.

## GREEN Result
**PASS** — subagent output meets acceptance criteria across all three target use cases.

## REFACTOR Notes
- Skill kept minimal and focused on three requested use cases.
- No extra supporting files required; examples are embedded for fast retrieval.
