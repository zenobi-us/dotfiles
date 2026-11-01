# Update and conflicts

1. Resolve the target by document ID or its Outline URL. Search only to discover candidates. Confirm the destination and report identity before writing.
2. Call documents.info. Keep its text, revision, location, and publication state as the update baseline in a protected recovery record.
3. Compare the requested change with that baseline. Keep unrelated human sections, companion links, earlier evidence, and check IDs.
4. Reconcile the current summary, affected evidence, findings, gaps, cleanup state, and update history. Mark superseded observations with dates and evidence links.
5. Call documents.update with id, lastRevision from the baseline, explicit editMode: replace, and the merged text. Omit publication and location fields unless explicitly changing them.
6. On success, fetch again and verify the changed checks and unaffected content. Do not silently unpublish, move, or share the document.

## Conflict handling

A 409 rejects the stale write. Fetch the latest document and compare baseline, intended content, and current content.
Merge disjoint changes. If both editors changed the same finding incompatibly, keep both observations and resolve the contradiction before writing a new verdict.
If resolution requires a human decision, leave remote content intact and state exactly which claims conflict.
Validate the merged report, then submit against the newly fetched revision. Never remove lastRevision to bypass the conflict.
Do not loop stale writes or blindly append the same update. A successful write followed by a lost response may already contain the change.

## Servers without revision guards

Check version support before the first mutation. A read immediately before writing does not prevent a concurrent edit.
If lastRevision is unavailable, stop automatic shared-report replacement. Obtain an explicit exclusive editing arrangement or upgrade support before writing.
State that any agreed fallback is not atomic. Do not silently downgrade to unguarded replacement, patch, append, or prepend.

## Ambiguous response and recovery

After a timeout, fetch by ID and compare intended changes with saved content.
If the update is present, verify it rather than resending it.
If it is absent, reconcile against the newly fetched revision before another attempt.
Keep the baseline for recovery, but never restore a whole old revision automatically: restoration can erase newer human edits.
