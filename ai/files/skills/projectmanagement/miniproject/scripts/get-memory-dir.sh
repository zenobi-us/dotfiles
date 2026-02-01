#!/usr/bin/env bash
# Find the .memory/ directory for the current repository
# Handles git worktrees by looking in the main worktree
# Usage: get-memory-dir.sh [--create]
# Exit codes: 0 = found (or created), 1 = not found/not in git repo

set -euo pipefail

CREATE_IF_MISSING=false
if [[ "${1:-}" == "--create" ]]; then
    CREATE_IF_MISSING=true
fi

# Check if we're in a git repository
if ! git rev-parse --git-dir >/dev/null 2>&1; then
    echo "ERROR: Not in a git repository" >&2
    exit 1
fi

# Get the main worktree root (handles both regular repos and worktrees)
# git-common-dir points to the shared .git directory
# For regular repos: .git -> parent is repo root
# For worktrees: /path/to/main/.git/worktrees/branch -> .git is at /path/to/main/.git
main_worktree=$(git rev-parse --path-format=absolute --git-common-dir | xargs dirname)

# If git-common-dir returns just ".git", we need the toplevel instead
if [[ "$main_worktree" == "." ]] || [[ ! -d "$main_worktree" ]]; then
    main_worktree=$(git rev-parse --show-toplevel)
fi

memory_dir="$main_worktree/.memory"

if [[ -d "$memory_dir" ]]; then
    echo "$memory_dir"
    exit 0
elif $CREATE_IF_MISSING; then
    mkdir -p "$memory_dir"
    echo "$memory_dir"
    exit 0
else
    echo "ERROR: .memory/ directory not found at: $memory_dir" >&2
    echo "Run with --create to create it" >&2
    exit 1
fi
