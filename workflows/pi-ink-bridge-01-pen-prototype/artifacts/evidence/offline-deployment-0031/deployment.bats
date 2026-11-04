#!/usr/bin/env bats
# Real local shell transactions use synthetic roots and payloads only.
setup() {
  export PYTHONDONTWRITEBYTECODE=1
}
check_case() {
  run python3 "$BATS_TEST_DIRNAME/smoke.py" "$1"
  [ "$status" -eq 0 ]
  [[ "$output" == *PASS* ]]
}
@test "successful reader runs once and removes only its helper directory" { check_case success; }
@test "occupied staging directory preserves existing content" { check_case occupied; }
@test "dangling staging symlink is not reused" { check_case dangling; }
@test "symlinked ancestor prevents staging" { check_case ancestor-link; }
@test "wrong transfer hash preserves helper without execution" { check_case bad-transfer; }
@test "oversize transfer preserves helper without execution" { check_case oversize; }
@test "reader failure preserves helper without retry" { check_case reader-failure; }
@test "changed helper identity prevents removal" { check_case helper-changed; }
@test "unknown directory content survives failed rmdir" { check_case unexpected-file; }
@test "missing execution approval stops before route or SSH" { check_case host-gate; }
@test "only the exact direct USB route is accepted" { check_case route; }
@test "success requires both hashes, termination and removal evidence" { check_case success-parser; }
