---
schema: "tracker-ticket/v1"
id: "worktree-receipt-recovery-02-identity"
title: "Generate receipt identity from verified phase context"
type: "enhancement"
triage: "ready-for-agent"
work_status: "unclaimed"
parent: "worktree-receipt-recovery"
sequence: 2
blocked_by: ["worktree-receipt-recovery-01-validation"]
---

## What to build

Agents must supply outcomes and evidence instead of copying the receipt envelope. Generate identity from validated phase context and observed source state.

## Acceptance criteria

- [ ] Obtain ticket, workflow, parent receipt, and session identity from validated phase context. Reject missing or inconsistent identity before publication.
- [ ] Resolve the source worktree root once. Populate worktree and workspace_path with the same verified absolute path.
- [ ] Read the source branch, commit, and tree through Git at publication. Compare observed identity with the applicable phase expectations.
- [ ] For review, preserve the frozen source identity. Reject source changes instead of silently recording a different reviewed source.
- [ ] Keep the execution directory separate from the source worktree. Permit a parent finish session to run elsewhere without changing source identity.
- [ ] Update parent, implementation, review, fix, submit, and finish receipt producers to use generated identity. Keep worktree-receipt/v1.
- [ ] Exercise receipt publication from a different execution directory and rejection of a wrong source checkout.

## Comments

