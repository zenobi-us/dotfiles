---
schema: tracker-ticket/v1
id: artifact-share-01-rename
title: Rename artifact-shares to artifact-share
parent: artifact-share-publish-targets
sequence: 1
type: task
triage: ready-for-agent
work_status: unclaimed
blocked_by: []
---

## What to build

Rename the skill from `artifact-shares` to `artifact-share`. This is a prefactor.
Behaviour does not change.

Rename these together:

- The skill directory and the skill name in its frontmatter.
- The CLI name, its help text, and its script directory.
- The config file path and the environment variable that overrides it
  (`ARTIFACT_SHARE_CONFIG`).
- The default clone root (`~/.local/share/artifact-share`).
- Every reference outside the skill: the agent-core plugin manifest, the
  `shared-context` publishing reference, and the skill-reference offenses CSV.

The CLI must still read an existing config at the old path until ticket 02
replaces the config. Existing clones under the old clone root must still be found.

## Acceptance criteria

- [ ] No file in the repository refers to `artifact-shares`, except a
      compatibility read of the old config and clone root.
- [ ] `cli.ts --help`, `doctor`, and `self-test` run under the new name.
- [ ] The existing test suite passes.
- [ ] The skill loads as `agent-core:artifact-share`.

## Comments
