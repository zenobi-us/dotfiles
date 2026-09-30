# Enpass export merger

`enpass-merge` combines two Enpass JSON exports into one JSON export.

## Rules

- Matching uses `uuid`, `id`, `uid`, or `itemUuid`.
- If an item has no ID, matching falls back to normalized `title`, `category`, and `templateUuid`.
- An item only in A or B is kept in the output.
- When both exports contain an item with different data, the item with the latest valid update date wins.
- A wins when dates are equal or either item has no valid update date. This avoids replacing data without evidence.
- The output keeps the top-level shape and metadata from A. It is written as a new file; neither input is changed.

The merger checks common Enpass date fields, including `updatedAt`, `modifiedAt`, `lastModified`, and the same fields under `timestamps`.

## Usage

The command is installed with the dotfiles bootstrap because it lives in `files/commands/bin`:

```bash
enpass-merge export-a.json export-b.json -o export-c.json --report merge-report.json
```

Or run it directly from this repository:

```bash
bun files/commands/bin/enpass-merge export-a.json export-b.json -o export-c.json
```

The merge report is optional. It records which item won and why. JSON output goes to stdout when `-o` is omitted. Status text goes to stderr.

Always import the result into a test Enpass vault before replacing an original export.
