---
schema: "tracker-ticket/v1"
id: "worktree-receipt-recovery-05-worktree"
title: "Recover a moved or removed source worktree"
type: "enhancement"
triage: "ready-for-agent"
work_status: "unclaimed"
parent: "worktree-receipt-recovery"
sequence: 5
blocked_by: ["worktree-receipt-recovery-04-repair"]
---

## What to build

Recovery must locate a moved source checkout or recreate retained committed source through Worktrunk. Record verified recovery evidence without hiding lost work.

## Acceptance criteria

- [ ] For a moved checkout, locate candidates through Worktrunk and verify repository, branch, commit, and tree before selecting the source.
- [ ] If more than one candidate remains, report ambiguity. Do not silently use the current directory.
- [ ] For a removed checkout, recreate retained committed source through Worktrunk only when source evidence supports recovery and ownership permits it.
- [ ] Preserve existing changes. Do not overwrite a checkout or terminate an owner as an implied recovery action.
- [ ] Record relocation or recreation through the approved append-only repair procedure. Inspect the recovered source before selecting the next phase.
- [ ] If uncommitted source has no retained copy, report it as unrecoverable. Do not claim complete recovery from a commit alone.
- [ ] Exercise moved-checkout recovery, removed-checkout recreation, ambiguous candidates, and absent retained source.

## Comments

