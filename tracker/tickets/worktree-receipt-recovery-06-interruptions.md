---
schema: "tracker-ticket/v1"
id: "worktree-receipt-recovery-06-interruptions"
title: "Guide interrupted workflows through existing recovery actions"
type: "enhancement"
triage: "ready-for-agent"
work_status: "unclaimed"
parent: "worktree-receipt-recovery"
sequence: 6
blocked_by: ["worktree-receipt-recovery-03-blockers"]
---

## What to build

Operators must be able to execute supported recovery decisions through the existing phase procedures. Do not require operators to reconstruct recovery steps from receipts.

## Acceptance criteria

- [ ] For a valid child result without parent completion, verify the result, artifacts, source identity, and shutdown. Append the missing parent completion without repeating child work.
- [ ] If review evidence is missing or unusable, require a fresh review of clean, frozen source. Never infer a verdict from tracker state.
- [ ] If source changed after review, require a fresh review before fixing or finishing.
- [ ] If ownership is unknown, inspect the recorded session and reservations. Require takeover approval where the existing recovery contract requires it. A timeout alone does not prove shutdown.
- [ ] For interrupted finish, inspect integration, publication, ticket completion, and cleanup. Do not repeat a verified merge.
- [ ] Reinspect before each recovery mutation. Record consumed evidence and actual recovery results in append-only receipts.
- [ ] Exercise missing parent completion, missing review evidence, unknown ownership, and already-integrated finish through the supported recovery procedures.

## Comments

