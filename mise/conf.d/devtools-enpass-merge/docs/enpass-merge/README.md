# Enpass export merger

<!-- Add a real screenshot with descriptive alt text and a caption, or a redacted terminal capture/diagram for this headless capability. -->

Combine two Enpass exports while preserving the selected conflict winner.

For Dotfiles users. Updated 2026-11-27.

The merger keeps export A’s outer shape. Matching uses supported IDs, then normalised title/category/template keys. Newer valid dates win; ties and missing dates keep A. See the [existing merger guide](../../ENPASS-MERGE.md). Exports and reports contain secrets.

## Complete a task

[Merge into a separate export](HOWTO.md)

## Source files

- **Source:** [enpass-merge.ts](../../enpass-merge.ts)
- **Source:** [ENPASS-MERGE.md](../../ENPASS-MERGE.md)

[Module overview](../../README.md)
