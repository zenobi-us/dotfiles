#!/usr/bin/env bats

setup() {
	export SCRIPT_DIR="$(cd "$(dirname "${BATS_TEST_FILENAME}")" && pwd)"
	export TEST_ROOT="$(mktemp -d)"
	export HOME="${TEST_ROOT}/home"
	mkdir -p "${HOME}/.config/zk"
	
	# Source the script using absolute path (after HOME is set)
	source "${SCRIPT_DIR}/notebook-path.sh"
}

teardown() {
	rm -rf "${TEST_ROOT}"
	unset NOTEBOOK_PATH
}

# Test 1: NOTEBOOK_PATH environment variable takes precedence
@test "discover: returns NOTEBOOK_PATH when set" {
	export NOTEBOOK_PATH="/from/envvar"
	mkdir -p "${TEST_ROOT}/work"
	cd "${TEST_ROOT}/work"
	
	result=$(discover_notebook_path)
	[ "$result" = "/from/envvar" ]
}

@test "discover: NOTEBOOK_PATH takes precedence over .zk.json" {
	export NOTEBOOK_PATH="/from/envvar"
	mkdir -p "${TEST_ROOT}/work"
	cd "${TEST_ROOT}/work"
	printf '{"notebookPath": "/from/zkjson"}' > .zk.json
	
	result=$(discover_notebook_path)
	[ "$result" = "/from/envvar" ]
}

@test "discover: NOTEBOOK_PATH takes precedence over projects.json" {
	export NOTEBOOK_PATH="/from/envvar"
	mkdir -p "${TEST_ROOT}/work"
	cd "${TEST_ROOT}/work"
	printf '{"projects": [{"projectId": "test", "contexts": ["%s/work"], "notebookPath": "/from/projects"}]}' "${TEST_ROOT}" > "${HOME}/.config/zk/projects.json"
	
	result=$(discover_notebook_path)
	[ "$result" = "/from/envvar" ]
}

# Test 2: Local .zk.json file
@test "discover: reads .zk.json from current directory" {
	unset NOTEBOOK_PATH
	mkdir -p "${TEST_ROOT}/work"
	cd "${TEST_ROOT}/work"
	printf '{"notebookPath": "/from/zkjson"}' > .zk.json
	
	result=$(discover_notebook_path)
	[ "$result" = "/from/zkjson" ]
}

@test "discover: .zk.json takes precedence over projects.json" {
	unset NOTEBOOK_PATH
	mkdir -p "${TEST_ROOT}/work"
	cd "${TEST_ROOT}/work"
	printf '{"notebookPath": "/from/zkjson"}' > .zk.json
	printf '{"projects": [{"projectId": "test", "contexts": ["%s/work"], "notebookPath": "/from/projects"}]}' "${TEST_ROOT}" > "${HOME}/.config/zk/projects.json"
	
	result=$(discover_notebook_path)
	[ "$result" = "/from/zkjson" ]
}

@test "discover: ignores .zk.json with empty notebookPath" {
	unset NOTEBOOK_PATH
	mkdir -p "${TEST_ROOT}/work"
	cd "${TEST_ROOT}/work"
	printf '{"notebookPath": ""}' > .zk.json
	printf '{"projects": [{"projectId": "test", "contexts": ["%s/work"], "notebookPath": "/from/projects"}]}' "${TEST_ROOT}" > "${HOME}/.config/zk/projects.json"
	
	result=$(discover_notebook_path)
	[ "$result" = "/from/projects" ]
}

# Test 3: Projects config - exact context match
@test "discover: matches exact path in projects.json" {
	unset NOTEBOOK_PATH
	mkdir -p "${TEST_ROOT}/work"
	cd "${TEST_ROOT}/work"
	printf '{"projects": [{"projectId": "test", "contexts": ["%s/work"], "notebookPath": "/from/projects"}]}' "${TEST_ROOT}" > "${HOME}/.config/zk/projects.json"
	
	result=$(discover_notebook_path)
	[ "$result" = "/from/projects" ]
}

# Test 4: Projects config - prefix match (NEW LOGIC)
@test "discover: matches prefix path in projects.json (one level deep)" {
	unset NOTEBOOK_PATH
	mkdir -p "${TEST_ROOT}/work/subdir"
	cd "${TEST_ROOT}/work/subdir"
	printf '{"projects": [{"projectId": "test", "contexts": ["%s/work"], "notebookPath": "/from/projects"}]}' "${TEST_ROOT}" > "${HOME}/.config/zk/projects.json"
	
	result=$(discover_notebook_path)
	[ "$result" = "/from/projects" ]
}

@test "discover: matches prefix path in projects.json (multiple levels deep)" {
	unset NOTEBOOK_PATH
	mkdir -p "${TEST_ROOT}/work/src/components/deep"
	cd "${TEST_ROOT}/work/src/components/deep"
	printf '{"projects": [{"projectId": "test", "contexts": ["%s/work"], "notebookPath": "/from/projects"}]}' "${TEST_ROOT}" > "${HOME}/.config/zk/projects.json"
	
	result=$(discover_notebook_path)
	[ "$result" = "/from/projects" ]
}

@test "discover: prevents false positive on similar paths" {
	unset NOTEBOOK_PATH
	mkdir -p "${TEST_ROOT}/work"
	mkdir -p "${TEST_ROOT}/work-old"
	cd "${TEST_ROOT}/work-old"
	
	# Context is /work, but we're in /work-old - should NOT match
	printf '{"projects": [{"projectId": "test", "contexts": ["%s/work"], "notebookPath": "/from/projects"}]}' "${TEST_ROOT}" > "${HOME}/.config/zk/projects.json"
	
	result=$(discover_notebook_path)
	# Should NOT find it (either git root or fallback)
	[[ "$result" != "/from/projects" ]]
}

@test "discover: selects correct project from multiple projects" {
	unset NOTEBOOK_PATH
	mkdir -p "${TEST_ROOT}/project-a"
	mkdir -p "${TEST_ROOT}/project-b"
	cd "${TEST_ROOT}/project-b"
	
	printf '{"projects": [{"projectId": "a", "contexts": ["%s/project-a"], "notebookPath": "/from/project-a"}, {"projectId": "b", "contexts": ["%s/project-b"], "notebookPath": "/from/project-b"}]}' "${TEST_ROOT}" "${TEST_ROOT}" > "${HOME}/.config/zk/projects.json"
	
	result=$(discover_notebook_path)
	[ "$result" = "/from/project-b" ]
}

@test "discover: handles null contexts in projects" {
	unset NOTEBOOK_PATH
	mkdir -p "${TEST_ROOT}/work"
	cd "${TEST_ROOT}/work"
	
	printf '{"projects": [{"projectId": "test", "contexts": null, "notebookPath": "/from/null"}]}' > "${HOME}/.config/zk/projects.json"
	
	# Should not crash, should fall through to git/fallback
	result=$(discover_notebook_path)
	[ -n "$result" ]
}

# Test 5: Git fallback
@test "discover: returns git root/.notebook/ when in git repo" {
	unset NOTEBOOK_PATH
	mkdir -p "${TEST_ROOT}/repo/src"
	cd "${TEST_ROOT}/repo"
	git init > /dev/null 2>&1
	
	cd "${TEST_ROOT}/repo/src"
	result=$(discover_notebook_path)
	[ "$result" = "${TEST_ROOT}/repo/.notebook/" ]
}

@test "discover: uses git root even in deeply nested git directory" {
	unset NOTEBOOK_PATH
	mkdir -p "${TEST_ROOT}/repo/src/components/deep"
	cd "${TEST_ROOT}/repo"
	git init > /dev/null 2>&1
	
	cd "${TEST_ROOT}/repo/src/components/deep"
	result=$(discover_notebook_path)
	[ "$result" = "${TEST_ROOT}/repo/.notebook/" ]
}

# Test 6: Fallback to CWD
@test "discover: returns pwd/.notebook/ as final fallback (not in git)" {
	unset NOTEBOOK_PATH
	mkdir -p "${TEST_ROOT}/no-git"
	cd "${TEST_ROOT}/no-git"
	
	result=$(discover_notebook_path)
	[ "$result" = "${TEST_ROOT}/no-git/.notebook/" ]
}

# Test 7: add_notebook_path_as_context function
@test "add: creates projects.json if it doesn't exist" {
	mkdir -p "${TEST_ROOT}/work"
	cd "${TEST_ROOT}/work"
	
	add_notebook_path_as_context "test-project" > /dev/null 2>&1
	
	[ -f "${HOME}/.config/zk/projects.json" ]
}

@test "add: initializes projects array" {
	mkdir -p "${TEST_ROOT}/work"
	cd "${TEST_ROOT}/work"
	
	add_notebook_path_as_context "test-project" > /dev/null 2>&1
	
	projects=$(jq '.projects' "${HOME}/.config/zk/projects.json" 2>/dev/null)
	[ "$projects" != "null" ]
}

@test "add: creates project with context when project doesn't exist" {
	mkdir -p "${TEST_ROOT}/work"
	cd "${TEST_ROOT}/work"
	
	# Pre-populate the config
	printf '{"projects": []}' > "${HOME}/.config/zk/projects.json"
	
	add_notebook_path_as_context "test-project" > /dev/null 2>&1
	
	# Verify project was added
	result=$(jq -r '.projects[0].projectId' "${HOME}/.config/zk/projects.json")
	[ "$result" = "test-project" ]
}

@test "add: adds context to existing project" {
	mkdir -p "${TEST_ROOT}/work"
	cd "${TEST_ROOT}/work"
	
	# Pre-populate with a project
	printf '{"projects": [{"projectId": "test", "contexts": [], "notebookPath": "/test"}]}' > "${HOME}/.config/zk/projects.json"
	
	add_notebook_path_as_context "test" > /dev/null 2>&1
	
	# Verify context was added
	result=$(jq -r '.projects[0].contexts[0]' "${HOME}/.config/zk/projects.json")
	[ "$result" = "${TEST_ROOT}/work" ]
}

@test "add: prevents duplicate contexts" {
	mkdir -p "${TEST_ROOT}/work"
	cd "${TEST_ROOT}/work"
	
	# Pre-populate with context already present
	printf '{"projects": [{"projectId": "test", "contexts": ["%s/work"], "notebookPath": "/test"}]}' "${TEST_ROOT}" > "${HOME}/.config/zk/projects.json"
	
	# Try to add same context again
	add_notebook_path_as_context "test" > /dev/null 2>&1
	
	# Verify only one context exists
	count=$(jq '.projects[0].contexts | length' "${HOME}/.config/zk/projects.json")
	[ "$count" = "1" ]
}

# Test 8: Edge cases
@test "discover: handles paths with spaces" {
	unset NOTEBOOK_PATH
	mkdir -p "${TEST_ROOT}/my work/deep folder"
	cd "${TEST_ROOT}/my work/deep folder"
	
	printf '{"projects": [{"projectId": "test", "contexts": ["%s/my work"], "notebookPath": "/from/projects"}]}' "${TEST_ROOT}" > "${HOME}/.config/zk/projects.json"
	
	result=$(discover_notebook_path)
	[ "$result" = "/from/projects" ]
}

@test "discover: handles paths with dashes and numbers" {
	unset NOTEBOOK_PATH
	mkdir -p "${TEST_ROOT}/project-123/v2-alpha"
	cd "${TEST_ROOT}/project-123/v2-alpha"
	
	printf '{"projects": [{"projectId": "test", "contexts": ["%s/project-123"], "notebookPath": "/from/projects"}]}' "${TEST_ROOT}" > "${HOME}/.config/zk/projects.json"
	
	result=$(discover_notebook_path)
	[ "$result" = "/from/projects" ]
}

