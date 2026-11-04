---
schema: tracker-ticket/v1
id: artifact-share-03-github-pages-target
title: Publish targets, with github-pages as the first target
parent: artifact-share-publish-targets
sequence: 3
type: enhancement
triage: ready-for-agent
work_status: unclaimed
blocked_by:
  - artifact-share-02-stores-config
---

## What to build

Add one interface for publish targets, and move the existing GitHub Pages flow
behind it as the `github-pages` target.

- A target can publish the store, return the public URL of a share, check its
  own prerequisites for `doctor`, and declare what it can do: rewrite history,
  control access, and whether a remote workflow builds the site.
- `share` and `redact` commit to the store, push when the store has a remote,
  then publish to every target. A store with no remote and no targets only
  commits. A failed target stops the command with a non-zero exit status and
  names the target.
- A `github-pages` target requires a GitHub remote. `doctor` refuses a store
  with a `github-pages` target and no remote. `share` refuses it too.
- `pages enable` becomes "add a `github-pages` target". It keeps its
  confirmation guard.
- Restructure SKILL.md as a router organised by operation × target type. Move
  the operation playbooks under `references/operations/`. Add
  `references/publishers/github-pages.md`, which holds the plan check, the
  warning that the site is public, and the redaction limits.

## Acceptance criteria

- [ ] An existing GitHub Pages store publishes as it does today, through the
      new target.
- [ ] A local-only store can `share` and `redact` with no remote.
- [ ] `doctor` reports a `github-pages` target with no remote as an error.
- [ ] `share` output lists one URL for each target.
- [ ] The SKILL.md router names the publisher reference for each target type.

## Comments
