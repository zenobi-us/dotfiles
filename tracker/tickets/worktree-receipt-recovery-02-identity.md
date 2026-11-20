---
schema: "tracker-ticket/v1"
id: "worktree-receipt-recovery-02-identity"
title: "Generate receipt identity from verified phase context"
type: "enhancement"
triage: "ready-for-agent"
work_status: "implemented"
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


- Review FAILURE at 2026-11-19T11:37:22.073Z. Reviewed commit `29c1f3244006803965c13655f8de9ae3b642c8fb`, tree `96648df74d25b9edbb372b94e06248b3d8eb9794`. [Independent review artifact](../../workflows/worktree-receipt-recovery-02-identity/artifacts/reviews/review-review-0005.md).

- Review FAILURE at 2026-11-19T21:09:42.792Z. Reviewed commit `542aeda624bf79ca1df866e939402f9e68d69955`, tree `d0bbad25b4c5af2e76bd8d41de8bc1098bf38820`. [Independent review artifact](../../workflows/worktree-receipt-recovery-02-identity/artifacts/reviews/review-review-0012.md).

- Review FAILURE at 2026-11-20T00:15:10.358Z. Reviewed commit `c54b293d8e3079803babe8e4a5dbb075f95d749b`, tree `25ea26786dbeaf944d4bee9fcf64629f4da78a3e`. [Independent review artifact](../../workflows/worktree-receipt-recovery-02-identity/artifacts/reviews/review-review-0020.md).


- Review FAILURE at 2026-11-20T02:13:58.895Z. Reviewed commit `05c403f8b9707d11418c07756d334335b139e32b`, tree `49d6b3b7ffc0c6d6478e52a0031acd9ad719a423`. [Independent review artifact](../../workflows/worktree-receipt-recovery-02-identity/artifacts/reviews/review-review-0028.md).

