#!/bin/bash
#
# get_project_id.sh
#
# This script identifies the current project based on the git repository.
# It returns a slugified project ID that can be used with basicmemory.
#
# Output Format (JSON):
# {
#   "projectId": "slugified-repo-name",
#   "repo": "slugified-repo-url",
#   "remote": "origin",
#   "path": "slugified-working-path"
# }
#

set -euo pipefail

# Function to slugify text
slugify() {
	local text="$1"
	echo "$text" |
		tr '[:upper:]' '[:lower:]' |
		tr '\n' ' ' |
		sed 's/[^a-z0-9[:space:]]\+//g' |
		sed 's/[[:space:]]\+/-/g' |
		sed 's/^-\+//g' |
		sed 's/-\+$//g'
}

# Get git information
get_git_info() {
	local pwd
	pwd=$(pwd)

	# Try to get git repository info
	if git_root=$(git rev-parse --show-toplevel 2>/dev/null); then
		remote=$(git remote 2>/dev/null | head -1)
		if [ -z "$remote" ]; then
			remote="origin"
		fi

		repo_url=$(git remote get-url "$remote" 2>/dev/null || echo "")

		# Slugify the repository URL
		if [ -n "$repo_url" ]; then
			repo_slug=$(slugify "$repo_url")
		else
			repo_slug=$(slugify "$git_root")
		fi

		# Slugify the git root path
		path_slug=$(slugify "$git_root")
	else
		# Not in a git repository, use current directory
		repo_slug=$(slugify "$pwd")
		path_slug=$(slugify "$pwd")
		remote=""
	fi

	# Default project ID is the repository slug
	project_id="$repo_slug"

	# Output as JSON
	cat <<EOF
{
  "projectId": "$project_id",
  "repo": "$repo_slug",
  "remote": "$remote",
  "path": "$path_slug"
}
EOF
}

# Main execution
get_git_info
