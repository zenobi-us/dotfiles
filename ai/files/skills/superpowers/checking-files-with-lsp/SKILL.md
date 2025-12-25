---
name: checking-files-with-lsp
description: Use when you need to check, verify, validate or understand code or structure of a file (often code related files or markdown) - automatically detects file type, finds appropriate LSP/linter in mise, and runs validation
---

# Checking Files With LSP

## Overview

When you need to validate, check, or understand a file's structure or code quality, use language servers and linters to do it systematically. This skill provides a reliable workflow: detect the file type, search mise for available LSP/linter tools, intelligently choose one, and run the check.

**Core principle:** Let the appropriate tool for the language do the validation work, not manual inspection. Automate tool discovery and selection.

## When to Use

**Use this skill when:**

- Checking code files for syntax errors, type issues, or style problems
- Validating configuration files (YAML, TOML, JSON, KDL, etc.)
- Understanding code structure or quality of unfamiliar files
- Verifying Markdown files for formatting/link issues
- Need to quickly understand what problems exist in a file

**Don't use when:**

- Just reading a file to understand its contents (no validation needed)
- Running full test suites (that's testing, not validation)
- Analyzing code behavior (that's debugging, not validation)

## The Workflow

### Step 1: Detect File Type

Determine the language/type from file extension:

```
.lua     → lua
.ts/.tsx → typescript
.py      → python
.go      → go
.rs      → rust
.md      → markdown
.json    → json
.yaml    → yaml
.toml    → toml
.kdl     → kdl
```

If extension is unclear or missing, inspect file shebang or content patterns.

### Step 2: Search Mise for LSP/Linters

Run: `mise search <filetype>`

This returns all available language servers, linters, and formatters for that language.

**Example outputs:**

```
mise search lua
lua-language-server    (most popular)
stylua                 (formatter)

mise search python
pyright
pylance
python-language-server
black
ruff
```

### Step 3: Make Smart Selection

**Prioritize by tool type:** Language Server (LSP) > Linter > Formatter

LSPs provide the most comprehensive validation. Linters catch style/quality issues. Formatters are secondary for validation purposes.

**If ONE obvious choice exists:**

- Auto-select it (e.g., only lua-language-server for Lua)
- Verify installation: `mise list | grep <tool>` (if not listed, install it)
- Install: `mise install lua-language-server`
- Run it on the file

**If MULTIPLE choices exist:**

- Filter by priority: Show LSPs first, linters second, skip formatters
- Rank by popularity: Most-used tools first (measured by GitHub stars, then npm/PyPI downloads as tiebreaker)
- Show ranked list to user (with tool type and brief descriptions)
- Let user pick by number/letter
- Verify and install selected tool
- Run it on the file

**If NO tools found:**

- **Inform user explicitly:** "No LSP/linter available in mise for [filetype]"
- Suggest alternatives in order:
  1. Check online package managers (npm, PyPI, cargo, etc.) if not in mise
  2. Look for generic validators (jq for JSON, yamllint for YAML, etc.)
  3. Basic syntax checking (built-in language checkers)
  4. Manual validation with structured guidance
- Offer: "Would you like me to help install from another source?"

### Step 4: Run Validation

Execute the selected tool against the file and return results: errors, warnings, style issues, and suggestions.

## Quick Reference

| Task | Action |
|------|--------|
| Detect file type | Use file extension as primary signal |
| Find tools | `mise search <filetype>` |
| Install obvious choice | `mise install <tool>` (auto-selected) |
| Show options | Present ranked list for user choice |
| Run validation | Execute tool with file path |

## Common Mistakes

**Mistake: Skip file type detection**

- Wrong: "It's a code file, any language server works"
- Right: File type determines which LSP applies. Wrong LSP = wrong errors

**Mistake: Pick random LSP when multiple exist**

- Wrong: "I'll just try the first one" or "They're all the same"
- Right: Different LSPs check different aspects. Use ranking: most popular > less common. Filter by type: LSP > Linter > Formatter
- **No exceptions:** You must present options to user when multiple exist, not guess

**Mistake: Assume LSP is installed**

- Wrong: "Let me just run lua-language-server..."
- Right: Always verify with `mise search` first. Check `mise list` before installing. Install if needed

**Mistake: Don't check system requirements**

- Wrong: "Install the LSP and it'll work"
- Right: Some LSPs need runtime dependencies (Python, Node, etc.). Test LSP runs before reporting results

**Mistake: When LSP unavailable, give up**

- Wrong: "No tool for this language, can't validate"
- Right: Explore alternatives in order: online package managers → generic validators → syntax checking → manual guidance

**Mistake: Mixing tool categories**

- Wrong: Showing formatters and linters equally for validation
- Right: Prioritize LSP > Linter > Formatter. Use tool type as first filter

## Fallback Validation Options

When LSP/linter not available in mise:

1. Check online package managers (npm, PyPI, cargo, etc.) if not in mise
2. Look for generic validators - JSON validators, YAML checkers work across projects
3. Basic syntax checking - Some languages have built-in syntax checkers
4. Manual validation - Provide structured review guidance
5. Suggest installation - "Would you like me to help install from another source?"

## Implementation Steps

When helping a user check a file:

1. Ask or determine: "What file are we checking?"
2. Detect the file type from extension
3. Run: `mise search <filetype>`
4. Decide: obvious choice or show ranked options?
5. Verify installation: `mise list | grep <tool>` (check if already installed)
6. Install if needed: `mise install <selected-tool>`
7. Test tool runs: Verify LSP/linter executes without errors
8. Run: Execute tool against file with appropriate flags
9. Report: Show user the validation results
10. Offer next steps: "Fix these issues?" or "Run checks again?"

## Troubleshooting

**Tool installs but won't run:**

- Some LSPs need runtime dependencies (Python for some tools, Node for others)
- Check LSP documentation for runtime requirements
- Example: `python-language-server` needs Python installed
- Verify with: `mise exec <tool> -- <tool> --version`

**Mise search returns no results:**

- Language might not be in mise database
- Try alternative package managers: npm (JavaScript), PyPI (Python), cargo (Rust)
- Or use generic validators: jq (JSON), yamllint (YAML)

**LSP finds errors but tool isn't right for the job:**

- Wrong tool selected (formatter instead of LSP)
- Go back to Step 3, filter by type priority (LSP > Linter)
- Ask user to pick a different option from the list

**File has unusual extension:**

- Use file content inspection (shebang, headers) as fallback
- Example: Executable shell scripts often lack `.sh` extension
- Check content to confirm type before searching mise

## Real-World Impact

- Fast validation: No manual code review for common issues
- Consistent checking: Same tool, same criteria, every time
- Discovery: Find issues you'd miss with manual inspection
- Automation: Can be integrated into workflows, CI/CD, pre-commit hooks
- Language agnostic: Same pattern works for any language with an LSP available
