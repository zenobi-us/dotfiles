---
schema: tracker-ticket/v1
id: artifact-share-06-webdav-target
title: The webdav target through rclone
parent: artifact-share-publish-targets
sequence: 6
type: enhancement
triage: ready-for-agent
work_status: unclaimed
blocked_by:
  - artifact-share-04-rsync-target
---

## What to build

Add the `webdav` target.

- mise installs `rclone` for the skill.
- Config fields: `uri` (a `webdav://` or `webdavs://` URI, or the name of an
  rclone remote) and `public_url`. Credentials stay in the rclone config, not in
  `stores.toml`.
- Send the local build with `rclone sync`, which deletes files that are no
  longer in the build.
- `doctor` checks that `rclone` is installed and that the remote can be listed.
- Add `references/publishers/webdav.md`. It states that server backups are out
  of the CLI's control after a redact.

## Acceptance criteria

- [ ] A share to a store with a `webdav` target is served at its `public_url`.
- [ ] After a redact and a sync, the share's files are gone from the server.
- [ ] `stores.toml` holds no WebDAV password.
- [ ] A test syncs to a local rclone remote and checks the delete behaviour.

## Comments
