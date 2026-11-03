# Read-only investigation for a separately approved restoration decision.
# Effective paths never become filesystem inputs; unknown values stay redacted.
set -eu
set -f
main() {
  inspect_effective_service
  inspect_fixed_file /usr/lib/systemd/system/xochitl.service 65536 23f537cf59d527bfbf4823f372385d613e1ade0961c98831c935a372018f9566
  inspect_fixed_file /etc/systemd/system/xochitl.service.d/50-computed-widgets-01-preflight.conf 65536 84a2d95c2284a2f2fdb5ae70b4f25eb4a5ef2fbf6f94391fc03e4c54643314ef
  inspect_fixed_file /etc/systemd/system/xochitl.service.d/qt-resource-rebuilder.conf 65536 6036f7776f8775529f94056fafe066ff373f5aa6bca39633bfd4dabfc1552ffd
  inspect_fixed_file /usr/lib/systemd/system/xochitl.service.d/xochitl-service-override.conf 65536 a9432caffacb29d6fcb35136dcc3cb43d8737eb6c2efcb35ea335725f42082d1
  inspect_actor
  inspect_fixed_file /home/root/xovi/extensions.d/webserver-remote.so 9000000 24bcfe6c0b0b44c35401f214b0ccc451cdb60d2fd0e8c718beac92be25f6dd0f
  inspect_fixed_file /home/root/pi-ink-webserver-remote-backup-0020/webserver-remote.so 9000000 24bcfe6c0b0b44c35401f214b0ccc451cdb60d2fd0e8c718beac92be25f6dd0f
  inspect_fixed_file /home/root/xovi/extensions.d/pi-ink-loopback-0020.so 9000000 aeba9fc3d8aa816bda0db8c08d4cc5929a677a83f5e8e14b02a39bc70aef5c4f
  inspect_fixed_file /home/root/pi-ink-rollback-owned-0020/adapter.so 9000000 aeba9fc3d8aa816bda0db8c08d4cc5929a677a83f5e8e14b02a39bc70aef5c4f
  printf '%s\n' 'READ_ONLY_RECOVERY_INVESTIGATION_COMPLETE_NO_REPAIR'
}
inspect_effective_service() {
  printf '%s\n' 'EFFECTIVE_XOCHITL_METADATA_BEGIN'
  fragment=$(systemctl show xochitl -p FragmentPath --value)
  if test "$fragment" = /usr/lib/systemd/system/xochitl.service; then
    printf '%s\n' 'FragmentPath=/usr/lib/systemd/system/xochitl.service'
  else printf '%s\n' 'FragmentPath=UNKNOWN_OR_MISMATCH_REDACTED'; fi
  dropins=$(systemctl show xochitl -p DropInPaths --value)
  expected_dropins='/etc/systemd/system/xochitl.service.d/00-xovi.conf /etc/systemd/system/xochitl.service.d/50-computed-widgets-01-preflight.conf /etc/systemd/system/xochitl.service.d/qt-resource-rebuilder.conf /usr/lib/systemd/system/xochitl.service.d/xochitl-service-override.conf'
  if test "$dropins" = "$expected_dropins"; then printf '%s\n' 'DropInPaths_ORIGINAL_SET_ORDER=MATCH';
  else printf '%s\n' 'DropInPaths_ORIGINAL_SET_ORDER=MISMATCH'; fi
  for known_dropin in /etc/systemd/system/xochitl.service.d/00-xovi.conf /etc/systemd/system/xochitl.service.d/50-computed-widgets-01-preflight.conf /etc/systemd/system/xochitl.service.d/qt-resource-rebuilder.conf /usr/lib/systemd/system/xochitl.service.d/xochitl-service-override.conf; do
    case " $dropins " in *" $known_dropin "*) printf 'KNOWN_DROPIN_PRESENT %s\n' "$known_dropin" ;; *) printf 'KNOWN_DROPIN_NOT_REPORTED %s\n' "$known_dropin" ;; esac
  done
  active=$(systemctl show xochitl -p ActiveState --value)
  case "$active" in active|inactive|failed|activating|deactivating|reloading|maintenance|refreshing) printf 'ActiveState=%s\n' "$active" ;; *) printf '%s\n' 'ActiveState=UNKNOWN_REDACTED' ;; esac
  pid=$(systemctl show xochitl -p MainPID --value)
  case "$pid" in ''|*[!0-9]*) printf '%s\n' 'MainPID=UNKNOWN_REDACTED' ;; *) if test "${#pid}" -le 10; then printf 'MainPID=%s\n' "$pid"; else printf '%s\n' 'MainPID=UNKNOWN_REDACTED'; fi ;; esac
  job=$(systemctl show xochitl -p Job --value)
  case "$job" in ''|0) printf '%s\n' 'Job=IDLE' ;; *[!0-9]*) printf '%s\n' 'Job=UNKNOWN_REDACTED' ;; *) if test "${#job}" -le 10; then printf 'Job=PENDING_NUMERIC_%s\n' "$job"; else printf '%s\n' 'Job=UNKNOWN_REDACTED'; fi ;; esac
  exec_value=$(systemctl show xochitl -p ExecStart --value)
  case "$exec_value" in
    '{ path=/usr/bin/xochitl ; argv[]=/usr/bin/xochitl --system ; '*)
      exec_tail=${exec_value#'{ path=/usr/bin/xochitl ; argv[]=/usr/bin/xochitl --system ; '}
      case "$exec_tail" in *'path='*|*'argv[]='*) printf '%s\n' 'ExecStart_KNOWN_SINGLE_PATH_ARGV=MISMATCH' ;; *) printf '%s\n' 'ExecStart_KNOWN_SINGLE_PATH_ARGV=MATCH' ;; esac ;;
    *) printf '%s\n' 'ExecStart_KNOWN_SINGLE_PATH_ARGV=MISMATCH' ;;
  esac
  environment=$(systemctl show xochitl -p Environment --value)
  expected_environment='LD_PRELOAD=/home/root/xovi/xovi.so XOVI_ROOT=/home/root/xovi/services/xochitl.service/ QML_DISABLE_DISK_CACHE=1 QML_XHR_ALLOW_FILE_WRITE=1 QML_XHR_ALLOW_FILE_READ=1 MALLOC_ARENA_MAX=8'
  if test "$environment" = "$expected_environment"; then printf '%s\n' 'Environment_ORIGINAL_WHOLE_VALUE=MATCH';
  else printf '%s\n' 'Environment_ORIGINAL_WHOLE_VALUE=MISMATCH'; fi
  case " $environment " in *' LD_PRELOAD=/home/root/xovi/xovi.so '*) printf '%s\n' 'KNOWN_XOVI_PRELOAD_TOKEN=PRESENT' ;; *) printf '%s\n' 'KNOWN_XOVI_PRELOAD_TOKEN=NOT_CONFIRMED' ;; esac
  case " $environment " in *' XOVI_ROOT=/home/root/xovi/services/xochitl.service/ '*) printf '%s\n' 'KNOWN_XOVI_ROOT_TOKEN=PRESENT' ;; *) printf '%s\n' 'KNOWN_XOVI_ROOT_TOKEN=NOT_CONFIRMED' ;; esac
  unset environment exec_value exec_tail 2>/dev/null || true
  printf '%s\n' 'EFFECTIVE_XOCHITL_METADATA_END_CONFIGURATION_IS_NOT_MAPPING_PROOF'
}
parents_safe() {
  rest=${1%/*}
  rest=${rest#/}
  parent=/
  check_directory "$parent" || return 1
  while test -n "$rest"; do
    component=${rest%%/*}
    if test "$parent" = /; then parent=/$component; else parent=$parent/$component; fi
    check_directory "$parent" || return 1
    case "$rest" in */*) rest=${rest#*/} ;; *) rest='' ;; esac
  done
}
check_directory() {
  printf 'FIXED_PARENT %s\n' "$1"
  if test -L "$1"; then stat -c 'TYPE=%F MODE=%a UID=%u GID=%g SIZE=%s MTIME=%Y' "$1"; printf '%s\n' 'STOP_PARENT_SYMLINK_NO_DEREFERENCE'; return 1; fi
  if test ! -e "$1"; then printf '%s\n' 'STOP_PARENT_MISSING_OR_INACCESSIBLE'; return 1; fi
  stat -c 'TYPE=%F MODE=%a UID=%u GID=%g SIZE=%s MTIME=%Y' "$1"
  if test ! -d "$1"; then printf '%s\n' 'STOP_PARENT_NOT_DIRECTORY'; return 1; fi
}
inspect_fixed_file() {
  printf 'FIXED_FILE %s\n' "$1"
  if ! parents_safe "$1"; then printf '%s\n' 'FILE_SKIPPED_UNSAFE_PARENT'; return 0; fi
  if test -L "$1"; then stat -c 'TYPE=%F MODE=%a UID=%u GID=%g SIZE=%s MTIME=%Y' "$1"; printf '%s\n' 'FILE_SYMLINK_NO_DEREFERENCE'; return 0; fi
  if test ! -e "$1"; then printf '%s\n' 'FILE_MISSING_OR_INACCESSIBLE'; return 0; fi
  stat -c 'TYPE=%F MODE=%a UID=%u GID=%g SIZE=%s MTIME=%Y' "$1"
  if test ! -f "$1"; then printf '%s\n' 'FILE_NOT_REGULAR_NO_CONTENT_READ'; return 0; fi
  size=$(stat -c '%s' "$1")
  if test "$size" -gt "$2"; then printf '%s\n' 'FILE_HASH_SKIPPED_SIZE_LIMIT'; return 0; fi
  digest=$(sha256sum "$1")
  digest=${digest%% *}
  case "$digest" in ''|*[!0-9a-f]*) printf '%s\n' 'FILE_HASH_UNKNOWN'; return 0 ;; esac
  test "${#digest}" -eq 64 || { printf '%s\n' 'FILE_HASH_UNKNOWN'; return 0; }
  printf 'SHA256=%s\n' "$digest"
  if test "$digest" = "$3"; then printf '%s\n' 'ORIGINAL_KNOWN_HASH=MATCH'; else printf '%s\n' 'ORIGINAL_KNOWN_HASH=MISMATCH_NO_REPAIR'; fi
}
inspect_actor() {
  actor=/home/root/pi-ink-operation-0020/actor.txt
  printf '%s\n' 'FIXED_OWNED_ACTOR_BEGIN'
  if ! parents_safe "$actor"; then printf '%s\n' 'ACTOR_SKIPPED_UNSAFE_PARENT'; return 0; fi
  if test "$(stat -c '%u %g %a' /home/root/pi-ink-operation-0020)" != '0 0 700'; then printf '%s\n' 'ACTOR_PARENT_OWNER_MODE_UNKNOWN'; return 0; fi
  if test -L "$actor"; then stat -c 'TYPE=%F MODE=%a UID=%u GID=%g SIZE=%s MTIME=%Y' "$actor"; printf '%s\n' 'ACTOR_SYMLINK_NOT_READ'; return 0; fi
  if test ! -e "$actor"; then printf '%s\n' 'ACTOR_MISSING_OR_INACCESSIBLE'; return 0; fi
  stat -c 'TYPE=%F MODE=%a UID=%u GID=%g SIZE=%s MTIME=%Y' "$actor"
  if test ! -f "$actor" || test "$(stat -c '%u %g %a' "$actor")" != '0 0 600' || test "$(stat -c '%s' "$actor")" -gt 256; then printf '%s\n' 'ACTOR_TYPE_OWNER_MODE_SIZE_UNKNOWN_NOT_READ'; return 0; fi
  second_line=''
  actor_parse_valid=1
  {
    if ! read -r phase manifest actor_pid extra; then actor_parse_valid=0; fi
    if IFS= read -r second_line || test -n "$second_line"; then actor_parse_valid=0; fi
  } < "$actor"
  if test "$actor_parse_valid" -ne 1 || test -n "${extra-}"; then printf '%s\n' 'ACTOR_MULTILINE_OR_PARSE_UNKNOWN_REDACTED'; return 0; fi
  case "${phase-}" in load|repair|rollback) ;; *) printf '%s\n' 'ACTOR_PHASE_UNKNOWN_REDACTED'; return 0 ;; esac
  case "${manifest-}" in d5b0222e8806b5a3bc1874fb49a07290eedfb54892573257f6a08d607df9a8fa|261f3409cc7315a86710b72308de30396eee651870d0c145dd800c786c1d8a72|9ce7ecaa8bd9607e938ea75ea7cae957728e6592a7d2bdb4b329f06e0939a57c) ;; *) printf '%s\n' 'ACTOR_MANIFEST_UNKNOWN_REDACTED'; return 0 ;; esac
  case "${actor_pid-}" in ''|*[!0-9]*) printf '%s\n' 'ACTOR_PID_UNKNOWN_REDACTED'; return 0 ;; esac
  if test "${#actor_pid}" -gt 10 || test "$actor_pid" -le 1; then printf '%s\n' 'ACTOR_PID_UNKNOWN_REDACTED'; return 0; fi
  printf 'ACTOR_PHASE=%s ACTOR_MANIFEST=%s ACTOR_PID=%s\n' "$phase" "$manifest" "$actor_pid"
  if ! parents_safe "/proc/$actor_pid/status"; then printf '%s\n' 'ACTOR_PID_PRESENCE=ABSENT_INACCESSIBLE_OR_UNSAFE'; return 0; fi
  printf '%s\n' 'ACTOR_PID_PRESENCE=PRESENT_IDENTITY_UNVERIFIED_NO_SIGNALS'
}
main
