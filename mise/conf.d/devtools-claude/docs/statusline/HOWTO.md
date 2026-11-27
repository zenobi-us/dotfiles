# Inspect status-line prerequisites

For Dotfiles users. Updated 2026-11-27.

## Result

Render model, directory, and context usage from Claude session JSON.

## Prerequisites

Claude Code and jq on Unix.

## Steps

1. Review statusline.sh and its SHARED_CONTEXT_CLI path.
2. Confirm ~/.claude/statusline.sh resolves to this module.
3. Select the script in Claude’s status-line configuration after checking the path.

## Verification

A Claude session shows model and context percentage; missing enrichment requires a path check.

## Recovery

Restore the previous status-line setting if rendering fails. Keep session JSON out of captures.

[Capability overview](README.md)
