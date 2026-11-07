---
schema: tracker-initiative/v1
id: artifact-share-publish-targets
title: "artifact-share: one git store, many publish targets"
---

## Problem Statement

The `artifact-shares` skill publishes only to GitHub Pages. Every share is a
git commit, and the site is built only by the GitHub Actions deploy workflow.
Users need to publish the same checked artifacts to other hosts: an S3 bucket
(with an S3 URL or a CloudFront URL), a WebDAV server, and an ssh host through
rsync.

The config lives at `~/.config/artifact-shares.json`, ignores
`XDG_CONFIG_HOME`, and describes only GitHub repositories.

## Solution

Split each share into two layers:

1. **Store**: a local git repository. It is always present. It holds the share
   hash, `.types`, the MDX pages, the checks, and the Fumapress site. A store
   can have a git remote that the CLI pushes to. The remote is optional.
2. **Publish target**: where the built Fumapress site goes, and its public URL.
   A store has zero or more targets.

```text
store (git repo, optional remote)
  │  share / redact = commit, then run the checks
  ▼
publish targets (0..n per store)
  ├─ github-pages → needs a GitHub remote; push; the workflow builds the site
  ├─ s3           → local build; aws s3 sync --delete; CloudFront invalidation
  ├─ webdav       → local build; rclone sync
  └─ rsync        → local build; rsync -a --delete over ssh
```

Rename the skill from `artifact-shares` to `artifact-share`.

## User Stories

1. As a user, I want to publish a share to every target of a store with one
   `share` command.
2. As a user, I want to publish a store to an S3 bucket and get a CloudFront URL
   back.
3. As a user, I want to publish a store to a WebDAV server or an ssh host.
4. As a user, I want a redacted share to disappear from every target.
5. As a user, I want to list my stores and targets in one TOML file under my XDG
   config directory.
6. As a user, I want to keep a store local only, with no remote and no targets.

## Implementation Decisions

- The store is always a git repository. The publish step is the only part that
  changes for each target type.
- Every target receives the Fumapress build, not the bare `public/s/<hash>/`
  files.
- `share` and `redact` commit, then publish to every target of the store.
  `publish <store> [--target N]` re-syncs without a new share.
- A `github-pages` target requires a GitHub remote. `doctor` refuses a store
  that has a `github-pages` target and no remote.
- Non-GitHub targets build the site locally. `BASE_PATH` comes from the path of
  the target's `public_url`, so each target gets its own build.
- Every non-GitHub sync deletes remote files that are no longer in the build.
  Otherwise a redacted share stays online.
- Tools: `aws` for S3 and CloudFront, `rclone` for WebDAV, `rsync` for ssh. The
  skill installs `rclone` with mise.
- Config path: `${XDG_CONFIG_HOME:-~/.config}/artifact-share/stores.toml`.
  The CLI moves an old `~/.config/artifact-shares.json` into it once. The file
  holds no credentials. It names an AWS profile or a URI only.
- Bun parses TOML but cannot write it. The CLI writes the config with a pinned
  `smol-toml` import.
- The SKILL.md router is organised by operation × target. Each target type has
  its own reference, which states its redaction limits.

Config shape:

```toml
clone_root = "~/.local/share/artifact-share"

[stores.work]
remote = "git@github.com:owner/work-shares.git"   # optional
branch = "main"

[[stores.work.publish]]
type = "github-pages"
public_url = "https://owner.github.io/work-shares/"

[[stores.work.publish]]
type = "s3"
bucket = "acme-evidence"
prefix = "work/"
aws_profile = "evidence"
cloudfront_distribution = "E123ABC"   # optional
public_url = "https://d123.cloudfront.net/work/"

[[stores.nas.publish]]
type = "rsync"
uri = "ssh://deploy@nas.lan/srv/www/shares/"
public_url = "https://nas.lan/shares/"
```

## Testing Decisions

- Test config parsing, XDG path selection, and JSON migration with a temporary
  config directory.
- Test the rsync target against a local directory or a local ssh host.
- Test that a redact removes the share from each target after a sync.
- Test that `doctor` refuses `github-pages` without a remote.

## Out of Scope

- Plain FTP targets.
- Access control on S3, WebDAV, or rsync hosts.
- Credential storage.
- Removing history from S3 object versions or server backups automatically.

## Tickets

- [Rename artifact-shares to artifact-share](../../tickets/artifact-share-01-rename.md)
- [Read and write stores.toml in the XDG config directory](../../tickets/artifact-share-02-stores-config.md)
- [Publish targets, with github-pages as the first target](../../tickets/artifact-share-03-github-pages-target.md)
- [Local build, the rsync target, and the publish command](../../tickets/artifact-share-04-rsync-target.md)
- [The s3 target with optional CloudFront](../../tickets/artifact-share-05-s3-target.md)
- [The webdav target through rclone](../../tickets/artifact-share-06-webdav-target.md)

## Comments
