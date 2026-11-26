# Lossless assessment upgrade

The declared procedure is file:references/assessment-upgrade.md. The installed adapter is file:scripts/assessment-contracts.ts, relative to the iso-24495-4 skill directory.

1. Obtain authorization for the selected mutation or explicit conversion. Read-only inspection never grants conversion authority.
2. Use the shared skill-contracts safe-upgrade or bulk-upgrade command. Resolve that installed skill directory and invoke its absolute scripts/router.ts from the caller directory. Pass --skill with the absolute iso-24495-4 directory and --owner file:scripts/assessment-contracts.ts. Bulk conversion uses --artifacts with an explicit JSON array of selected absolute paths.
3. Identify exactly one unversioned v1 shape. Reject explicit identities other than the matching current v2. Validate complete source content, including historic snapshot entries. Reject ambiguous JSON keys or numbers that cannot round-trip.
4. Follow only the matching family/v1 to family/v2 edge. Add schemaVersion while retaining every content field. The destination must satisfy the same content invariants and the required current identity; changing a label on invalid content fails. The shared layer compares all authored content before persistence.
5. Refuse immutable: true and paths with events, snapshots, receipts, or artifacts components. Use historical readers for these records. Do not select immutable evidence for bulk conversion.
6. For the owning report append, accept only a validated snapshot and the expected prior authored state. Reject changed state. Append exactly one entry, retaining the complete prior array and all container fields. Validate the resulting v2 state under the shared lock before atomic replacement.

All five families have one lossless declared edge. Explicit conversion can produce current answers; scoring itself only reads answers. No other mutation is supported. The shared writer owns locking, filesystem safety, preservation checks, and atomic replacement. Failed source, destination, preservation, or path checks leave original bytes unchanged. Report any post-commit cleanup failure as a failure with its actual persistence outcome.
