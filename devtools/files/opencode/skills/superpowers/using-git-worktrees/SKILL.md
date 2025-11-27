---
name: using-git-worktrees
description: Use when starting feature work that needs isolation from current workspace or before executing implementation plans - creates isolated git worktrees with smart directory selection and safety verification
---

# Using Git Worktrees

## Overview

Git worktrees create isolated workspaces sharing the same repository, allowing work on multiple branches simultaneously without switching.

**Core principle:** Systematic directory selection + safety verification = reliable isolation.

**Announce at start:** "I'm using the using-git-worktrees skill to set up an isolated workspace."

## Directory Selection Process

1. Determine what the path for the required workree will be "<parent-worktree-dir>/<feature-identifier>"
2. Are we already there? Is it a git worktree? If so, report and exit.
3. If we're are in the wrong worktree, report and exit.
4. Identify parent worktree directory using priority:
   - Existing worktree parent directory
   - AGENTS.md preference
   - User prompt
5. Ensure project-local directories are in .gitignore
6. Create worktree, run setup, verify clean baseline

### 1. Check if there is an existing worktree parent directory

```bash
# Check in priority order
ls -d ../$(basename "$(git rev-parse --show-toplevel)").worktrees 2>/dev/null      # Alternative
```

**If found:** Use that directory.

### 2. Check AGENTS.md

```bash
grep -i "worktree.*director" AGENTS.md 2>/dev/null
```

**If preference specified:** Use it without asking.

### 3. Ask User

If no directory exists and no AGENTS.md preference:

```
No worktree directory found. Where should I create worktrees?

1. ../$(basename "$(git rev-parse --show-toplevel)").worktrees (project-local, hidden)
2. ~/.locals/share/<project-name>.worktrees/ (global location)

Which would you prefer?
```

## Creation Steps

### 1. Detect Project Name

```bash
project=$(basename "$(git rev-parse --show-toplevel)")
```

### 2. Create Worktree

```bash
# Create worktree with new branch
path="../${project}.worktrees/${feature_name}"
mkdir -p "$path"
git worktree add "$path" -b "$BRANCH_NAME"
cd "$path"
```

### 3. Run Project Setup

Auto-detect and run appropriate setup:

```bash
# Node.js (npm)
if [ -f package.json ]; then npm install; fi
# Node.js (yarn)
if [ -f package.json ]; then yarn install; fi
# Node.js (bun)
if [ -f package.json ]; then bun install; fi
# Node.js (pnpm)
if [ -f package.json ]; then pnpm install; fi


# Rust
if [ -f Cargo.toml ]; then cargo build; fi

# Python
if [ -f requirements.txt ]; then pip install -r requirements.txt; fi
if [ -f pyproject.toml ]; then poetry install; fi

# Go
if [ -f go.mod ]; then go mod download; fi
```

### 4. Verify Clean Baseline

Run tests to ensure worktree starts clean:

```bash
# Examples - use project-appropriate command
npm test
cargo test
pytest
go test ./...
```

**If tests fail:** Report failures, ask whether to proceed or investigate.

**If tests pass:** Report ready.

### 5. Report Location

```
Worktree ready at <full-path>
Tests passing (<N> tests, 0 failures)
Ready to implement <feature-identifier>
```

## Quick Reference

| Situation                   | Action                            |
| --------------------------- | --------------------------------- |
| No worktrees yet            | Use `../<projectname>.worktrees/` |
| Neither exists              | Check AGENTS.md → Ask user        |
| Directory not in .gitignore | Add it immediately + commit       |
| Tests fail during baseline  | Report failures + ask             |
| No package.json/Cargo.toml  | Skip dependency install           |

## Common Mistakes

**Assuming directory location**

- **Problem:** Creates inconsistency, violates project conventions
- **Fix:** Follow priority: existing > AGENTS.md > ask

**Proceeding with failing tests**

- **Problem:** Can't distinguish new bugs from pre-existing issues
- **Fix:** Report failures, get explicit permission to proceed

**Hardcoding setup commands**

- **Problem:** Breaks on projects using different tools
- **Fix:** Auto-detect from project files (package.json, etc.)

## Example Workflow

```
You: I'm using the using-git-worktrees skill to set up an isolated workspace.

[Check ../<projectname>.worktrees/ - exists]
[Create worktree: git worktree add ../<projectname>.worktrees/auth -b feature/auth]
[Run npm install]
[Run npm test - 47 passing]

Worktree ready at /Users/jesse/myproject.worktrees/auth
Tests passing (47 tests, 0 failures)
Ready to implement auth feature
```

## Red Flags

**Never:**

- Create worktree within existing workspace
- Skip baseline test verification
- Proceed with failing tests without asking
- Assume directory location when ambiguous
- Skip AGENTS.md check

**Always:**

- Follow directory priority: existing > AGENTS.md > ask
- Verify .gitignore for project-local
- Auto-detect and run project setup
- Verify clean test baseline

## Integration

**Called by:**

- **brainstorming** (Phase 4) - REQUIRED when design is approved and implementation follows
- Any skill needing isolated workspace

**Pairs with:**

- **finishing-a-development-branch** - REQUIRED for cleanup after work complete
- **executing-plans** or **subagent-driven-development** - Work happens in this worktree
