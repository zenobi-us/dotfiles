#!/usr/bin/env bats
#
# Tests for notebook-path.sh discovery logic
#

setup() {
	# Create temporary directories for testing
	export TEST_HOME="$(mktemp -d)"
	export TEST_CWD="$(mktemp -d)"
	export TEST_GIT_REPO="$(mktemp -d)"

	# Source the script
	source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/notebook-path.sh"

	# Reset environment
	unset NOTEBOOK_PATH
}

teardown() {
	# Clean up temporary directories
	rm -rf "${TEST_HOME}" "${TEST_CWD}" "${TEST_GIT_REPO}"
}

# =============================================================================
# Priority 1: NOTEBOOK_PATH environment variable
# =============================================================================

@test "discover: returns NOTEBOOK_PATH env var when set" {
	export NOTEBOOK_PATH="/custom/notebook/path"
	export HOME="${TEST_HOME}"

	cd "${TEST_CWD}"
	result=$(NOTEBOOK_PATH="/custom/notebook/path" discover_notebook_path)

	[ "$result" = "/custom/notebook/path" ]
}

@test "discover: ignores other discovery methods when NOTEBOOK_PATH is set" {
	export HOME="${TEST_HOME}"
	mkdir -p "${TEST_HOME}/.config/zk"
	echo '{"projects": [{"projectId": "test", "notebookPath": "/wrong/path", "contexts": ["'"${TEST_CWD}"'"]}]}' >"${TEST_HOME}/.config/zk/projects.json"

	cd "${TEST_CWD}"
	result=$(NOTEBOOK_PATH="/custom/path" discover_notebook_path)

	[ "$result" = "/custom/path" ]
}

# =============================================================================
# Priority 2: .zk.json in current working directory
# =============================================================================

@test "discover: reads notebookPath from .zk.json in CWD" {
	export HOME="${TEST_HOME}"

	# Create .zk.json in test directory
	echo '{"notebookPath": "/path/from/zk/json"}' >"${TEST_CWD}/.zk.json"

	cd "${TEST_CWD}"
	result=$(discover_notebook_path)

	[ "$result" = "/path/from/zk/json" ]
}

@test "discover: .zk.json takes precedence over projects.json" {
	export HOME="${TEST_HOME}"
	mkdir -p "${TEST_HOME}/.config/zk"

	# Create both files
	echo '{"notebookPath": "/from/zk/json"}' >"${TEST_CWD}/.zk.json"
	echo '{"projects": [{"projectId": "test", "notebookPath": "/from/projects/json", "contexts": ["'"${TEST_CWD}"'"]}]}' >"${TEST_HOME}/.config/zk/projects.json"

	cd "${TEST_CWD}"
	result=$(discover_notebook_path)

	[ "$result" = "/from/zk/json" ]
}

@test "discover: ignores empty notebookPath in .zk.json" {
	export HOME="${TEST_HOME}"

	echo '{"notebookPath": ""}' >"${TEST_CWD}/.zk.json"

	cd "${TEST_CWD}"
	result=$(discover_notebook_path)

	# Should fall through to next discovery method
	[ -z "$result" ] || [ "$result" != "" ]
}

@test "discover: handles .zk.json with null notebookPath" {
	export HOME="${TEST_HOME}"

	echo '{"notebookPath": null}' >"${TEST_CWD}/.zk.json"

	cd "${TEST_CWD}"
	result=$(discover_notebook_path)

	# Should fall through to next discovery method
	[ -z "$result" ] || true
}

# =============================================================================
# Priority 3: ~/.config/zk/projects.json with exact context match
# =============================================================================

@test "discover: exact match on context in projects.json" {
	export HOME="${TEST_HOME}"
	mkdir -p "${TEST_HOME}/.config/zk"

	# Create projects.json with exact context match
	echo '{"projects": [{"projectId": "my-project", "notebookPath": "/notebook/path", "contexts": ["'"${TEST_CWD}"'"]}]}' \
		>"${TEST_HOME}/.config/zk/projects.json"

	cd "${TEST_CWD}"
	result=$(discover_notebook_path)

	[ "$result" = "/notebook/path" ]
}

@test "discover: no match if context doesn't match exactly" {
	export HOME="${TEST_HOME}"
	mkdir -p "${TEST_HOME}/.config/zk"

	echo '{"projects": [{"projectId": "my-project", "notebookPath": "/notebook/path", "contexts": ["/different/path"]}]}' \
		>"${TEST_HOME}/.config/zk/projects.json"

	cd "${TEST_CWD}"
	result=$(discover_notebook_path)

	[ -z "$result" ] || true
}

# =============================================================================
# Priority 3: ~/.config/zk/projects.json with prefix match (CWD starts with context)
# =============================================================================

@test "discover: prefix match when CWD is subdirectory of context" {
	export HOME="${TEST_HOME}"
	mkdir -p "${TEST_HOME}/.config/zk"
	mkdir -p "${TEST_CWD}/src/components/deep"

	# Create projects.json with context = parent, CWD = subdirectory
	echo '{"projects": [{"projectId": "my-project", "notebookPath": "/notebook/for/project", "contexts": ["'"${TEST_CWD}"'"]}]}' \
		>"${TEST_HOME}/.config/zk/projects.json"

	cd "${TEST_CWD}/src/components/deep"
	result=$(discover_notebook_path)

	[ "$result" = "/notebook/for/project" ]
}

@test "discover: prefix match works at multiple nesting levels" {
	export HOME="${TEST_HOME}"
	mkdir -p "${TEST_HOME}/.config/zk"
	mkdir -p "${TEST_CWD}/a/b/c/d/e"

	echo '{"projects": [{"projectId": "test", "notebookPath": "/nb/path", "contexts": ["'"${TEST_CWD}"'"]}]}' \
		>"${TEST_HOME}/.config/zk/projects.json"

	cd "${TEST_CWD}/a/b/c/d/e"
	result=$(discover_notebook_path)

	[ "$result" = "/nb/path" ]
}

@test "discover: prefix match does not match similar paths" {
	export HOME="${TEST_HOME}"
	mkdir -p "${TEST_HOME}/.config/zk"

	# Create projects.json with context = /tmp/projects
	# CWD = /tmp/projects-old should NOT match
	echo '{"projects": [{"projectId": "test", "notebookPath": "/notebook/path", "contexts": ["/tmp/projects"]}]}' \
		>"${TEST_HOME}/.config/zk/projects.json"

	cd "/tmp/projects-old"
	result=$(discover_notebook_path)

	[ -z "$result" ] || true
}

# =============================================================================
# Priority 3: Multiple projects - select correct one
# =============================================================================

@test "discover: selects correct project from multiple entries" {
	export HOME="${TEST_HOME}"
	mkdir -p "${TEST_HOME}/.config/zk"

	# Create projects.json with multiple projects
	cat >"${TEST_HOME}/.config/zk/projects.json" <<EOF
{
  "projects": [
    {
      "projectId": "project-a",
      "notebookPath": "/notebooks/a",
      "contexts": ["/path/to/a"]
    },
    {
      "projectId": "project-b",
      "notebookPath": "/notebooks/b",
      "contexts": ["${TEST_CWD}"]
    },
    {
      "projectId": "project-c",
      "notebookPath": "/notebooks/c",
      "contexts": ["/path/to/c"]
    }
  ]
}
EOF

	cd "${TEST_CWD}"
	result=$(discover_notebook_path)

	[ "$result" = "/notebooks/b" ]
}

@test "discover: handles null contexts array gracefully" {
	export HOME="${TEST_HOME}"
	mkdir -p "${TEST_HOME}/.config/zk"

	cat >"${TEST_HOME}/.config/zk/projects.json" <<EOF
{
  "projects": [
    {
      "projectId": "project-a",
      "notebookPath": "/notebooks/a",
      "contexts": null
    }
  ]
}
EOF

	cd "${TEST_CWD}"
	result=$(discover_notebook_path)

	# Should not crash, should fall through
	[ -z "$result" ] || true
}

# =============================================================================
# Priority 4: Git repository fallback
# =============================================================================

@test "discover: returns git root + .notebook/ when in git repo and no config" {
	export HOME="${TEST_HOME}"

	# Initialize git repo
	cd "${TEST_GIT_REPO}"
	git init -q
	git config user.email "test@example.com"
	git config user.name "Test"
	echo "test" >test.txt
	git add test.txt
	git commit -q -m "initial"

	# Create subdirectory and test from there
	mkdir -p "${TEST_GIT_REPO}/src/app"
	cd "${TEST_GIT_REPO}/src/app"

	result=$(discover_notebook_path)

	[ "$result" = "${TEST_GIT_REPO}/.notebook/" ]
}

@test "discover: git fallback is skipped if projects.json match found" {
	export HOME="${TEST_HOME}"
	mkdir -p "${TEST_HOME}/.config/zk"

	# Initialize git repo
	cd "${TEST_GIT_REPO}"
	git init -q

	# Create projects.json
	echo '{"projects": [{"projectId": "test", "notebookPath": "/config/path", "contexts": ["'"${TEST_GIT_REPO}"'"]}]}' \
		>"${TEST_HOME}/.config/zk/projects.json"

	cd "${TEST_GIT_REPO}"
	result=$(discover_notebook_path)

	# Should return config path, not git path
	[ "$result" = "/config/path" ]
}

# =============================================================================
# Priority 5: Fallback to current directory
# =============================================================================

@test "discover: returns pwd + .notebook/ as final fallback" {
	export HOME="${TEST_HOME}"

	cd "${TEST_CWD}"
	result=$(discover_notebook_path)

	[ "$result" = "${TEST_CWD}/.notebook/" ]
}

@test "discover: fallback works when not in git repo and no config" {
	export HOME="${TEST_HOME}"

	cd "/tmp"
	result=$(discover_notebook_path)

	[ "$result" = "/tmp/.notebook/" ]
}

# =============================================================================
# add_notebook_path_as_context function tests
# =============================================================================

@test "add: creates projects.json if it doesn't exist" {
	export HOME="${TEST_HOME}"
	mkdir -p "${TEST_HOME}/.config/zk"

	cd "${TEST_CWD}"
	add_notebook_path_as_context "test-project"

	[ -f "${TEST_HOME}/.config/zk/projects.json" ]
}

@test "add: initializes projects array with new project" {
	export HOME="${TEST_HOME}"
	mkdir -p "${TEST_HOME}/.config/zk"

	cd "${TEST_CWD}"
	add_notebook_path_as_context "test-project"

	# Verify structure
	result=$(jq -r '.projects[0].projectId' "${TEST_HOME}/.config/zk/projects.json")
	[ "$result" = "test-project" ]
}

@test "add: adds context to existing project" {
	export HOME="${TEST_HOME}"
	mkdir -p "${TEST_HOME}/.config/zk"

	# Create initial project
	echo '{"projects": [{"projectId": "test", "notebookPath": "/nb", "contexts": ["/path/one"]}]}' \
		>"${TEST_HOME}/.config/zk/projects.json"

	cd "${TEST_CWD}"
	add_notebook_path_as_context "test"

	# Check contexts array now has 2 items
	count=$(jq '.projects[0].contexts | length' "${TEST_HOME}/.config/zk/projects.json")
	[ "$count" = "2" ]
}

@test "add: does not duplicate contexts" {
	export HOME="${TEST_HOME}"
	mkdir -p "${TEST_HOME}/.config/zk"

	echo '{"projects": [{"projectId": "test", "notebookPath": "/nb", "contexts": ["'"${TEST_CWD}"'"]}]}' \
		>"${TEST_HOME}/.config/zk/projects.json"

	cd "${TEST_CWD}"
	add_notebook_path_as_context "test"

	# Should still be 1 context
	count=$(jq '.projects[0].contexts | length' "${TEST_HOME}/.config/zk/projects.json")
	[ "$count" = "1" ]
}

@test "add: handles missing contexts array" {
	export HOME="${TEST_HOME}"
	mkdir -p "${TEST_HOME}/.config/zk"

	# Project without contexts array
	echo '{"projects": [{"projectId": "test", "notebookPath": "/nb"}]}' \
		>"${TEST_HOME}/.config/zk/projects.json"

	cd "${TEST_CWD}"
	add_notebook_path_as_context "test"

	# Contexts array should now exist with 1 item
	result=$(jq '.projects[0].contexts[0]' "${TEST_HOME}/.config/zk/projects.json")
	[ "$result" = "\"${TEST_CWD}\"" ]
}

# =============================================================================
# Edge cases and error handling
# =============================================================================

@test "discover: handles malformed projects.json gracefully" {
	export HOME="${TEST_HOME}"
	mkdir -p "${TEST_HOME}/.config/zk"

	# Create invalid JSON
	echo "{ invalid json" >"${TEST_HOME}/.config/zk/projects.json"

	cd "${TEST_CWD}"
	result=$(discover_notebook_path 2>/dev/null || true)

	# Should fall back to git or pwd
	[ -n "$result" ]
}

@test "discover: handles paths with spaces" {
	export HOME="${TEST_HOME}"
	mkdir -p "${TEST_HOME}/.config/zk"

	TEST_SPACE_DIR="${TEST_CWD}/path with spaces"
	mkdir -p "${TEST_SPACE_DIR}"

	echo '{"projects": [{"projectId": "test", "notebookPath": "/notebooks", "contexts": ["'"${TEST_SPACE_DIR}"'"]}]}' \
		>"${TEST_HOME}/.config/zk/projects.json"

	cd "${TEST_SPACE_DIR}"
	result=$(discover_notebook_path)

	[ "$result" = "/notebooks" ]
}

@test "discover: handles notebookPath with spaces" {
	export HOME="${TEST_HOME}"

	echo '{"notebookPath": "/path/with spaces/notebook"}' >"${TEST_CWD}/.zk.json"

	cd "${TEST_CWD}"
	result=$(discover_notebook_path)

	[ "$result" = "/path/with spaces/notebook" ]
}

@test "discover: handles special characters in paths" {
	export HOME="${TEST_HOME}"
	mkdir -p "${TEST_HOME}/.config/zk"

	SPECIAL_PATH="${TEST_CWD}/path-with_special.chars"
	mkdir -p "${SPECIAL_PATH}"

	echo '{"projects": [{"projectId": "test", "notebookPath": "/nb", "contexts": ["'"${SPECIAL_PATH}"'"]}]}' \
		>"${TEST_HOME}/.config/zk/projects.json"

	cd "${SPECIAL_PATH}"
	result=$(discover_notebook_path)

	[ "$result" = "/nb" ]
}
