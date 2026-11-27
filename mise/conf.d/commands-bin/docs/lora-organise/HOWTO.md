# Export a read-only organisation plan

For Dotfiles users. Updated 2026-11-27.

## Result

Review metadata-based LoRA move plans before explicit application.

## Prerequisites

Unix shell and the dependencies named in the overview. Commands are linked into ~/.local/bin by this module.

## Steps

1. Back up your model collection and provide Bun through mise.
2. Run `lora-organise /path/to/models --plan --json -o /tmp/lora-plan.json` with a new output filename.
3. Review MOVE destinations and BLOCKED reasons. Keep the plan outside the model root.

## Verification

A JSON plan records source paths, destinations, and blockers. Exit code 2 means blocked entries, not permission to force moves.

## Recovery

Do not apply an unexpected plan. Export a fresh plan after changing files; use --apply PLAN --dry-run before authorising real moves.

[Capability overview](README.md)
