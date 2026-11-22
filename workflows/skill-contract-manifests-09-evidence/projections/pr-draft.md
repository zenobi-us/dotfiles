---
title: Evidence contract PR draft
type: Concept
---

# Evidence contract implementation

## Ticket summary

Ticket: [skill-contract-manifests-09-evidence](../../../tracker/tickets/skill-contract-manifests-09-evidence.md).

## Problem statement

Evidence operations used legacy schema fields and lacked discoverable owner manifests. Historical records must remain immutable.

## Implementation summary

Declare collector and feedback contract manifests. Produce schemaVersion v2 plans, runs, acceptance records, results and annotations. Read v1 records without rewriting their headers, source snapshots or media. Reject historical workspace and session mutations. Keep report-generation ownership and publication approval separate.

Source branch: `feature/skill-contract-manifests-09-evidence`. Base: `master`.
Source commit: `dc75b3b33ab1f81c3c312cc38510dc3254ac2c5a`. Source tree: `4e9cb559406b7b44edff21343b39f715e90194d0`.

## Changed files

- **Source:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/SKILL.md`
- **Source:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/contracts.json`
- **Source:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/howto.md`
- **Source:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/references/drivers/playwright-cli.md`
- **Source:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/references/drivers/surf-cli.md`
- **Source:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/references/evidence-schema.md`
- **Source:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/references/evidence-v1.md`
- **Source:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/references/gui.md`
- **Source:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/references/manual-web-example.md`
- **Source:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/references/tui.md`
- **Source:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/references/web.md`
- **Source:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/drivers/gui-driver.ts`
- **Source:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/drivers/playwright-driver.ts`
- **Source:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/drivers/surf-driver.ts`
- **Source:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/drivers/tui-driver.ts`
- **Source:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/load-plan.ts`
- **Source:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/pipeline.ts`
- **Source:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/plan.ts`
- **Source:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/records.ts`
- **Source:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/browser-workflow.test.ts`
- **Source:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/fixture.ts`
- **Source:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/gui-workflow.test.ts`
- **Source:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/native-workflow.test.ts`
- **Source:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/workflow.test.ts`
- **Source:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/collect-evidence.ts`
- **Source:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/CHANGELOG.md`
- **Source:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/SKILL.md`
- **Source:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/contracts.json`
- **Source:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/howto.md`
- **Source:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/references/cli.md`
- **Source:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/references/feedback-v1.md`
- **Source:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/references/request.md`
- **Source:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/references/system.md`
- **Source:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/references/viewer-contract.md`
- **Source:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/annotations.ts`
- **Source:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/commands.ts`
- **Source:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/records.ts`
- **Source:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/request.ts`
- **Source:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/server.ts`
- **Source:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/history-workflow.test.ts`
- **Source:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/request-workflow.test.ts`
- **Source:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/video-workflow.test.ts`
- **Source:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/workflow.test.ts`
- **Source:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/index.html`
- **Source:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/src/components/annotation-image.tsx`
- **Source:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/src/drafts.tsx`
- **Source:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/src/main.tsx`
- **Source:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/src/types.ts`
- **Source:** `mise/conf.d/devtools-agent/bundles/developer/skills/devtools/writing-reports/scripts/report-cli.ts`
- **Source:** `mise/conf.d/devtools-agent/bundles/developer/skills/devtools/writing-reports/scripts/test/report-cli.test.ts`

## Validation results

The final complete focused suite passed: 111 tests, 33 opt-in skips, no failures. The real native capture and browser save were separate smoke checks.

Earlier test attempts found an over-broad fixture header edit and an unavailable default Chrome path. The fixture header now retains shared-context ownership. Tests use the existing Chromium executable. Two stale missing-file expectations now match the existing operation-error exit code 1. Production filesystem error semantics did not change.

### Check 1

```sh
/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-09-evidence/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/collect-evidence.ts validate /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles/workflows/skill-contract-manifests-09-evidence/artifacts/evidence/contracts-current-0003 --json
```

CWD: `/tmp`. Outcome: passed; exit 0. 

### Check 2

```sh
/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-09-evidence/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/collect-evidence.ts verdicts /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles/workflows/skill-contract-manifests-09-evidence/artifacts/evidence/contracts-current-0003 --json
```

CWD: `/tmp`. Outcome: passed; exit 0. 

### Check 3

```sh
/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-09-evidence/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/collect-evidence.ts report /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles/workflows/skill-contract-manifests-09-evidence/artifacts/evidence/contracts-current-0003 --historical --json
```

CWD: `/tmp`. Outcome: passed; exit 0. 

### Check 4

```sh
/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-09-evidence/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/collect-evidence.ts render /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles/workflows/skill-contract-manifests-09-evidence/artifacts/evidence/contracts-current-0003 --force --json
```

CWD: `/tmp`. Outcome: passed; exit 2. 

### Check 5

```sh
/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-09-evidence/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/collect-evidence.ts comment /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles/workflows/skill-contract-manifests-09-evidence/artifacts/evidence/contracts-current-0003 --json
```

CWD: `/tmp`. Outcome: passed; exit 2. 

### Check 6

```sh
/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-09-evidence/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/collect-evidence.ts validate /tmp/skill-contract-evidence-09-history --json
```

CWD: `/tmp`. Outcome: passed; exit 0. 

### Check 7

```sh
/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-09-evidence/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/collect-evidence.ts verdicts /tmp/skill-contract-evidence-09-history --json
```

CWD: `/tmp`. Outcome: passed; exit 0. 

### Check 8

```sh
/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-09-evidence/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/collect-evidence.ts report /tmp/skill-contract-evidence-09-history --historical --json
```

CWD: `/tmp`. Outcome: passed; exit 0. 

### Check 9

```sh
/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-09-evidence/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/collect-evidence.ts render /tmp/skill-contract-evidence-09-history --force --json
```

CWD: `/tmp`. Outcome: passed; exit 2. 

### Check 10

```sh
/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-09-evidence/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/collect-evidence.ts comment /tmp/skill-contract-evidence-09-history --json
```

CWD: `/tmp`. Outcome: passed; exit 2. 

### Check 11

```sh
/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-09-evidence/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback.ts init /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles/workflows/skill-contract-manifests-09-evidence/artifacts/evidence/contracts-current-0003 --repository /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles --workflow skill-contract-manifests-09-evidence --session contracts-feedback-current-0001 --json
```

CWD: `/tmp`. Outcome: passed; exit 0. 

### Check 12

```sh
/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-09-evidence/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback.ts validate /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles/workflows/skill-contract-manifests-09-evidence/artifacts/evidence/contracts-feedback-current-0001 --json
```

CWD: `/tmp`. Outcome: passed; exit 0. 

### Check 13

```sh
/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-09-evidence/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback.ts export /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles/workflows/skill-contract-manifests-09-evidence/artifacts/evidence/contracts-feedback-current-0001 --json
```

CWD: `/tmp`. Outcome: passed; exit 0. 

### Check 14

```sh
/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-09-evidence/mise/conf.d/devtools-agent/bundles/developer/skills/devtools/writing-reports/scripts/report-cli.ts evidence /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles/workflows/skill-contract-manifests-09-evidence/artifacts/evidence/contracts-feedback-current-0001 --feedback --json
```

CWD: `/tmp`. Outcome: passed; exit 0. 

### Check 15

```sh
/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-09-evidence/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback.ts init /tmp/skill-contract-evidence-09-history --repository /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles --workflow skill-contract-manifests-09-evidence --session contracts-feedback-historical-0001 --historical --json
```

CWD: `/tmp`. Outcome: passed; exit 0. 

### Check 16

```sh
/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-09-evidence/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback.ts validate /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles/workflows/skill-contract-manifests-09-evidence/artifacts/evidence/contracts-feedback-historical-0001 --json
```

CWD: `/tmp`. Outcome: passed; exit 0. 

### Check 17

```sh
/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-09-evidence/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback.ts export /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles/workflows/skill-contract-manifests-09-evidence/artifacts/evidence/contracts-feedback-historical-0001 --json
```

CWD: `/tmp`. Outcome: passed; exit 0. 

### Check 18

```sh
/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-09-evidence/mise/conf.d/devtools-agent/bundles/developer/skills/devtools/writing-reports/scripts/report-cli.ts evidence /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles/workflows/skill-contract-manifests-09-evidence/artifacts/evidence/contracts-feedback-historical-0001 --feedback --json
```

CWD: `/tmp`. Outcome: passed; exit 0. 

### Check 19

```sh
/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-09-evidence/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback.ts export /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles/workflows/skill-contract-manifests-09-evidence/artifacts/evidence/contracts-feedback-current-0001 --json
```

CWD: `/tmp`. Outcome: passed; exit 0. 

### Check 20

```sh
/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-09-evidence/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/collect-evidence.ts render /tmp/skill-contract-evidence-09-unsafe --json
```

CWD: `/tmp`. Outcome: passed; exit 2. 

### Check 21

```sh
/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-09-evidence/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/collect-evidence.ts compile /tmp/skill-contract-evidence-09-unsafe --json
```

CWD: `/tmp`. Outcome: passed; exit 2. 

### Check 22

```sh
/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-09-evidence/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/collect-evidence.ts run /tmp/skill-contract-evidence-09-unsafe --json
```

CWD: `/tmp`. Outcome: passed; exit 2. 

### Check 23

```sh
/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-09-evidence/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/collect-evidence.ts validate /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles/workflows/skill-contract-manifests-09-evidence/artifacts/evidence/contracts-current-0001 --json
```

CWD: `/tmp`. Outcome: passed; exit 0. 

### Check 24

```sh
/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-09-evidence/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/collect-evidence.ts validate /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles/workflows/skill-contract-manifests-09-evidence/artifacts/evidence/contracts-current-0002 --json
```

CWD: `/tmp`. Outcome: passed; exit 0. 

### Check 25

```sh
/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-09-evidence/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/collect-evidence.ts validate /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles/workflows/skill-contract-manifests-09-evidence/artifacts/evidence/contracts-current-0003 --json
```

CWD: `/tmp`. Outcome: passed; exit 0. 

### Check 26

```sh
mise exec -- env PLAYWRIGHT_MCP_EXECUTABLE_PATH=/home/zenobius/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome bun test mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test mise/conf.d/devtools-agent/bundles/developer/skills/devtools/writing-reports/scripts/test/report-cli.test.ts
```

CWD: `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-09-evidence`. Outcome: passed; exit 0. 111 pass, 33 opt-in skips, 0 fail; 1237 assertions across 11 files

### Check 27

```sh
mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/scripts/router.ts validate --skill mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence
```

CWD: `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-09-evidence`. Outcome: passed; exit 0. 

### Check 28

```sh
mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/scripts/router.ts validate --skill mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback
```

CWD: `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-09-evidence`. Outcome: passed; exit 0. 

### Check 29

```sh
mise exec -- bun install --frozen-lockfile
```

CWD: `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-09-evidence/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer`. Outcome: passed; exit 0. 

### Check 30

```sh
mise exec -- bun run typecheck
```

CWD: `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-09-evidence/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer`. Outcome: passed; exit 0. 

### Check 31

```sh
mise exec -- bun run build
```

CWD: `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-09-evidence/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer`. Outcome: passed; exit 0. Embedded viewer rebuilt to 345999 bytes

### Check 32

```sh
mise exec -- npx react-doctor@latest --verbose --scope changed
```

CWD: `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-09-evidence/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer`. Outcome: passed; exit 0. 66/100; no changed-scope issues reported

### Check 33

```sh
mise exec -- env PATH=/home/zenobius/.local/share/collect-evidence/native-tools/fedora-45-x86_64/bin:/home/zenobius/.local/share/mise/shims:/usr/local/bin:/usr/bin /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-09-evidence/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/collect-evidence.ts run /tmp/skill-contract-evidence-09-current --json
```

CWD: `/tmp`. Outcome: failed; exit 1. Authored smoke command escaping failed; retained sealed failed assertion

### Check 34

```sh
mise exec -- env PATH=/home/zenobius/.local/share/collect-evidence/native-tools/fedora-45-x86_64/bin:/home/zenobius/.local/share/mise/shims:/usr/local/bin:/usr/bin /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-09-evidence/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/collect-evidence.ts run /tmp/skill-contract-evidence-09-current2 --json
```

CWD: `/tmp`. Outcome: failed; exit 1. Native OCR returned Current_record; retained original screenshot and failed assertion

### Check 35

```sh
mise exec -- env PATH=/home/zenobius/.local/share/collect-evidence/native-tools/fedora-45-x86_64/bin:/home/zenobius/.local/share/mise/shims:/usr/local/bin:/usr/bin /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-09-evidence/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/collect-evidence.ts run /tmp/skill-contract-evidence-09-current3 --json
```

CWD: `/tmp`. Outcome: passed; exit 0. PASS; real 1280x720 native PNG, text, colour and line-position assertions

### Check 36

```sh
Browser smoke at http://127.0.0.1:48179: select original capture, create point, save comment, reload, GET /api/v1/export
```

CWD: `/tmp`. Outcome: passed; exit not applicable. Actual bundled viewer saved revision 1 under collect-feedback/v2; sourceSha256 80b3e55a45d9f6543a6004e1f85bc87799285e822d32eb9e232c7f9c3f655b14; tab closed

### Check 37

```sh
/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-09-evidence/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/collect-evidence.ts init /tmp/skill-contract-evidence-09-current --repository /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles --workflow skill-contract-manifests-09-evidence --run contracts-current-0001 --driver tui --json
```

CWD: `/tmp`. Outcome: passed; exit 0. 

### Check 38

```sh
/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-09-evidence/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/collect-evidence.ts render /tmp/skill-contract-evidence-09-current --json
```

CWD: `/tmp`. Outcome: passed; exit 0. 

### Check 39

```sh
/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-09-evidence/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/collect-evidence.ts compile /tmp/skill-contract-evidence-09-current --json
```

CWD: `/tmp`. Outcome: passed; exit 0. 

### Check 40

```sh
/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-09-evidence/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/collect-evidence.ts init /tmp/skill-contract-evidence-09-current2 --repository /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles --workflow skill-contract-manifests-09-evidence --run contracts-current-0002 --driver tui --json
```

CWD: `/tmp`. Outcome: passed; exit 0. 

### Check 41

```sh
/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-09-evidence/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/collect-evidence.ts render /tmp/skill-contract-evidence-09-current2 --json
```

CWD: `/tmp`. Outcome: passed; exit 0. 

### Check 42

```sh
/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-09-evidence/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/collect-evidence.ts compile /tmp/skill-contract-evidence-09-current2 --json
```

CWD: `/tmp`. Outcome: passed; exit 0. 

### Check 43

```sh
/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-09-evidence/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/collect-evidence.ts init /tmp/skill-contract-evidence-09-current3 --repository /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles --workflow skill-contract-manifests-09-evidence --run contracts-current-0003 --driver tui --json
```

CWD: `/tmp`. Outcome: passed; exit 0. 

### Check 44

```sh
/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-09-evidence/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/collect-evidence.ts render /tmp/skill-contract-evidence-09-current3 --json
```

CWD: `/tmp`. Outcome: passed; exit 0. 

### Check 45

```sh
/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-09-evidence/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/collect-evidence.ts compile /tmp/skill-contract-evidence-09-current3 --json
```

CWD: `/tmp`. Outcome: passed; exit 0. 

### Check 46

```sh
SHA-256 tree equality before/after current and historical validate, verdicts, reports, imports, exports and rejected historical planning
```

CWD: `not applicable`. Outcome: passed; exit not applicable. Original current v2 run and real archived v1 run unchanged; imported source snapshots byte-identical; historical session rejected mutations unchanged in regression test

### Check 47

```sh
Owned-resource observation: port 48179 closed; /proc/263168 absent before removing its stale lock; .writer.lock absent; native runtimes and Cage/foot PIDs absent
```

CWD: `not applicable`. Outcome: passed; exit not applicable. Viewer tab closed; only confirmed stopped owned lock removed. Native ce-tui-1644304a-5bdc-4cca-8305-e4e85d6a6c3d and ce-tui-74320cfc-6440-4b38-8922-7d51c455d897 released. Owned temporary workspaces removed.

## Evidence and failed attempts

- **Evidence:** [artifacts/evidence/contracts-current-0001](../artifacts/evidence/contracts-current-0001).
- **Evidence:** [artifacts/evidence/contracts-current-0002](../artifacts/evidence/contracts-current-0002).
- **Evidence:** [artifacts/evidence/contracts-current-0003](../artifacts/evidence/contracts-current-0003).
- **Evidence:** [artifacts/evidence/contracts-feedback-current-0001](../artifacts/evidence/contracts-feedback-current-0001).
- **Evidence:** [artifacts/evidence/contracts-feedback-historical-0001](../artifacts/evidence/contracts-feedback-historical-0001).

`contracts-current-0001` retains a failed authored-command escape attempt. `contracts-current-0002` retains the original real PNG and a failed OCR line assertion. `contracts-current-0003` passed after the smoke text used distinguishable words. No failed run was overwritten or relabelled.

The current feedback session contains the browser-saved v2 annotation. The historical feedback session contains an unchanged source snapshot of the real v1 archive. PNG and WebM bytes receive no version fields.

## Review history

Independent review has not been performed. This implementation does not supply a review verdict.

## Resolved findings

No formal review findings exist yet.

## Remaining findings

No known implementation blocker remains. Independent review is the next phase. Native and Surf opt-in tests remain skipped in the general suite; native capture was exercised directly. External publication was not exercised because separate access approval was not supplied.

## Latest reviewer verdict

Not yet reviewed.

## Merge status

Not merged or pushed. The ticket remains claimed. Global plugin and marketplace metadata remain unchanged after reverting the commit hook's out-of-scope version bump.

## Supporting receipts and artifacts

- **Authorization:** [start-0001](../events/start-0001.yaml).
- **Implementation result:** [implementation-0002](../events/implementation-0002.yaml), reserved for the owning writer after this snapshot.
- **Immutable snapshot:** `artifacts/snapshots/pr-draft-implementation-0002.md`.
- **Current views:** `projections/pr-draft.md`, `projections/implementation-log.md`, `projections/latest-status.yaml`, `manifest.yaml`.

## Resource ownership and cleanup

The collector used fresh private terminals. Native metadata records released sessions, runtimes, sockets, Cage and foot PIDs. The checked runtimes and PIDs are absent. The browser smoke opened and closed only its own tab. The owned viewer process is stopped and port 48179 is closed. The service stop left one stale lock. Its recorded PID 263168 was absent before removal of that exact owned lock. No writer lock remains. Temporary authored workspaces and historical copies were removed. Sealed runs and feedback data remain in the resolved context checkout.

## Open questions

None. External publication still needs separate access approval; it is not part of this local implementation result.

