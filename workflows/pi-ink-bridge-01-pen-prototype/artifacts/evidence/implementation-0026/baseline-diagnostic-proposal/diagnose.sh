# Read-only baseline-path diagnosis. Do not run without separate exact owner approval.
# Stop at unknown parent links so metadata collection cannot escape the fixed path.
set -eu
for path in / /etc /etc/systemd /etc/systemd/system /etc/systemd/system/xochitl.service.d; do
  printf 'FIXED_PARENT %s\n' "$path"
  if test -L "$path"; then
    stat -c 'TYPE=%F MODE=%a UID=%u GID=%g SIZE=%s MTIME=%Y' "$path"
    printf '%s\n' 'STOP_PARENT_SYMLINK_NO_DEREFERENCE'
    exit 0
  fi
  if test ! -e "$path"; then
    printf '%s\n' 'STOP_PARENT_MISSING_OR_INACCESSIBLE'
    exit 0
  fi
  stat -c 'TYPE=%F MODE=%a UID=%u GID=%g SIZE=%s MTIME=%Y' "$path"
  if test ! -d "$path"; then
    printf '%s\n' 'STOP_PARENT_NOT_DIRECTORY'
    exit 0
  fi
done
path=/etc/systemd/system/xochitl.service.d/00-xovi.conf
printf 'FIXED_BASELINE %s\n' "$path"
if test -L "$path"; then
  stat -c 'TYPE=%F MODE=%a UID=%u GID=%g SIZE=%s MTIME=%Y' "$path"
  printf '%s\n' 'BASELINE_SYMLINK_NO_DEREFERENCE'
elif test ! -e "$path"; then
  printf '%s\n' 'BASELINE_MISSING_OR_INACCESSIBLE'
else
  stat -c 'TYPE=%F MODE=%a UID=%u GID=%g SIZE=%s MTIME=%Y' "$path"
  if test -f "$path"; then
    size=$(stat -c '%s' "$path")
    if test "$size" -le 65536; then
      sha256sum "$path"
    else
      printf '%s\n' 'BASELINE_HASH_SKIPPED_SIZE_OVER_65536'
    fi
  else
    printf '%s\n' 'BASELINE_NOT_REGULAR_NO_CONTENT_READ'
  fi
fi
printf '%s\n' 'READ_ONLY_BASELINE_DIAGNOSTIC_COMPLETE_NO_REPAIR'
