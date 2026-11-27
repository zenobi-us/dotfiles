# Review rewrite helpers safely

For Dotfiles users. Updated 2026-11-27.

## Result

Provide explicit commit re-signing and author-rewrite functions.

## Prerequisites

Git, a disposable clone, and a full backup of refs before any authorised rewrite.

## Steps

1. Inspect both function definitions without invoking them.
2. Confirm identity helper availability and the argument behavior in git_forge_all_commits.
3. Define and review the desired author/signature policy on a disposable clone before considering a real rewrite.

## Verification

The planned identity and signing changes are understood, and original refs remain recoverable. This task performs no rewrite.

## Recovery

Keep the original repository untouched if argument behavior is unsuitable. Never force-push rewritten history as an inspection step.

[Capability overview](README.md)
