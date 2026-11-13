# Update a record

For an initiative/spec or child membership change, follow [Initiative publication](initiative.md). Reparenting must update both affected initiatives and the child's parent. Use the steps below for ticket content and dependency changes.

1. Read the current ticket before changing it.
2. Change only the fields the user named. Preserve unknown fields, body sections, and comments.
3. If dependency edges change, follow [Cross-initiative dependencies](../schema.md#cross-initiative-dependencies). Verify every canonical reference across initiative boundaries, reject self-links and cycles, confirm each edge is a real start-time dependency, and confirm a completed blocker does not need to remain open. Keep resource reservations separate.
4. Read the ticket back. Report the changed fields and dependency edges.