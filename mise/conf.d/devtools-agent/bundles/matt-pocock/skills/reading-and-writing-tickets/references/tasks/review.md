# Record a review

1. For a worktree review, use the review artifact path and verdict supplied by the worktree workflow. Add only the verdict and artifact link to the ticket comments.
2. For a review without a worktree workflow, store the complete review once as a native tracker comment. For local Markdown, append it under `## Comments`.
3. Do not create a second review artifact or copy a worktree review body into the ticket.
4. Return the ticket identity, review verdict, and comment or artifact reference.