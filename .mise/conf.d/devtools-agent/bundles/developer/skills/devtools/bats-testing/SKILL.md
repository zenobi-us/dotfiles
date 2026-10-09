---
name: bats-testing
description: Use when writing shell-native tests for CLI tools, sourced Bash libraries, or REST APIs, especially when process boundaries, shell state, and exit/output behavior must be verified end-to-end.
---

# Testing with Bats

## Overview

Bats is best when correctness depends on real shell behavior: exit codes, stdout/stderr, sourced functions, and external commands.

Core principle: **test behavior at the shell boundary, not implementation details.**

## When to Use

Use this skill when you need to:

- Write e2e tests for CLI tools
- Test Bash libraries that are `source`d (not executed)
- Use Bats as a shell-native REST API test runner with `curl` + `jq`

Typical symptoms:

- "My script works manually but fails in CI"
- "I can test command output, but not sourced function behavior"
- "I need lightweight API tests from shell pipelines"

## Project Setup

Recommended layout:

```text
test/
  helpers/
    test_helper.bash
  cli_*.bats
  lib_*.bats
  api_*.bats
```

`test/helpers/test_helper.bash`:

```bash
#!/usr/bin/env bash

load 'test_helper/bats-support/load'
load 'test_helper/bats-assert/load'

setup_test_tmp() {
  export TEST_TMPDIR="$(mktemp -d)"
}

teardown_test_tmp() {
  rm -rf "$TEST_TMPDIR"
}
```

## Pattern 1: CLI e2e Tests

Test real invocation and output contracts.

```bash
#!/usr/bin/env bats

load './helpers/test_helper.bash'

setup() {
  setup_test_tmp
  export HOME="$TEST_TMPDIR/home"
  mkdir -p "$HOME"
}

teardown() {
  teardown_test_tmp
}

@test "todoctl add persists item" {
  run todoctl add "buy milk"
  assert_success
  assert_output --partial "added"

  run todoctl list --json
  assert_success
  echo "$output" | jq -e 'any(.[]; .text == "buy milk")'
}

@test "todoctl add rejects empty text" {
  run todoctl add ""
  assert_failure
  assert_output --partial "text is required"
}
```

### Notes
- Always isolate runtime directories (`HOME`, config/data dirs).
- Assert both exit status and output.
- Include at least one negative-path test per command surface.

## Pattern 2: Sourced Bash Libraries

For libs, distinguish:

1. **Process-level assertions** (`run bash -c 'source ...'`)
2. **In-shell state assertions** (direct call, no `run`)

`run` executes in a subshell. Side effects on variables do **not** persist to the test shell.

```bash
#!/usr/bin/env bats

load './helpers/test_helper.bash'

setup() {
  # shellcheck disable=SC1091
  source "${BATS_TEST_DIRNAME}/../lib/string_utils.sh"
}

@test "library can be sourced cleanly" {
  run bash -c 'source "./lib/string_utils.sh"'
  assert_success
  assert_output ""
}

@test "trim returns normalized value" {
  run trim "  hello  "
  assert_success
  assert_output "hello"
}

@test "function can mutate caller state (non-run path)" {
  value="  hello world  "
  trim_in_place value   # this function edits variable by name
  [ "$value" = "hello world" ]
}
```

### Notes
- Use `run` for output/status checks.
- Use direct invocation for in-shell state mutation tests.
- Source once in `setup` unless isolation requires per-test sourcing.

## Pattern 3: REST API Testing with Bats

Use helpers so each test focuses on intent.

```bash
#!/usr/bin/env bats

load './helpers/test_helper.bash'

request_json() {
  local method="$1"; shift
  local url="$1"; shift
  local body_file="$BATS_TEST_TMPDIR/response.json"

  HTTP_STATUS="$({
    curl -sS \
      -X "$method" \
      -H 'Accept: application/json' \
      -H 'Content-Type: application/json' \
      -o "$body_file" \
      -w '%{http_code}' \
      "$url" "$@"
  })"

  HTTP_BODY="$(cat "$body_file")"
}

@test "GET /health is healthy" {
  [ -n "${API_BASE_URL:-}" ] || skip "API_BASE_URL is required"

  request_json GET "${API_BASE_URL%/}/health"
  [ "$HTTP_STATUS" -eq 200 ]
  echo "$HTTP_BODY" | jq -e '.status | IN("ok", "healthy", "up")'
}

@test "POST /users creates user" {
  [ -n "${API_BASE_URL:-}" ] || skip "API_BASE_URL is required"

  local email="bats.$RANDOM.$RANDOM@example.test"
  request_json POST "${API_BASE_URL%/}/users" \
    --data "$(jq -nc --arg email "$email" '{name:"Bats User", email:$email}')"

  [ "$HTTP_STATUS" -eq 201 ]
  echo "$HTTP_BODY" | jq -e --arg email "$email" '.email == $email and .id != null'
}
```

### Notes
- Prefer `jq` over regex for JSON assertions.
- Generate unique test data to avoid collisions.
- For stateful APIs, add explicit cleanup calls or disposable environments.

## Common Mistakes

- **Parsing JSON with `grep` only** → brittle checks; use `jq -e`.
- **Only happy-path tests** → add negative-path assertions for each command/endpoint.
- **Using `run` for stateful sourced-function tests** → side effects disappear (subshell).
- **Leaking local machine state** (`HOME`, config dirs) → isolate with temp dirs.

## Quick Checklist

Before claiming tests are done:

- [ ] Exit code and output are both asserted
- [ ] At least one failure-path test exists
- [ ] Sourced-library tests include non-`run` state checks when relevant
- [ ] API JSON assertions use `jq`
- [ ] Test state is isolated and reproducible
