---
description: Safely edit Confluence content with body files, snapshot tokens, lossless HTML, and read-back verification.
---

# Confluence Editing

For any non-trivial body edit, use:

```text
read -> save to file -> edit locally -> update from file -> verify
```

## Safe Workflow

1. Fetch the current content at full detail in the format you will edit.
2. Save `data.body.value` to a local file.
3. Capture the response's snapshot token.
4. Modify the file without reconstructing unrelated content.
5. Update with the body file, matching format, and snapshot token; use
   `--dry-run` first only for explicit preview or validation requests, or for
   unusually risky edits where direct execution was not requested.
6. Read back the result.

HTML is the safest round-trip format for macros and exact storage content.
Markdown is easier for prose but may not preserve every Confluence construct.

Do not replace a long existing body with an inline string unless the user
explicitly intends a complete rewrite. Do not omit optimistic-concurrency
tokens when the command requires them.

For targeted edits, prefer an advertised granular edit operation over rewriting
the entire body. Use inline `--edits` for small payloads and `--edits-file` for
larger, multiline, or sensitive payloads. Title-only changes should not resend
body content.

## Dry Runs and Snapshot Conflicts

- A dry run validates one snapshot; it neither reserves nor refreshes it. For
  body-changing dry runs, add `-o json --output-file <path>` and read
  `data.body.value` for the computed body.
- On `snapshot_stale`, refetch the latest body and token, then rebase the
  intended change. Never retry the stale payload with
  `data.currentSnapshot.token`; that defeats the concurrency guard.
- For targeted edits, revalidate targets and anchors against the latest body.
  For full replacement, merge the original, proposed, and latest bodies.
- Stop if a target was deleted, changed incompatibly, or the result is
  ambiguous. Otherwise write promptly with the fresh token and verify.
- If one reconciled retry also becomes stale, report active editing instead of
  looping.
