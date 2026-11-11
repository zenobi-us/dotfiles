# New read-only permission only. No config values parsed or printed.
set -eu
set -f
LC_ALL=C
export LC_ALL
abort() { printf '%s\n' "$1"; exit 1; }
for utility in stat dd sha256sum; do
  command -v "$utility" >/dev/null 2>&1 || abort ABORT_REQUIRED_UTILITY_UNAVAILABLE
done
(set -o pipefail) 2>/dev/null || abort ABORT_BOUNDED_PIPELINE_CAPABILITY_UNAVAILABLE
set -o pipefail
stamp_format='TYPE=%F MODE=%a UID=%u GID=%g SIZE=%s DEV=%d INODE=%i MTIME=%y CTIME=%z'
owner_sha=a9eecd4c06a5fa0ec38a0935ad97fd29654f7b8b828493b2ca96ffe1116cbf8d
safe_parents() {
  for parent in / /home /home/root "$1"; do
    test ! -L "$parent" && test -d "$parent" || abort ABORT_PARENT_LINK_OR_TYPE_REFUSED
    test "$(stat -c '%u %g' "$parent")" = '0 0' || abort ABORT_PARENT_OWNER_REFUSED
  done
  test "$(stat -c '%a' "$1")" = 700 || abort ABORT_KNOWN_ROOT_MODE_REFUSED
}
hash_guarded() {
  file=$1
  limit=$2
  case "$file" in
    /home/root/pi-ink-sidebar-stage-0020/owner.txt) expected_mode=644; leaf_role=public-stage-marker ;;
    /home/root/pi-ink-sidebar-backup-0020/owner.txt) expected_mode=600; leaf_role=public-backup-marker ;;
    /home/root/pi-ink-sidebar-stage-0020/config.json) expected_mode=600; leaf_role=private-stage-config ;;
    /home/root/pi-ink-sidebar-backup-0020/config.json) expected_mode=600; leaf_role=private-backup-config ;;
    *) abort ABORT_UNAPPROVED_FIXED_LEAF_ROLE ;;
  esac
  printf 'FIXED_LEAF_PROGRESS ROLE=%s PATH=%s\n' "$leaf_role" "$file"
  test ! -L "$file" && test -f "$file" || abort ABORT_FIXED_LEAF_LINK_OR_TYPE_REFUSED
  case "$file" in
    /home/root/pi-ink-sidebar-stage-0020/owner.txt|/home/root/pi-ink-sidebar-backup-0020/owner.txt)
      printf 'PUBLIC_MARKER_METADATA PATH=%s %s\n' "$file" "$(stat -c "$stamp_format" "$file")" ;;
  esac
  test "$(stat -c '%u %g %a' "$file")" = "0 0 $expected_mode" || abort ABORT_FIXED_LEAF_OWNER_OR_MODE_REFUSED
  size=$(stat -c '%s' "$file")
  case "$size" in ''|*[!0-9]*) abort ABORT_FIXED_LEAF_SIZE_INVALID ;; esac
  test "$size" -le "$limit" || abort ABORT_FIXED_LEAF_SIZE_CAP_REFUSED
  metadata_result=$(stat -c "$stamp_format" "$file")
  if ! hash_result=$(dd if="$file" bs="$((limit + 1))" count=1 iflag=nofollow,nonblock,fullblock status=none | sha256sum); then
    abort ABORT_BOUNDED_NOFOLLOW_READ_OR_HASH_FAILED
  fi
  test ! -L "$file" && test -f "$file" || abort ABORT_FIXED_LEAF_CHANGED_DURING_READ
  test "$(stat -c "$stamp_format" "$file")" = "$metadata_result" || abort ABORT_FIXED_LEAF_CHANGED_DURING_READ
  digest_result=${hash_result%% *}
  case "$digest_result" in ''|*[!0-9a-f]*) abort ABORT_SHA256_FORMAT_REFUSED ;; esac
  test "${#digest_result}" -eq 64 || abort ABORT_SHA256_FORMAT_REFUSED
}
# Establish BOTH known owners before either private config read.
for root in /home/root/pi-ink-sidebar-stage-0020 /home/root/pi-ink-sidebar-backup-0020; do
  safe_parents "$root"
  root_stamp=$(stat -c "$stamp_format" "$root")
  hash_guarded "$root/owner.txt" 4096
  test "$digest_result" = "$owner_sha" || abort ABORT_KNOWN_ROOT_MARKER_HASH_MISMATCH
  safe_parents "$root"
  test "$(stat -c "$stamp_format" "$root")" = "$root_stamp" || abort ABORT_KNOWN_ROOT_CHANGED
  case "$root" in
    /home/root/pi-ink-sidebar-stage-0020) stage_root_stamp=$root_stamp; stage_owner_stamp=$metadata_result ;;
    /home/root/pi-ink-sidebar-backup-0020) backup_root_stamp=$root_stamp; backup_owner_stamp=$metadata_result ;;
  esac
done
for root in /home/root/pi-ink-sidebar-stage-0020 /home/root/pi-ink-sidebar-backup-0020; do
  safe_parents "$root"
  case "$root" in
    /home/root/pi-ink-sidebar-stage-0020) expected_root=$stage_root_stamp; expected_owner=$stage_owner_stamp ;;
    /home/root/pi-ink-sidebar-backup-0020) expected_root=$backup_root_stamp; expected_owner=$backup_owner_stamp ;;
  esac
  test "$(stat -c "$stamp_format" "$root")" = "$expected_root" || abort ABORT_KNOWN_ROOT_CHANGED
  test ! -L "$root/owner.txt" && test "$(stat -c "$stamp_format" "$root/owner.txt")" = "$expected_owner" || abort ABORT_KNOWN_ROOT_MARKER_CHANGED
  hash_guarded "$root/config.json" 65536
  safe_parents "$root"
  test "$(stat -c "$stamp_format" "$root")" = "$expected_root" || abort ABORT_KNOWN_ROOT_CHANGED
  printf 'CONFIG_COPY_METADATA PATH=%s %s\n' "$root/config.json" "$metadata_result"
  printf 'CONFIG_COPY_SHA256 PATH=%s SHA256=%s\n' "$root/config.json" "$digest_result"
done
for root in /home/root/pi-ink-sidebar-stage-0020 /home/root/pi-ink-sidebar-backup-0020; do
  safe_parents "$root"
  case "$root" in
    /home/root/pi-ink-sidebar-stage-0020) expected_root=$stage_root_stamp; expected_owner=$stage_owner_stamp ;;
    /home/root/pi-ink-sidebar-backup-0020) expected_root=$backup_root_stamp; expected_owner=$backup_owner_stamp ;;
  esac
  test "$(stat -c "$stamp_format" "$root")" = "$expected_root" || abort ABORT_KNOWN_ROOT_CHANGED
  test ! -L "$root/owner.txt" && test "$(stat -c "$stamp_format" "$root/owner.txt")" = "$expected_owner" || abort ABORT_KNOWN_ROOT_MARKER_CHANGED
done
printf '%s\n' 'TWO_FIXED_CONFIG_DIGESTS_COMPLETE_NO_DELETION_AUTHORITY'
