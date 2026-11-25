# Changelog

## 2026-11-26

- Failed or blocked start, implementation and fix completions can retain dirty partial source from matching unsuccessful results. The child commit and tree remain fixed. Successful work, review, submit and finish still require clean source.

- Allow a new phase-start to use its own goal dispatch reservation. Keep the goal run fixed, and reject changed dispatch identity on child results and parent completions.

## 2026-11-22

- Infer strict source identity changes independently of transition markers; require exact candidate approval for frozen substitutions while allowing same-source implementation and fix advancement.

- Validate approved source ancestry and the original base during inspection as well as publication; report unavailable ancestry in read-only coordination.

- Allow a separate conflict-resolution source only through exact operator approval and a fresh review; preserve original source ancestry and historical receipts.

- Reject swapped manifest/status contract families before owning updates and bulk upgrades.

- Reject fresh v2 starts; restrict v2 production to retained assigned results and historical reconciliation.

- Declare worktree-owned contracts and references to tracker, delivery and shared-context owners.
- Produce v3 receipts through v2 phase contexts; retain v1/v2 history and assigned delivery handoffs unchanged.
- Read v2 coordinator events without rewriting retained journals. Version inspection and coordination output.
- Upgrade mutable manifests and latest-status views only before authorized status updates. Preserve YAML comments and reject unsafe or immutable input.

- Require explicit current manifest initiative; preserve historical validation and stop ambiguous upgrades for an owner decision.
- Reconcile retained v2 start completions with implementation results without weakening new-write gates.
- Resolve the approved shared-context owner definition and validate current/retained location inputs without rewriting snapshot hashes.
