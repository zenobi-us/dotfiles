# Recover result delivery

Read this reference after a missing, conflicting or interrupted delivery.

1. Identify the run, operation and caller-approved target. Keep existing domain records and process signals. Do not reset their identities or overwrite the result.
2. Inspect the owning operation's actual state. A missing result is not proof that a mutation did not occur. A terminal process signal is not proof that it succeeded.
3. Read the existing result with its original context. Verify schema, identity and hash. If a domain result was written but delivery failed, use the retained recovery JSON and the original context. Do not rerun the domain mutation.
4. Repeat delivery only for the same identity and payload. Matching duplicates are harmless. A changed payload or target identity is a conflict, not a force-overwrite case.
5. Resume a blocked child through its muxer. Continue waiting after the reported signal sequence. Do not start a duplicate child while the prior owner can still be active.
6. If access or ownership is unknown, stop and state the missing prerequisite. Do not invent a public URL, copy private data across access boundaries or use Git publication as notification.
7. Acknowledge only after the parent verifies the operation and its required publication. Acknowledgement never deletes an authoritative receipt.

If the operation succeeded but delivery failed, report both facts. If canonical state remains uncertain, report that uncertainty. A pretty summary must not hide a failed check or pending publication.

