---
id: herdr-query-cache
schema: tracker-initiative/v1
title: Shared-context query caching
type: Concept
---

# Shared-context query caching

## Problem

The shared-context panel repeats remote queries to refresh data. The panel needs a local cache and a small validation request that identifies which cached results need refresh.

## Outcome

The panel shows cached query results promptly. One batched helper request identifies unchanged, changed, removed, and unknown results. The panel refreshes affected results and their dependencies without fetching unchanged result bodies.

## Scope

- **Local storage:** Keep bounded memory and disk caches for read-only query results.
- **Cache identity:** Separate machines, remote users, canonical repository paths, context routes, query arguments, cache schemas, and loader versions. Repository origin alone does not identify a cache.
- **Dependency observations:** Record the files, collection membership, Git state, and derived-result versions that affect each result.
- **Batched validation:** Use the existing request/response helper transport. Keep observation and validation in the canonical loaders.
- **Selective refresh:** Refresh affected results and their dependencies. Apply deletions without restoring removed records from late responses.
- **Panel state:** Show cached results as stale until validation completes. Validate the tree before background detail refresh. Count details applied to the cache in the footer.
- **Safety:** Keep action preparation, setup, writes, and agent launch authorization outside the result cache.

## Design constraints

The remote helper owns dependency discovery. The panel submits cache identities and versions, not arbitrary dependency paths. A validation response classifies each requested entry as unchanged, changed, removed, or unknown. Unknown results require fresh queries.

Filesystem metadata can identify likely changes, but metadata alone does not prove unchanged content. Preserve canonical checks of file bytes, path identity, and collection membership. Git validation must cover the state that the result actually uses, not only HEAD.

Disk cache writes must be atomic. Missing, corrupt, and incompatible entries are cache misses. Generation checks prevent late reads or validation responses from replacing newer cache state. Preserve bounded caches, shared in-flight reads, cancellation, and view cleanup.

## Acceptance boundary

An unchanged refresh transfers validation metadata but no unchanged result bodies. A changed input refreshes affected results and their dependencies. The panel handles additions, deletions, route changes, helper restarts, corrupt local entries, and stale responses correctly. Actions retain fresh canonical validation.

## Verification

Exercise the real panel and helper with a scratch repository. Compare the final cache with a fresh canonical read. Observe helper invocation counts and result-body transfer for unchanged and changed refreshes. Include behavior checks for dependency invalidation, identity isolation, deletion, and response races.

## Out of scope

Persistent helper watchers, a resident daemon, new SSH or WebSocket transport, and upstream streaming API changes are outside this initiative. The upstream channel request does not block this work. The work contains one complete implementation ticket, not separate layer tickets.

## Tickets

- [Cache shared-context query results and refresh only changed data](../../tickets/herdr-query-cache-01-selective-refresh.md)

## Comments

The user approved one end-to-end implementation ticket with no blockers and a parent initiative. This approval creates tracker records only. It does not start implementation.

