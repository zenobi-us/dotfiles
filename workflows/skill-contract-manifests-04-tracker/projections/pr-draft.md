---
title: Tracker contract cutover after fix-0008
type: Report
---

# Tracker contract cutover

## Ticket and problem

`tracker/tickets/skill-contract-manifests-04-tracker.md`: fix blocking review findings SPEC-1 and SPEC-2 only.

## Source

Branch: `feature/skill-contract-manifests-04-tracker`.
Commit: `007dbbf52e4fc2da57ac10ebdafcf9e23c1adf4d`.
Tree: `232b6a74548c15731a6fba4290a21936357c6ece`.
Worktree: `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-04-tracker`.

## Implementation

Validate ticket parent initiative membership before shared safe/bulk persistence. Follow supported ticket-parent hierarchies and reuse the existing complete direct-membership validator. Reject YAML with possible comments before the setup adapter can serialize it to JSON.

## Findings

Consumed review: [review-0005](../events/review-0005.yaml) and [review artifact](../artifacts/reviews/review-review-0005.md). SPEC-1 and SPEC-2 are fixed and verified by the fixer. No selected findings remain unresolved. These are repair claims, not an independent review verdict.

The retained FAILURE applies to source `b062761b4a31681f4e826c4e3dad8770e8944607` and is stale for the new source. The current post-fix review below records SUCCESS; integration still requires a separately validated candidate.

## Changed files

- `mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json`
- `mise/conf.d/devtools-agent/bundles/matt-pocock/.claude-plugin/plugin.json`
- `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/contracts/record-upgrade.md`
- `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/setup-contracts/upgrade-v1-v2.md`
- `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/record-migration.ts`
- `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/records.test.ts`
- `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/setup.test.ts`
- `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/setup.ts`

## Checks and limits

- No full-suite pass is claimed. The scoped run passed 85 tests; the six failed cases passed after fixture/dependency repair in a targeted retry.
- Known broad explorer failures data.test.ts:296 and :609 were not rerun.
- Bun test required isolated temporary Ajv and Crust dependencies with qualified-name links. All temporary source links/dependencies and smoke scripts/fixtures were removed; no source resolver shim.
- The YAML guard conservatively rejects any # in non-JSON YAML, including quoted strings; documented.
- During the fix phase, no live tracker/workflow migration, immutable plan/event rewrite, merge, push, tracker completion, or formal review occurred.

The actual owning CLI smoke passed: invalid membership update and bulk reject byte-identically; unrelated bulk items upgrade independently; valid direct, hierarchical and standalone updates/checks work. Commented historical answers reject unchanged through the declared shared safe-upgrade command. Uncommented safe-upgrade, read-only plan/check and authorized setup init work. The smoke script and all disposable fixtures were removed.

## Validation commands and observed results

```json
[
  {
    "argv": [
      "mise",
      "exec",
      "--",
      "bun",
      "test",
      "mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts"
    ],
    "cwd": "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-04-tracker",
    "exit_code": 1,
    "result": "85 passed; 6 failed. Three newly authored v1 fixtures omitted required work_status/blocked_by fields; three subprocess cases lacked version-qualified Crust dependencies. Fixed fixtures and isolated dependencies; only those six cases retried."
  },
  {
    "argv": [
      "mise",
      "exec",
      "--",
      "bun",
      "test",
      "mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/records.test.ts",
      "mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/setup.test.ts",
      "--test-name-pattern",
      "membership projection rejects|ticket update and bulk reject|ticket updates support|declared shared setup upgrade|CLAUDE takes precedence|shared alignment preserves"
    ],
    "cwd": "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-04-tracker",
    "exit_code": 0,
    "result": "6 passed, 33 filtered, 0 failed; 61 assertions."
  },
  {
    "argv": [
      "mise",
      "exec",
      "--",
      "bun",
      "/tmp/tracker-fix-smoke.ts"
    ],
    "cwd": "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-04-tracker",
    "exit_code": 0,
    "result": "membership update rejects unchanged; bulk partial independently upgrades standalone; valid direct hierarchical and standalone updates/checks; commented shared safe-upgrade rejects unchanged; uncommented shared safe-upgrade succeeds; normal setup plan/check read-only and authorized init succeeds"
  },
  {
    "argv": [
      "mise",
      "run",
      "checks:agent-bundle-versions",
      "--",
      "check",
      "--staged"
    ],
    "cwd": "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-04-tracker",
    "exit_code": 0,
    "result": "Required staged release validation passed; matt-pocock and marketplace 0.1.13."
  },
  {
    "argv": [
      "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-04-tracker/mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/records.ts",
      "update",
      "--repository",
      "/tmp/tracker-fix-smoke-4AfY2d/repo",
      "--ticket",
      "T-1",
      "--request",
      "/tmp/tracker-fix-smoke-4AfY2d/request.json"
    ],
    "cwd": "/tmp/tracker-fix-smoke-4AfY2d/repo",
    "exit_code": 1,
    "result": "Expected safety rejection or partial bulk outcome; byte preservation asserted."
  },
  {
    "argv": [
      "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-04-tracker/mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/records.ts",
      "upgrade",
      "--repository",
      "/tmp/tracker-fix-smoke-4AfY2d/repo",
      "--artifacts",
      "/tmp/tracker-fix-smoke-4AfY2d/selected.json"
    ],
    "cwd": "/tmp/tracker-fix-smoke-4AfY2d/repo",
    "exit_code": 1,
    "result": "Expected safety rejection or partial bulk outcome; byte preservation asserted."
  },
  {
    "argv": [
      "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-04-tracker/mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/records.ts",
      "update",
      "--repository",
      "/tmp/tracker-fix-smoke-4AfY2d/repo",
      "--ticket",
      "T-1",
      "--request",
      "/tmp/tracker-fix-smoke-4AfY2d/request.json"
    ],
    "cwd": "/tmp/tracker-fix-smoke-4AfY2d/repo",
    "exit_code": 0,
    "result": "Expected successful owner operation; persisted behavior asserted."
  },
  {
    "argv": [
      "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-04-tracker/mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/records.ts",
      "update",
      "--repository",
      "/tmp/tracker-fix-smoke-4AfY2d/repo",
      "--ticket",
      "nested",
      "--request",
      "/tmp/tracker-fix-smoke-4AfY2d/request.json"
    ],
    "cwd": "/tmp/tracker-fix-smoke-4AfY2d/repo",
    "exit_code": 0,
    "result": "Expected successful owner operation; persisted behavior asserted."
  },
  {
    "argv": [
      "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-04-tracker/mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/records.ts",
      "update",
      "--repository",
      "/tmp/tracker-fix-smoke-4AfY2d/repo",
      "--ticket",
      "alone",
      "--request",
      "/tmp/tracker-fix-smoke-4AfY2d/request.json"
    ],
    "cwd": "/tmp/tracker-fix-smoke-4AfY2d/repo",
    "exit_code": 0,
    "result": "Expected successful owner operation; persisted behavior asserted."
  },
  {
    "argv": [
      "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-04-tracker/mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/records.ts",
      "check",
      "--repository",
      "/tmp/tracker-fix-smoke-4AfY2d/repo",
      "--ticket",
      "T-1"
    ],
    "cwd": "/tmp/tracker-fix-smoke-4AfY2d/repo",
    "exit_code": 0,
    "result": "Expected successful owner operation; persisted behavior asserted."
  },
  {
    "argv": [
      "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-04-tracker/mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/records.ts",
      "check",
      "--repository",
      "/tmp/tracker-fix-smoke-4AfY2d/repo",
      "--ticket",
      "nested"
    ],
    "cwd": "/tmp/tracker-fix-smoke-4AfY2d/repo",
    "exit_code": 0,
    "result": "Expected successful owner operation; persisted behavior asserted."
  },
  {
    "argv": [
      "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-04-tracker/mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/records.ts",
      "check",
      "--repository",
      "/tmp/tracker-fix-smoke-4AfY2d/repo",
      "--ticket",
      "alone"
    ],
    "cwd": "/tmp/tracker-fix-smoke-4AfY2d/repo",
    "exit_code": 0,
    "result": "Expected successful owner operation; persisted behavior asserted."
  },
  {
    "argv": [
      "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-04-tracker/mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/scripts/router.ts",
      "safe-upgrade",
      "--skill",
      "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-04-tracker/mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets",
      "--owner",
      "file:scripts/setup.ts",
      "--artifact",
      "/tmp/tracker-fix-smoke-4AfY2d/answers.yml",
      "--operation",
      "upgrade"
    ],
    "cwd": "/tmp/tracker-fix-smoke-4AfY2d/repo",
    "exit_code": 1,
    "result": "Expected safety rejection or partial bulk outcome; byte preservation asserted.",
    "diagnostic": "Cannot losslessly upgrade YAML containing '#'; retain the authored file and convert it with a comment-preserving editor.\n"
  },
  {
    "argv": [
      "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-04-tracker/mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/scripts/router.ts",
      "safe-upgrade",
      "--skill",
      "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-04-tracker/mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets",
      "--owner",
      "file:scripts/setup.ts",
      "--artifact",
      "/tmp/tracker-fix-smoke-4AfY2d/answers.yml",
      "--operation",
      "upgrade"
    ],
    "cwd": "/tmp/tracker-fix-smoke-4AfY2d/repo",
    "exit_code": 0,
    "result": "Expected successful owner operation; persisted behavior asserted."
  },
  {
    "argv": [
      "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-04-tracker/mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/setup.ts",
      "plan",
      "/tmp/tracker-fix-smoke-4AfY2d/setup",
      "--answers",
      "/tmp/tracker-fix-smoke-4AfY2d/answers.yml",
      "--shared-context",
      "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-04-tracker/mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/cli.ts",
      "--json"
    ],
    "cwd": "/tmp/tracker-fix-smoke-4AfY2d/repo",
    "exit_code": 0,
    "result": "Expected successful owner operation; persisted behavior asserted."
  },
  {
    "argv": [
      "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-04-tracker/mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/setup.ts",
      "init",
      "/tmp/tracker-fix-smoke-4AfY2d/setup",
      "--answers",
      "/tmp/tracker-fix-smoke-4AfY2d/answers.yml",
      "--shared-context",
      "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-04-tracker/mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/cli.ts",
      "--json"
    ],
    "cwd": "/tmp/tracker-fix-smoke-4AfY2d/repo",
    "exit_code": 0,
    "result": "Expected successful owner operation; persisted behavior asserted."
  },
  {
    "argv": [
      "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-04-tracker/mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/setup.ts",
      "check",
      "/tmp/tracker-fix-smoke-4AfY2d/setup",
      "--shared-context",
      "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-04-tracker/mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/cli.ts",
      "--json"
    ],
    "cwd": "/tmp/tracker-fix-smoke-4AfY2d/repo",
    "exit_code": 0,
    "result": "Expected successful owner operation; persisted behavior asserted."
  }
]
```

## Lifecycle and next review

Not merged or pushed. Canonical ticket and immutable history remain unchanged. Parent owns result acknowledgement, fixer shutdown, fix completion and metadata commits. [Parent completion](../events/fix-complete-0009.yaml) is recorded. Assigned delivery was acknowledged and fixer shutdown confirmed. Parent runtime checks rejected inconsistent-membership update/bulk and commented-answer conversion byte-identically; an uncommented answer control upgraded successfully. No child agents or services were launched by this fixer.

## Retained history

- [start-0001](../events/start-0001.yaml): phase-start, start, started; source cfd5af676f097aa7eae186357502972a03e0d61e.
- [implementation-0002](../events/implementation-0002.yaml): phase-result, implementation, completed; source b062761b4a31681f4e826c4e3dad8770e8944607.
- [start-complete-0003](../events/start-complete-0003.yaml): phase-complete, start, completed; source b062761b4a31681f4e826c4e3dad8770e8944607.
- [review-start-0004](../events/review-start-0004.yaml): phase-start, review, started; source b062761b4a31681f4e826c4e3dad8770e8944607.
- [review-0005](../events/review-0005.yaml): phase-result, review, completed, verdict FAILURE; source b062761b4a31681f4e826c4e3dad8770e8944607.
- [review-complete-0006](../events/review-complete-0006.yaml): phase-complete, review, completed; source b062761b4a31681f4e826c4e3dad8770e8944607.
- [fix-start-0007](../events/fix-start-0007.yaml): phase-start, fix, started; source b062761b4a31681f4e826c4e3dad8770e8944607.

## Supporting implementation

The [immutable implementation draft](../artifacts/snapshots/pr-draft-implementation-0002.md) and [implementation receipt](../events/implementation-0002.yaml) retain the original 53-file cutover and its validation.



## Current post-fix review

**SUCCESS** for `007dbbf52e4fc2da57ac10ebdafcf9e23c1adf4d`, tree `232b6a74548c15731a6fba4290a21936357c6ece`. Standards: zero findings. Spec: zero findings. SPEC-1 and SPEC-2 are independently resolved.

See [immutable review](../artifacts/reviews/review-review-0011.md), [review result](../events/review-0011.yaml), and [parent completion](../events/review-complete-0012.yaml). Prior [FAILURE review](../events/review-0005.yaml) remains immutable history for its old source.

Declared checks passed 145 owner/result tests, 33 delivery tests and five filtered explorer checks. Production CLI scenarios passed and the parent exercised the current owning check. The known broad explorer failures remain outside this claim. The quoted-# probe rejected at source validation; only the valid commented-YAML probe independently proves comment-guard execution.

Delivery acknowledged. All owned reviewer processes stopped and panes closed. Source and workspace remain available. No integration, merge or push has run; finish must validate the actual combined candidate.
