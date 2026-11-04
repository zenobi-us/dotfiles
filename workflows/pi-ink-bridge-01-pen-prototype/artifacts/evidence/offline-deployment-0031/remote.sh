#!/bin/sh
# Cable-SSH transaction under ADR0001. stdin contains only the pinned reader.
# No cleanup trap: interruption or failure must preserve uncertain objects.
set -eu
set -f
LC_ALL=C
export LC_ALL
umask 077
expected_uid=0
expected_gid=0
ancestors='/ /home /home/root'
staging=/home/root/pi-ink-offline-reader-0029
helper=$staging/reader
expected_sha=03016b9c35aeecd82362fe34e4187037a7ee5ebf76014fd7df2f6264aca228d6
expected_size=2489186
abort() { printf 'DEPLOYMENT_REFUSAL %s\n' "$1"; exit 1; }
directory_identity() { stat -c '%d:%i:%u:%g:%a' "$staging"; }
helper_identity() { stat -c '%d:%i:%u:%g:%a:%h:%s:%y:%z' "$helper"; }
check_ancestors() {
  for directory in $ancestors; do
    test ! -L "$directory" && test -d "$directory" || abort ANCESTOR_TYPE
    test "$(stat -c '%u:%g' "$directory")" = "$expected_uid:$expected_gid" || abort ANCESTOR_OWNER
  done
}
check_directory() {
  check_ancestors
  test ! -L "$staging" && test -d "$staging" || abort STAGING_TYPE
  test "$(directory_identity)" = "$directory_pin" || abort STAGING_IDENTITY
}
check_helper() {
  check_directory
  test ! -L "$helper" && test -f "$helper" || abort HELPER_TYPE
  test "$(helper_identity)" = "$helper_pin" || abort HELPER_IDENTITY
  actual_sha=$(sha256sum "$helper") || abort HELPER_HASH_READ
  test "${actual_sha%% *}" = "$expected_sha" || abort HELPER_HASH
  test "$(helper_identity)" = "$helper_pin" || abort HELPER_CHANGED_DURING_HASH
  check_directory
}
for utility in stat mkdir cat chmod sha256sum rm rmdir; do
  command -v "$utility" >/dev/null 2>&1 || abort REQUIRED_UTILITY
 done
check_ancestors
# mkdir is the exclusive reservation, including for dangling-link collisions.
mkdir -m 700 "$staging" || abort STAGING_OCCUPIED_OR_UNAVAILABLE
test ! -L "$staging" && test -d "$staging" || abort STAGING_TYPE
test "$(stat -c '%u:%g:%a' "$staging")" = "$expected_uid:$expected_gid:700" || abort STAGING_METADATA
directory_pin=$(directory_identity)
check_directory
# Only this newly created, private directory can receive bytes. Never reuse it.
set -C
cat > "$helper" || abort TRANSFER
set +C
check_directory
test ! -L "$helper" && test -f "$helper" || abort HELPER_TYPE
test "$(stat -c '%u:%g:%a:%h:%s' "$helper")" = "$expected_uid:$expected_gid:600:1:$expected_size" || abort TRANSFER_METADATA
transfer_pin=$(helper_identity)
actual_sha=$(sha256sum "$helper") || abort TRANSFER_HASH_READ
test "${actual_sha%% *}" = "$expected_sha" || abort TRANSFER_HASH
test "$(helper_identity)" = "$transfer_pin" || abort TRANSFER_CHANGED
check_directory
# Permission change applies only to the newly created, verified helper.
chmod 500 "$helper" || abort NEW_HELPER_EXECUTABLE_MODE
test ! -L "$helper" && test "$(stat -c '%u:%g:%a:%h:%s' "$helper")" = "$expected_uid:$expected_gid:500:1:$expected_size" || abort EXECUTABLE_METADATA
helper_pin=$(helper_identity)
check_helper
printf '%s\n' READER_INVOCATION_BEGIN
# Foreground execution establishes termination before any removal is attempted.
if "$helper"; then
  printf '%s\n' READER_EXIT_ZERO
else
  abort READER_EXIT_NONZERO_HELPER_PRESERVED
fi
check_helper
rm -- "$helper" || abort HELPER_UNLINK_FAILED
check_directory
# rmdir refuses unknown contents. No enumeration or recursive removal is allowed.
rmdir -- "$staging" || abort STAGING_NOT_EMPTY_OR_REMOVE_FAILED
printf '%s\n' HELPER_REMOVED_AND_DIRECTORY_EMPTY_REMOVED
