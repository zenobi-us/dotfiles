# Mutable view upgrade

This procedure applies only to generated `manifest.yaml` and `projections/latest-status.yaml` in the resolved workflow. It is not authority to mutate a workflow.

1. Validate the exact source contract and path with `scripts/view-contracts.ts`. Bind `manifest.yaml` to the `worktree-workflow` family and `projections/latest-status.yaml` to `worktree-latest-status`, for both current and historical versions. Swapped families fail before conversion or mutation, including public bulk upgrades.
2. For `worktree-workflow/v2` to `worktree-workflow/v3`, rename the scalar key `schema` to `schemaVersion` and change its value. For `worktree-latest-status/v1` to `worktree-latest-status/v2`, apply the same field change.
3. Preserve every other YAML node, unknown property, comment and authored value. Compare canonical YAML after normalizing only the contract key/value. Reject aliases, explicit tags and numeric values that cannot be represented safely.
4. Validate the destination and the requested generated-field update before replacing bytes through the shared safe-upgrade operation. All writers must honor its sibling lock.

No unversioned detector is declared. Unknown or conflicting identifiers fail. Events, receipts, reviews, snapshots and hash-linked history are immutable and have no upgrade path. Read them through their explicit historical readers. Rejected requests leave source bytes unchanged.

## Initiative boundary

Current manifests require `initiative: null` or a nonempty initiative ID containing letters, digits, dots, underscores or hyphens. Historical v2 validation retains its original semantics. Conversion requires an explicit valid initiative. Missing or invalid historical membership needs an owner decision; the converter never invents membership or writes a supposedly lossless upgrade.
