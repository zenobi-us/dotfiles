---
date: 2026-11-04
status: accepted
title: Pi Ink cleanup trust boundary
type: Decision
---

# Pi Ink cleanup uses a trusted, exclusive operation

Use cable-connected SSH for the bounded Pi Ink config-identity operation. Protect against operator mistakes, unexpected files, symlinks, and stale identities. Assume no other privileged process deliberately replaces files during the operation; the owner must provide exclusive access. This avoids requiring another descriptor-safe executor to deploy the reader.

## Operation limits

1. Create a new root-only helper directory. If its path is occupied, stop. Transfer the pinned ARM64 reader and verify its hash. Do not overwrite existing files or change their permissions.
2. Run the reader once. Obtain only the two config hashes and approved metadata. Keep the reader’s no-symlink, ownership, size, and file-identity checks. Do not print or copy config values.
3. After the reader process stops, verify helper identity. Remove only that helper and its proven-empty directory. If process state or identity is uncertain, preserve them.
4. On failure, stop. Do not retry, broaden investigation, restart services, or delete older experiment files. Older experiment cleanup requires a separate fixed manifest and approval.

## Decision boundary

The owner confirmed this design on 4 November 2026. Design confirmation does not authorize device access, staging, execution, or deletion. Obtain separate exact execution approval before a tablet connection. This decision does not change the ticket acceptance criteria or clear production blockers.

This decision replaces only the separate descriptor-safe deployment-executor prerequisite in the [earlier device proposal](../../workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/offline-reader-0029/device-proposal.json). Preserve that proposal as historical evidence. No reader source or binary change is required by this decision. A concrete deployment script must still be prepared and reviewed before execution approval.

See the [confirmed design record](../../workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/cleanup-design-confirmed-20261104/confirmation.json) for the scope and confirmation sequence.

