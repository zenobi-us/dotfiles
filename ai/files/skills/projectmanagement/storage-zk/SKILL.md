---
namie: storage-wiki-cli
description: Use when creating, linking, searching, or updating notes with the `wiki` CLI.
---

# Personal Wiki: Using the `wiki` CLI

## Quick Start: `wiki` CLI

The `wiki` CLI intelligently discovers your notebook patih.

```bash
wiki new --title "My Note"
wiki list --match="pattern"
wiki list --format=json | jq .
```
# Use discovered notebook (auto-discovers path internally)


## Common Workflows with `wiki` CLI

### Single Note: Create → Link → Search → Export

```bash
# 1. Create new note (auto-discovers notebook)
NOTE_PATH=$(wiki new --title "Research Topic" --print-path)

# 2. Edit file and add links (manual)
echo -e "\n\nRelated: [existing-note-id](Existing Note Title)" >> "$NOTE_PATH"

# 3. Search for related notes
wiki list --match="Research" --format=long

# 4. Export results
wiki list --match="Research" --format=json | jq .
```

### Register Project with Notebook

```bash
# Register current project with notebook (for context matching)
wiki project add
```

### Export All Notes from Project

```bash
# Get notebook, then export
NOTEBOOK=$(wiki project discover)
wiki list --format=json > all-notes.json

# Validate export
jq . < all-notes.json > /dev/null && echo "Valid JSON"
```

## When to Use

**Symptoms:**
- Need to export notes in various formats
- Want automatic project-to-notebook mapping
- Working with multiple projects and notebooks

**When NOT to use:**
- Editing notebook configuration (see zk documentation for `config.toml`)
- Advanced templating (templates are Handlebars, see zk docs)
- LSP setup (language server integration, separate config)

## `wiki` vs. Direct `zk` Commands

| Scenario | Use | Example |
|----------|-----|---------|
| **Notebook auto-discovery** | `wiki` CLI | `wiki new --title "Note"` (auto-discovers) |
| **Explicit notebook control** | Direct `zk` | `zk list -W /path --match="x"` (explicit control) |
| **Register project context** | `wiki project add` | Helps future discovery for this project |

## Quick Reference: `wiki` CLI Commands

| Task | Command | Notes |
|------|---------|-------|
| Create note | `wiki new --title "Title" --print-path` | Auto-discovers notebook; returns path |
| List all notes | `wiki list` | Defaults to table format |
| Search pattern | `wiki list --match="pattern"` | Regex or plain text |
| Export JSON | `wiki list --format=json > file.json` | Use redirection for output |
| Export CSV | `wiki list --format=csv > file.csv` | RFC 4180 compliant; use CSV parser |
| Export oneline | `wiki list --format=oneline > file.txt` | Minimal format, easy to parse |
| Find backlinks | `wiki list --linked-by=<note-id>` | Shows notes linking to target |
| Show note details | `wiki list --match=<note-id> --format=long` | Includes metadata and preview |

## Quick Reference: Direct `zk` Commands (When You Need Explicit Control)

| Task | Command | Notes |
|------|---------|-------|
| Create note | `zk new -W <dir> --title "Title" --print-path` | Explicit notebook path required |
| List all notes | `zk list -W <dir>` | Always include `-W` flag |
| Search pattern | `zk list -W <dir> --match="pattern"` | Regex or plain text |
| Export JSON | `zk list -W <dir> --format=json > file.json` | Use redirection for output |
| Export CSV | `zk list -W <dir> --format=csv > file.csv` | RFC 4180 compliant; use CSV parser |
| Find backlinks | `zk list -W <dir> --linked-by=<note-id>` | Shows notes linking to target |

## Filtering Options

| Filter | Syntax | Example | Note |
|--------|--------|---------|------|
| Title/body | `--match="pattern"` | `zk list -W /nb --match="daily"` | Regex or plain text search |
| Linked-by | `--linked-by=<id>` | `zk list -W /nb --linked-by=abc123` | Show notes linking to abc123 |
| Other filters | Check `zk list --help` | `zk list --help \| grep -i filter` | ZK may have additional filters not listed |

**Important:** For any filtering not shown here, always verify with `zk list --help` before assuming syntax. ZK may add new filters in newer versions.

## Understanding Notebook Discovery

The `wiki` CLI **automatically handles notebook discovery** using a smart search algorithm. No need to manually specify `-W` flags.

### How `wiki` Discovers Your Notebook

When you run any `wiki` command, it searches in this order:

1. **Environment variable** `NOTEBOOK_PATH` (if explicitly set)
2. **Ancestor directories** for `.zk/config.toml` (finds project-local notebooks)
3. **Context registry** in `~/Notes/` (matches your project path to a registered notebook)
4. **Global fallback** `~/.config/zk/config.toml` (if it defines a `notebook.dir`)

**Advantage:** You don't need to worry about getting the path wrong. Just run `wiki` commands.

### Direct `zk` Commands: Explicit `-W` Flag Required

If you bypass `wiki` and use `zk` directly, you **must** always include `-W`:

```bash
# ❌ DON'T - unsafe, ambiguous which notebook is used
zk list --match="search"

# ✅ DO - explicit notebook path
zk list -W /path/to/notebook --match="search"
```
If you're in `~/projects/project-a/notes/` and run `zk list` without `-W`, it might find `~/projects/.zk` instead.

### Troubleshooting: Verify Which Notebook Is Active

```bash
# Using wiki (recommended)
wiki project discover
# Returns: /path/to/notebook

# Using direct zk with explicit path
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
| Using `zk` without `-W` flag | Ambiguous which notebook is used | Use `wiki` CLI (auto-discovers) or explicit `-W /path` |
| `zk export` | No export command exists | Use `wiki list --format=X > file` (or `zk list -W <dir>...`) |
| `zk link note1 note2` | No link command | Edit markdown files, add `[[note-id]]` manually |
| `wiki list --match="x"` fails | Notebook not discovered | Run `wiki project discover` to verify path |
| `--format json` (no redirection) | Output prints to stdout, not file | Use `> file.json` to capture output |
| `[[filepath]]` instead of `[[id]]` | Wiki-links use ID, not path | Use note ID or filename without extension |
| Assuming links created CLI-side | Links are manually edited | Always add links by editing note files directly |
| Hardcoding notebook paths in scripts | Breaks when project moves | Use `wiki` CLI or `wiki project discover` instead |

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

### Single Note: Create → Link → Search → Export (Using `wiki` CLI)

```bash
# 1. Create new note (notebook auto-discovered)
NOTE_PATH=$(wiki new --title "Research Topic" --print-path)

# 2. Edit file and add links (manual)
echo -e "\n\nRelated: [[existing-note-id]]" >> "$NOTE_PATH"

# 3. Search for related notes
wiki list --match="Research" --format=long

# 4. Export results
wiki list --match="Research" --linked-by="research-topic-id" --format=json > related-notes.json
```

**Advantage:** No need to discover notebook path manually. `wiki` handles it.

### Single Note: Using Direct `zk` (When You Need Explicit Control)

```bash
# 1. Create new note with explicit notebook path
NOTEBOOK="/path/to/notebook"
NOTE_PATH=$(zk new -W "$NOTEBOOK" --title "Research Topic" --print-path)

# 2. Edit file and add links (manual)
echo -e "\n\nRelated: [[existing-note-id]]" >> "$NOTE_PATH"

# 3. Search for related notes
zk list -W "$NOTEBOOK" --match="Research" --format=long

# 4. Export results
zk list -W "$NOTEBOOK" --match="Research" --linked-by="research-topic-id" --format=json > related-notes.json
```

**Note:** Step 2 requires manual file editing. No CLI command creates links; you add them to markdown content.

### Bulk: Create Multiple Notes & Link to Master (Using `wiki`)

For creating 10+ notes that all link to a master note:

```bash
#!/bin/bash
MASTER_ID="master-index"

# Create notes in a loop (notebook auto-discovered)
for i in {1..10}; do
  NOTE_PATH=$(wiki new \
    --title "Topic $i" \
    --print-path)
  
  # Add link to master note
  echo "" >> "$NOTE_PATH"
  echo "See master: [[${MASTER_ID}]]" >> "$NOTE_PATH"
done

# Verify all notes link to master
wiki list --linked-by="$MASTER_ID" --format=long
```

**Advantage:** No need to discover or pass notebook path. `wiki` handles it automatically.

### Bulk: Using Direct `zk` (Explicit Notebook Path)

For explicit control over notebook:

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

### Export Large Notebook Safely (Using `wiki`)

```bash
#!/bin/bash
EXPORT_DIR="$HOME/exports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create export directory with timestamp
mkdir -p "$EXPORT_DIR"

# Test export format on small sample (notebook auto-discovered)
echo "=== Testing format on 1 note ==="
wiki list -l 1 --format=json | jq . > /dev/null
if [ $? -ne 0 ]; then
  echo "ERROR: JSON validation failed"
  exit 1
fi

# Full export
echo "=== Exporting all notes ==="
wiki list --format=json > "$EXPORT_DIR/export_${TIMESTAMP}.json"

# Validate output
jq . < "$EXPORT_DIR/export_${TIMESTAMP}.json" > /dev/null
if [ $? -eq 0 ]; then
  echo "✓ Export successful: $EXPORT_DIR/export_${TIMESTAMP}.json"
else
  echo "✗ Export failed: JSON is invalid"
  exit 1
fi
```

**Advantage:** No manual path discovery needed.

### Export Large Notebook Safely (Direct `zk` with Explicit Path)

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
