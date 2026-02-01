#!/usr/bin/env bash
# Get the git repository path for a memory directory (handles symlinks)
# Usage: scripts/get-memory-git-repo.sh <directory>
# Exit codes: 0 = in git repo, 1 = not in git repo

set -euo pipefail

if [ $# -eq 0 ]; then
    echo "Usage: $0 <directory>" >&2
    echo "Example: $0 .miniproject" >&2
    exit 2
fi

directory="$1"

# Check if directory exists
if [ ! -e "$directory" ]; then
    echo "ERROR: Directory does not exist: $directory" >&2
    exit 1
fi

# Resolve symlink to real path
real_path=$(readlink -f "$directory")

# Check if resolved path is a directory
if [ ! -d "$real_path" ]; then
    echo "ERROR: Not a directory: $directory -> $real_path" >&2
    exit 1
fi

# Check if inside a git repository
if (cd "$real_path" && git rev-parse --git-dir >/dev/null 2>&1); then
    # Get the git repository root
    git_root=$(cd "$real_path" && git rev-parse --show-toplevel)
    echo "$git_root"
    exit 0
else
    echo "ERROR: Not in a git repository: $directory -> $real_path" >&2
    exit 1
fi
