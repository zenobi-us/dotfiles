# Changelog

## 2026-11-22

- Declare worktree-owned contracts and references to tracker, delivery and shared-context owners.
- Produce v3 receipts through v2 phase contexts; retain v1/v2 history and assigned delivery handoffs unchanged.
- Read v2 coordinator events without rewriting retained journals. Version inspection and coordination output.
- Upgrade mutable manifests and latest-status views only before authorized status updates. Preserve YAML comments and reject unsafe or immutable input.
