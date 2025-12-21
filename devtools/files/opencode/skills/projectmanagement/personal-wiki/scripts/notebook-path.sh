#!/bin/bash

#
# This script discovers the path to notebook of the current project.
#
HEREDIR=$(
	cd "$(dirname "${BASH_SOURCE[0]}")" && pwd
)

function discover_notebook_path() {
	# Set these at runtime, not module load time (allows testing)
	local notebook_path_envvar="${NOTEBOOK_PATH:-}"
	local notebook_path_cwd="$(pwd)/.zk.json"
	local notebook_path_config="${HOME}/.config/zk/projects.json"
	# discover in order:
	# 1. is there an envvar for NOTEBOOK_PATH?
	# 2. does the current CWD contain a .zk.json with notebookPath defined?
	# 3. does ~/.config/zk/projects.json exist?
	#   2a. does it contain .projects[].contexts[] ?
	#     2a1. does this CWD match any of those contexts?
	# 4. are we in a git repo? return root/.notebook/
	# 5. return the current path
	#
	if [[ -n "${notebook_path_envvar}" ]]; then
		echo "${notebook_path_envvar}"
		return 0
	fi

	if [[ -f "${notebook_path_cwd}" ]]; then
		local path
		path="$(jq -r '.notebookPath // empty' "${notebook_path_cwd}")"
		if [[ -n "${path}" ]]; then
			echo "${path}"
			return 0
		fi
	fi

	if [[ -f "${notebook_path_config}" ]]; then

		# find a project whose contexts include or contain the current CWD
		# (match either exact path or if CWD starts with a context path)
		project=$(
			jq -r --arg cwd "$(pwd)" '
      .projects[] |
      select(.contexts != null) |
      select(
        .contexts[] as $ctx |
        ($cwd == $ctx) or ($cwd | startswith($ctx + "/"))
      ) |
      .notebookPath // empty
    ' "${notebook_path_config}"
		)

		# if we found a project, return its notebook path
		# (project is already the notebookPath string from jq -r output above)
		if [[ -n "${project}" ]]; then
			echo "${project}"
			return 0
		fi

	fi

	# check if we're in a git repo
	if git rev-parse --is-inside-work-tree &>/dev/null; then
		local git_root
		git_root="$(git rev-parse --show-toplevel)"
		echo "${git_root}/.notebook/"
		return 0
	fi

	# fallback: return current path
	echo "$(pwd)/.notebook/"
}

##
# Adds current CWD as a context for a project.
function add_notebook_path_as_context() {
	local project_id
	local project_context
	local notebook_path_config="${HOME}/.config/zk/projects.json"

	project_id="${1:-$("${HEREDIR}/get_project_id.sh")}"
	project_context="$(pwd)"

	if [[ -z "${project_id}" ]]; then
		echo "Error: Could not determine project ID." >&2
		return 1
	fi

	echo "Adding context '${project_context}' to project '${project_id}'"

	# ensure config file exists
	if [[ ! -f "${notebook_path_config}" ]]; then
		mkdir -p "$(dirname "${notebook_path_config}")"
		echo '{"projects": []}' >"${notebook_path_config}"
	fi

	# check if project already exists
	# if not, add it
	local project
	project=$(jq -r --arg pid "${project_id}" '
		.projects[] | select(.projectId == $pid)
	' "${notebook_path_config}")

	if [[ -z "${project}" ]]; then
		echo "Project '${project_id}' does not exist. Creating new project entry."
		jq --arg pid "${project_id}" --arg np "$(discover_notebook_path)" '
			.projects += [{
				projectId: $pid,
				notebookPath: $np,
				contexts: []
			}]
		' "${notebook_path_config}" >"${notebook_path_config}.tmp" && mv "${notebook_path_config}.tmp" "${notebook_path_config}"

		return 0
	fi

	# add context if not already present
	# check if $project has contexts array
	# if not, create it
	local contexts
	contexts=$(echo "${project}" | jq -r '.contexts // empty')
	if [[ -z "${contexts}" ]]; then
		echo "Creating contexts array for project '${project_id}'"
		jq --arg pid "${project_id}" --arg ctx "${project_context}" '
			.projects |= map(
				if .projectId == $pid then
					.contexts = [$ctx]
				else
					.
				end
			)
		' "${notebook_path_config}" >"${notebook_path_config}.tmp" && mv "${notebook_path_config}.tmp" "${notebook_path_config}"
		return 0
	fi

	# if project_context already exists, do nothing
	local exists
	exists=$(echo "${contexts}" | jq -r --arg ctx "${project_context}" '
		.[] | select(. == $ctx)
	')
	if [[ -n "${exists}" ]]; then
		echo "Context '${project_context}' already exists for project '${project_id}'."
		return 0
	fi

	# add context
	echo "Adding context '${project_context}' to project '${project_id}'"
	jq --arg pid "${project_id}" --arg ctx "${project_context}" '
		.projects |= map(
			if .projectId == $pid then
				.contexts += [$ctx]
			else
				.
			end
		)
	' "${notebook_path_config}" >"${notebook_path_config}.tmp" &&
		mv "${notebook_path_config}.tmp" "${notebook_path_config}"

	return 0

}

function main() {
	local cmd="$1"
	shift

	case "${cmd}" in
	discover)
		discover_notebook_path "$@"
		;;
	add)
		add_notebook_path_as_context "$@"
		;;
	*)
		echo "Usage: $0 {discover|add}" >&2
		exit 1
		;;
	esac
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
	main "$@"
fi
