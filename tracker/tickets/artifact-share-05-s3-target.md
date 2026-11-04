---
schema: tracker-ticket/v1
id: artifact-share-05-s3-target
title: The s3 target with optional CloudFront
parent: artifact-share-publish-targets
sequence: 5
type: enhancement
triage: ready-for-agent
work_status: unclaimed
blocked_by:
  - artifact-share-04-rsync-target
---

## What to build

Add the `s3` target.

- Config fields: `bucket`, `prefix`, `aws_profile`, `public_url`, and an
  optional `cloudfront_distribution`. The `public_url` is an S3 website URL or a
  CloudFront URL.
- Send the local build with `aws s3 sync --delete` and the named profile.
- If `cloudfront_distribution` is set, invalidate the changed paths after the
  sync. After a redact, always invalidate the redacted share's paths.
- `doctor` checks that `aws` is installed, that the profile exists, and that the
  bucket can be read.
- Add `references/publishers/s3.md`. It states that a versioned bucket keeps old
  object versions after a redact, and it gives the command that removes them.

## Acceptance criteria

- [ ] A share to a store with an `s3` target is served at its `public_url`.
- [ ] After a redact, the share's objects are gone from the current bucket
      listing, and CloudFront has an invalidation for them.
- [ ] The config holds no AWS keys. The CLI uses the profile only.
- [ ] A test checks the sync and invalidation commands with a stubbed `aws`.

## Comments
