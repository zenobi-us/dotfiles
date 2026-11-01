# Create and publish

1. Resolve audience, workspace, collection, and parent from configuration and the request. Read the parent when supplied; confirm its collection and access boundary.
2. Inspect the evidence inventory. Build the body from the template and validate verdicts before creating remote content.
3. Record run identity and, when the deployed API supports it, a generated document UUID. Keep the recovery record in the existing workflow's protected evidence location, without credentials.
4. Call documents.create with the title, initial Markdown, resolved destination, and publish: false. Save the returned ID, URL, revision, and publication state immediately.
5. Upload images and companion files using attachments-and-access.md. Record returned attachment IDs and durable references. Update the draft with the completed links using a fresh revision guard.
6. Fetch and verify the saved draft. Inspect rendered headings before inserting summary links. Apply a guarded correction if Outline changed their destinations.
7. If the request authorises publication, call documents.update with id, the latest lastRevision, and publish: true. Otherwise leave the draft intact.
8. Fetch again. Verify publication state and, after publication, access for the intended audience. Return the report receipt described in verification.md.

## Ambiguous and partial outcomes

A timed-out create may have succeeded. Fetch the pre-recorded ID when supported.
Otherwise search and list within the resolved destination, including drafts accessible to the author, using run identity and creation context.
If absence is not established, stop automatic creation and report the unresolved candidates. A title alone cannot establish identity.
A failed attachment upload does not invalidate the document ID. Keep the draft, name the missing evidence, and do not publish a report that implies it is complete.
Do not automatically delete failed drafts or attachments that may be referenced elsewhere. Report their IDs for authorised cleanup.

## Publication boundary

New reports start as drafts, even when the eventual request is to publish.
Drafts may be visible only to their creator; disclose that state rather than treating it as reviewer-ready access.
An authorised publish request does not authorise new public shares, changed collection permissions, invitations, or moves to a broader collection.
If the requested audience cannot access the destination, report the access issue without widening permissions.
