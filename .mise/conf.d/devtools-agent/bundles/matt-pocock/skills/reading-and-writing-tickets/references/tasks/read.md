# Read a ticket

1. Resolve the selector with the configured store. Reject ambiguous selectors.
2. Read the complete ticket. Include its body, comments, status, and direct blockers when the store exposes them.
3. Return the ticket identifier and canonical `ref`.
4. Do not infer missing fields or relationships.