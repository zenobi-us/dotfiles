#!/usr/bin/env bats
# No test supplies production approval or accesses the real cleanup target tree.
setup() {
  export PYTHONDONTWRITEBYTECODE=1
  unset PI_INK_CLEANUP_APPROVED PI_INK_CLEANUP_EXECUTOR_APPROVED
}
fixture_case() {
  run python3 "$BATS_TEST_DIRNAME/remote_smoke.py" "$1"
  [ "$status" -eq 0 ]
  [[ "$output" == *PASS* ]]
}
@test "launcher refuses missing irreversible approval before file or route access" {
  run python3 "$BATS_TEST_DIRNAME/cleanup.py" cleanup-once
  [ "$status" -ne 0 ]
  [ "$output" = 'CLEANUP_REFUSAL NEW_IRREVERSIBLE_APPROVAL_REQUIRED' ]
  [ ! -e "$BATS_TEST_DIRNAME/execution-0036" ]
}
@test "production executor refuses apply without exact manifest approval" {
  run "$BATS_TEST_DIRNAME/cleanup-linux-amd64" apply
  [ "$status" -eq 2 ]
  [ "$output" = 'CLEANUP_REFUSAL NEW_EXACT_EXECUTION_APPROVAL_REQUIRED' ]
}
@test "production executor has no alternate root or target argument" {
  run "$BATS_TEST_DIRNAME/cleanup-linux-amd64" apply --root=/tmp/unapproved
  [ "$status" -eq 2 ]
  [ "$output" = 'CLEANUP_REFUSAL EXACT_CHECK_OR_APPLY_REQUIRED' ]
}
@test "remote helper stages, applies only synthetic state, and removes itself" { fixture_case success; }
@test "occupied remote staging path is preserved" { fixture_case occupied; }
@test "bad remote transfer is preserved and never executed" { fixture_case bad-transfer; }
@test "partial cleanup failure leaves helper and never rolls back or retries" { fixture_case partial-failure; }
@test "completion refuses missing, duplicate or unapproved removal records" { fixture_case completion-boundaries; }
