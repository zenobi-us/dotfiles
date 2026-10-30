# Record a review

1. For a worktree review, use the immutable artifact and verdict supplied by the worktree workflow. Append only the verdict, exact reviewed commit/tree, timestamp and artifact link to ticket comments; preserve earlier history. The worktree shared recovery decision owns whether to reconcile a valid result or rerun a missing/unusable review in a fresh session. Source changes invalidate both SUCCESS and FAILURE; never infer a current verdict from tracker comments alone.
2. For a review without a worktree workflow, store the complete review once as a native tracker comment. For local Markdown, append it under `## Comments`.
3. Do not create a second review artifact or copy a worktree review body into the ticket.
4. Return the ticket identity, review verdict, and comment or artifact reference.