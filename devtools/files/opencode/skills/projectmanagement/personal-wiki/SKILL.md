---
name: personal-wiki
description: Use when creating, linking, searching, or exporting notes with zk—prevents confusion on command flags, link syntax, working directory behavior, and export formats
---

# Personal Wiki with ZK CLI

> [!Note]
>
> Any usage of the `zk` command must include a NotebookPath via the `-W` flag. This is **not optional**.
> 
> - **ProjectId**: !`echo "$URL" | sed 's|.*/||; s/\.git$//; s/[^a-zA-Z0-9]/-/g; s/^-\+\|-\+$//g' | tr '[:upper:]' '[:lower:]'`
> - The NotebookPath is `~/Notes/Projects/{{ ProjectId }}`
> - All `zk` commands must include `-W ~/Notes/Projects/{{ ProjectId }}`


## Overview

ZK is a lightweight zettelkasten CLI tool for managing interconnected notes. Core principle: **all data is markdown files; CLI just organizes, searches, and exports them**. Avoid assuming commands exist (no `export` or `link` commands); instead use flags and manual editing.

## When to Use

**Symptoms:**
- Creating notes but unsure about link syntax
- Trying to export notes (no direct export command)
- Confused about working directory `-W` flag
- Getting errors with list/search commands
- Uncertain about output formats (json, csv, oneline)

**When NOT to use:**
- Editing notebook configuration (see zk documentation for `config.toml`)
- Advanced templating (templates are Handlebars, see zk docs)
- LSP setup (language server integration, separate config)

## Quick Reference

| Task | Command | Notes |
|------|---------|-------|
| Create note | `zk new -W <dir> --title "Title" --print-path` | Returns path; use `[[path]]` to link |
| List all notes | `zk list -W <dir>` | Defaults to table format |
| Search pattern | `zk list -W <dir> --match="pattern"` | Regex or plain text |
| Export JSON | `zk list -W <dir> --format=json > file.json` | Use redirection for output |
| Export CSV | `zk list -W <dir> --format=csv > file.csv` | RFC 4180 compliant; use CSV parser |
| Export oneline | `zk list -W <dir> --format=oneline > file.txt` | Minimal format, easy to parse |
| Find backlinks | `zk list -W <dir> --linked-by=<note-id>` | Shows notes linking to target |
| Show note details | `zk list -W <dir> --match=<note-id> --format=long` | Includes metadata and preview |

## Filtering Options

| Filter | Syntax | Example | Note |
|--------|--------|---------|------|
| Title/body | `--match="pattern"` | `zk list -W /nb --match="daily"` | Regex or plain text search |
| Linked-by | `--linked-by=<id>` | `zk list -W /nb --linked-by=abc123` | Show notes linking to abc123 |
| Other filters | Check `zk list --help` | `zk list --help \| grep -i filter` | ZK may have additional filters not listed |

**Important:** For any filtering not shown here, always verify with `zk list --help` before assuming syntax. ZK may add new filters in newer versions.

## Core Pattern: The Working Directory Flag

ZK requires explicit notebook path via `-W <dir>`. This is **not optional**:

```bash
# ❌ DON'T - assumes CWD is notebook
zk list --match="search"

# ✅ DO - explicit notebook path
zk list -W /path/to/notebook --match="search"
```

### Without `-W`: Search Algorithm (Why It's Dangerous)

If you omit `-W`, ZK searches UP the directory tree:
1. Current working directory (`pwd`)
2. Parent directory
3. Parent's parent (and so on to root)
4. **Stops at FIRST `.zk` folder found**

**Problem:** If you have nested notebooks, you might accidentally use the wrong one:
```
~/projects/
  .zk/                 # master notebook
  project-a/
    .zk/               # project-a notebook
    notes/
```

If you're in `~/projects/project-a/notes/` and run `zk list` without `-W`, it finds `~/projects/.zk` (the master), not `~/projects/project-a/.zk`.

### Rule: Always Use `-W` for Predictable Behavior

Never rely on the search algorithm in scripts or shared commands. Explicit paths prevent confusion:
```bash
zk list -W /path/to/notebook --match="search"
```

### Verify Active Notebook (Troubleshooting)
To see which notebook ZK is using:
```bash
zk info -W /path/to/notebook
# Shows: notebook path, config, note count
```

## Link Creation Patterns

ZK does **not** have a `zk link` command. Links are created by editing markdown files directly:

### Wiki-style Links (Most Common)
```markdown
This note connects to [[other-note-id]] and [[another-one]].
```

ZK automatically resolves these to matching note IDs. The ID can be filename without extension or explicit ID field in note frontmatter.

### Markdown Links (Also Valid)
```markdown
See [related note](/path/to/note.md) for details.
```

ZK understands both formats. Wiki-style `[[]]` is preferred for cross-referencing.

### Backlink Discovery
Find all notes linking to a specific note:
```bash
zk list -W /notebook --linked-by=target-note-id
```

## Export Workflows

**Pattern:** Use `zk list` with `--format` flag + output redirection

### Before Any Bulk Export: Safety Checklist

Bulk exports (100+ notes) can be dangerous if not validated:

- [ ] Do you have a backup of the notebook? (`cp -r /notebook /notebook.backup`)
- [ ] Are you exporting to test data first? (Start with `--match="test"` to validate format)
- [ ] Do you understand what you're exporting? (Links as refs? Full body? Metadata?)
- [ ] Is the output format valid? (Test with `head -5 export.json | jq .`)

**Example: Safe bulk export**
```bash
# 1. Validate on one note
zk list -W /notebook --match="note-id" --format=json | jq .

# 2. Check structure is what you expect
# (inspect the JSON output)

# 3. Export to temp file first
zk list -W /notebook --format=json > /tmp/export.json

# 4. Validate output is valid JSON
jq . < /tmp/export.json > /dev/null && echo "Valid JSON"

# 5. Move to final location
mv /tmp/export.json ~/exports/notes.json
```

### JSON Export (Programmatic)
```bash
zk list -W /notebook --match="tag:project" --format=json > export.json
```

Output includes: id, title, path, body, tags, relationships

### CSV Export (Spreadsheet Import)
```bash
zk list -W /notebook --format=csv > notes.csv
```

Output columns: title, path, modified date. Parse with CSV reader, not `awk`.

### Oneline Export (Grep-able)
```bash
zk list -W /notebook --format=oneline > index.txt
```

Output: `id - title - path` on single line per note

## Common Mistakes

| Mistake | Problem | Fix |
|---------|---------|-----|
| `zk export` | No export command exists | Use `zk list --format=X > file` |
| `zk link note1 note2` | No link command | Edit markdown files, add `[[note-id]]` |
| `zk list --match="x"` | Missing `-W` flag | Add `-W /notebook/path` before flags |
| `--format json` (no redirection) | Output prints to stdout, not file | Use `> file.json` to capture |
| `[[filepath]]` instead of `[[id]]` | Wiki-links use ID, not path | Use note ID or filename without extension |
| Assuming links created CLI-side | Links are manually edited | Always add links by editing note files |

## Reference: Output Formats

### Table (Default)
```
id | title | path
```

### Long (Includes Metadata)
```
id: xxx
title: My Note
path: /notebook/notes/xxx.md
tags: [tag1, tag2]
links: [[id1]], [[id2]]
```

### JSON (Programmatic Parsing)
```json
[{"id":"xxx","title":"My Note","tags":["tag1"],"path":"/notebook/notes/xxx.md"}]
```

### CSV (Spreadsheet Import) — RFC 4180 Compliant
**Format:** Quoted fields, comma-separated, includes header row

```csv
title,path,modified
"My Note",/notebook/notes/xxx.md,2025-01-15
"Note with, comma",/notebook/notes/yyy.md,2025-01-14
```

**Important:** Parse CSV with a proper CSV parser, not `awk -F','`, because titles can contain commas. Example with Python:
```python
import csv
with open('notes.csv') as f:
    for row in csv.DictReader(f):
        print(row['title'], row['path'])
```

### Oneline (Grep-able)
```
xxx - My Note - /notebook/notes/xxx.md
```

## Workflow Examples

### Single Note: Create → Link → Search → Export

```bash
# 1. Create new note in notebook
NOTE_PATH=$(zk new -W /notebook --title "Research Topic" --print-path)

# 2. Edit file and add links (manual)
echo -e "\n\nRelated: [[existing-note-id]]" >> "$NOTE_PATH"

# 3. Search for related notes
zk list -W /notebook --match="Research" --format=long

# 4. Export results
zk list -W /notebook --match="Research" --linked-by="research-topic-id" --format=json > related-notes.json
```

**Note:** Step 2 requires manual file editing. No CLI command creates links; you add them to markdown content.

### Bulk: Create Multiple Notes & Link to Master

For creating 10+ notes that all link to a master note:

```bash
#!/bin/bash
NOTEBOOK="/path/to/notebook"
MASTER_ID="master-index"

# Create notes in a loop
for i in {1..10}; do
  NOTE_PATH=$(zk new -W "$NOTEBOOK" \
    --title "Topic $i" \
    --print-path)
  
  # Add link to master note
  echo "" >> "$NOTE_PATH"
  echo "See master: [[${MASTER_ID}]]" >> "$NOTE_PATH"
done

# Verify all notes link to master
zk list -W "$NOTEBOOK" --linked-by="$MASTER_ID" --format=long
```

**Constraint:** ZK doesn't have a bulk-link command. Manual editing via script is the standard approach.

### Export Large Notebook Safely

```bash
#!/bin/bash
NOTEBOOK="/path/to/notebook"
EXPORT_DIR="$HOME/exports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create export directory with timestamp
mkdir -p "$EXPORT_DIR"

# Test export format on small sample
echo "=== Testing format on 1 note ==="
zk list -W "$NOTEBOOK" -l 1 --format=json | jq . > /dev/null
if [ $? -ne 0 ]; then
  echo "ERROR: JSON validation failed"
  exit 1
fi

# Full export
echo "=== Exporting all notes ==="
zk list -W "$NOTEBOOK" --format=json > "$EXPORT_DIR/export_${TIMESTAMP}.json"

# Validate output
jq . < "$EXPORT_DIR/export_${TIMESTAMP}.json" > /dev/null
if [ $? -eq 0 ]; then
  echo "✓ Export successful: $EXPORT_DIR/export_${TIMESTAMP}.json"
else
  echo "✗ Export failed: JSON is invalid"
  exit 1
fi
```

## Real-World Impact

**Without this skill:** Agents waste time guessing at nonexistent commands (`zk export`, `zk link`), get confused by `-W` flag, and struggle with format options.

**With this skill:** Agents know exactly which commands exist, understand working directory behavior, master export patterns, and avoid wasted attempts at missing commands.
