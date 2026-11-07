---
schema: tracker-ticket/v1
id: artifact-share-04-rsync-target
title: Local build, the rsync target, and the publish command
parent: artifact-share-publish-targets
sequence: 4
type: enhancement
triage: ready-for-agent
work_status: unclaimed
blocked_by:
  - artifact-share-03-github-pages-target
---

## What to build

This is the tracer bullet for targets that do not build in GitHub Actions.

- Build the Fumapress site locally for a target. `BASE_PATH` comes from the path
  of the target's `public_url`, and `SITE_BASE_URL` from its origin. Run the
  store's checks before the build.
- Add the `rsync` target. It takes an `ssh://user@host/path/` URI and sends the
  build with `rsync -a --delete`. The delete flag is required.
- Add `publish <store> [--target N]`. It builds and syncs without a new share.
  Use it after a config change or a failed sync.
- `doctor` checks that `rsync` is installed and that the host accepts an ssh
  connection.
- Add `references/publishers/rsync.md`. It states that server backups are out
  of the CLI's control after a redact.

## Acceptance criteria

- [ ] A share to a store with an `rsync` target appears at the target's public
      URL path on the host.
- [ ] After a redact and a sync, the share's files are gone from the host.
- [ ] `publish` re-syncs a store with no new commit.
- [ ] A test syncs to a local directory or a local ssh host and checks the
      delete behaviour.
- [ ] Two targets with different `public_url` paths get two builds with
      different `BASE_PATH` values.

## Comments
