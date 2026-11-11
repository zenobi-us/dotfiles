---
blocked_by: 
  - skill-contract-manifests-01-local-definitions
id: skill-contract-manifests-02-historical-definitions
parent: skill-contract-manifests
schema: tracker-ticket/v1
sequence: 2
title: Resolve pinned historical definitions
triage: ready-for-agent
type: enhancement
work_status: unclaimed
---

## What to build

Resolve authoritative historical definitions from an explicitly declared source repository without changing a checkout.

Implement this slice under the parent initiative. Preserve its contract ownership, safety boundaries, and scope limits.

## Acceptance criteria

- [ ] Require sourceRepository for git: references. Require a full immutable commit ID and a repository-root-relative path; reject branches, tags, and abbreviated IDs.
- [ ] Resolve against the declared repository rather than the caller checkout. Fetch unavailable objects from that source when possible.
- [ ] If the object, repository, or definition cannot be resolved, reject the affected operation without revision substitution or a successful validation claim.
- [ ] Exercise public resolution with a caller in another repository, an initially missing object, invalid pins, and unavailable content. Verify caller and installed-skill checkouts remain unchanged.

## Verification

Exercise the changed behaviour through actual owning commands, not helper tests alone. Check persisted content and rejected operations. Update affected guidance and examples with the implementation.

## Comments

