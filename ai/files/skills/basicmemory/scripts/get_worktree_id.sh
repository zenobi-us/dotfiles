#!/bin/bash

# Slugify function - converts text to lowercase with hyphens
slugify() {
  local text="$1"
  echo "$text" \
    | tr '[:upper:]' '[:lower:]' \
    | tr -s ' ' '-' \
    | sed 's/[^a-z0-9-]//g' \
    | sed 's/-\+/-/g' \
    | sed 's/^-\+//' \
    | sed 's/-\+$//' \
    | xargs
}

# Identify worktree - returns repo, remote, and path information
identify_worktree() {
  local pwd
  pwd=$(pwd)
  local path
  path=$(slugify "$pwd")

  if git rev-parse --show-toplevel &>/dev/null; then
    local git_root
    git_root=$(git rev-parse --show-toplevel)
    local remote
    remote=$(git remote | head -1)
    local repo_url
    repo_url=$(git remote get-url "$remote" 2>/dev/null)

    local slugified_repo
    slugified_repo=$(slugify "$repo_url")
    local slugified_path
    slugified_path=$(slugify "$git_root")

    echo "remote=$remote"
    echo "repo=$slugified_repo"
    echo "path=$slugified_path"
  else
    echo "path=$path"
  fi
}

# Get instructions for creating a new project
instruct() {
  local meta
  meta=$(identify_worktree)
  eval "$meta"

  cat <<'INSTR'
The current worktree is identified as:

- Repository: $repo
- Remote: $remote
- Path: $path

Continue by creating a new BasicMemory project with the following command:

basicmemory_create_project(
  name="$repo",
  directory="~/Notes/Projects/$repo",
)
INSTR
}

# Get repository URL
repo_url() {
  local meta
  meta=$(identify_worktree)
  eval "$meta"

  if [ -z "$repo" ]; then
    echo "Error: Could not identify repository" >&2
    return 1
  fi

  echo "$repo"
}

# Get path identifier
repo_path() {
  local meta
  meta=$(identify_worktree)
  eval "$meta"
  echo "$path"
}

# Get remote name
remote_name() {
  local meta
  meta=$(identify_worktree)
  eval "$meta"

  if [ -z "$remote" ]; then
    echo "Error: Could not identify remote" >&2
    return 1
  fi

  echo "$remote"
}

# Main execution - call function based on argument
case "${1:-instruct}" in
  instruct)
    instruct
    ;;
  repo-url)
    repo_url
    ;;
  repo-path)
    repo_path
    ;;
  remote-name)
    remote_name
    ;;
  *)
    echo "Usage: $0 {instruct|repo-url|repo-path|remote-name}"
    exit 1
    ;;
esac
