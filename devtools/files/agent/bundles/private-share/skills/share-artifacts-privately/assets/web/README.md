# Personal Agent Shares

This branch publishes private-share artifacts through GitHub Pages.

## Layout

```text
index.html
sessions.jsonl
scripts/validate-sessions-index.mjs
s/<hash>/index.html
s/<hash>.zip
```

Only directory shares create `s/<hash>.zip`.

## Share records

Each share has one line in `sessions.jsonl`.

```jsonl
{"hash":"abc123def456","date":"2026-06-23T14-30-00Z","path":"s/abc123def456/","title":"Build session index","kind":"html"}
```

Directory shares also have `zipPath`.

```jsonl
{"hash":"abc123def456","date":"2026-06-23T14-30-00Z","path":"s/abc123def456/","zipPath":"s/abc123def456.zip","title":"Build session index","kind":"directory"}
```

## Validate

Run this command from the branch root before you push:

```bash
node scripts/validate-sessions-index.mjs
```
