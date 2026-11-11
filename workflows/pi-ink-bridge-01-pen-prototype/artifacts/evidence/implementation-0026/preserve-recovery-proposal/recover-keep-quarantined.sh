# NEW separately approved preserve-current recovery; exactly one restart request at most.
set -eu
set -f
proxy_choice=keep-quarantined
# proxy_choice is a literal frozen into one of two separate reviewed target scripts.
main() {
  inventory_count=0; hash_bytes=0; candidates=''; xochitl_pid=0
  require_current_config
  require_terminal_actor
  trusted_root /home/root/pi-ink-bridge-0020 || abort payload_root_ownership_unknown
  trusted_root /home/root/pi-ink-webserver-remote-backup-0020 || abort proxy_backup_root_ownership_unknown
  require_client_identity
  require_original_proxy_backup
  test "$(systemctl show xochitl -p ActiveState --value)" = active || abort xochitl_not_active
  before_pid=$(systemctl show xochitl -p MainPID --value)
  test "$before_pid" = 112810 || abort xochitl_pid_changed_no_guessed_amendment
  assert_exact aeba9fc3d8aa816bda0db8c08d4cc5929a677a83f5e8e14b02a39bc70aef5c4f /home/root/xovi/extensions.d/pi-ink-loopback-0020.so 10485760
  assert_exact 09aff9e7671d2931ffc54e16f943e922d2b66712fa40fb5e940acb1480e5b4e9 /home/root/xovi/exthome/qt-resource-rebuilder/pi-ink-bridge-0020.qmd 10485760
  parents_safe /home/root/pi-ink-rollback-owned-0020 || abort recovery_destination_parent_unknown
  test ! -e /home/root/pi-ink-rollback-owned-0020 && test ! -L /home/root/pi-ink-rollback-owned-0020 || abort recovery_destination_collision
  printf '%s\n' 'ALL_MUTATION_GUARDS_PASSED_NEW_SAVED_CLOSED_AND_ONE_RESTART_APPROVAL_REQUIRED'
  systemctl --no-block stop pi-ink-bridge-sidebar-0020.service
  printf '%s\n' 'EXACT_OWNED_CLIENT_STOP_REQUESTED_ONCE'
  stopped=no
  for attempt in 1 2 3 4 5 6 7 8 9 10; do
    if client_is_inactive; then stopped=yes; break; fi
    sleep 1
  done
  test "$stopped" = yes || abort owned_client_stop_not_proved_no_retry
  umask 077
  mkdir /home/root/pi-ink-rollback-owned-0020
  cp -p /home/root/pi-ink-bridge-0020/owner.txt /home/root/pi-ink-rollback-owned-0020/owner.txt
  mv /home/root/xovi/extensions.d/pi-ink-loopback-0020.so /home/root/pi-ink-rollback-owned-0020/adapter.so
  mv /home/root/xovi/exthome/qt-resource-rebuilder/pi-ink-bridge-0020.qmd /home/root/pi-ink-rollback-owned-0020/pi-ink-bridge.qmd
  printf '%s\n' 'OWNED_ADAPTER_AND_QMD_DISARMED_FILES_RETAINED_NO_UNMAPPING_CLAIM'
  case "$proxy_choice" in
    return-original)
      mv /home/root/pi-ink-webserver-remote-backup-0020/webserver-remote.so /home/root/xovi/extensions.d/webserver-remote.so
      assert_exact 24bcfe6c0b0b44c35401f214b0ccc451cdb60d2fd0e8c718beac92be25f6dd0f /home/root/xovi/extensions.d/webserver-remote.so 9000000
      test "$(stat -c '%a %u %g %s %Y' /home/root/xovi/extensions.d/webserver-remote.so)" = '644 0 0 8453696 1793049401' || abort returned_proxy_metadata_mismatch
      printf '%s\n' 'OWNER_CHOSEN_ORIGINAL_PROXY_FILE_RETURNED_WILDCARD80_MAY_REAPPEAR_IF_XOVI_LOADS' ;;
    keep-quarantined)
      require_original_proxy_backup
      printf '%s\n' 'OWNER_CHOSEN_ORIGINAL_PROXY_QUARANTINE_RETAINED_PERSISTENT_OWNED_PATH_DEVIATION' ;;
    *) abort unapproved_proxy_branch ;;
  esac
  require_current_config
  test "$(systemctl show xochitl -p MainPID --value)" = "$before_pid" || abort concurrent_xochitl_change_no_restart
  systemctl --no-block restart xochitl
  printf '%s\n' 'NEW_ALLOWANCE_XOCHITL_RESTART_REQUESTED_ONCE_NO_HISTORICAL_COUNT_ASSUMPTION'
  ready=no
  for attempt in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20; do
    active=$(systemctl show xochitl -p ActiveState --value)
    test "$active" != failed || abort xochitl_failed_after_restart
    pid=$(systemctl show xochitl -p MainPID --value)
    if test "$active" = active && numeric_pid "$pid" && test "$pid" != "$before_pid"; then ready=yes; break; fi
    sleep 1
  done
  test "$ready" = yes || abort current_config_restart_not_ready_no_retry
  ready_pid=$pid
  sleep 2
  require_current_config
  client_is_inactive || abort owned_client_inactive_not_proved
  inspect_maps
  test "$xochitl_pid" = "$ready_pid" || abort xochitl_changed_again_after_single_restart
  test "${maps_complete-unknown}" = yes && test "${map_adapter-unknown}" = no || abort owned_adapter_unmapping_not_proved
  case "$proxy_choice" in keep-quarantined) test "$map_proxy" = no || abort quarantined_proxy_unexpectedly_mapped ;; esac
  for path in /home/root/xovi/extensions.d/pi-ink-loopback-0020.so /home/root/xovi/exthome/qt-resource-rebuilder/pi-ink-bridge-0020.qmd; do
    test ! -e "$path" && test ! -L "$path" || abort disarmed_active_path_reappeared
  done
  inspect_listeners
  require_no_ui_listener
  test "$(systemctl show xochitl -p MainPID --value)" = "$xochitl_pid" || abort postproof_pid_changed
  printf 'CURRENT_CONFIG_RECOVERY_POSTPROOF PID=%s PROXY_BRANCH=%s OWNED_CLIENT=inactive OWNED_ADAPTER=unmapped UI9821=absent\n' "$xochitl_pid" "$proxy_choice"
  printf '%s\n' 'INACTIVE_CREDENTIAL_CODE_COPIES_REMAIN_FINAL_GUARDED_CLEANUP_AND_POSTINVENTORY_STILL_REQUIRED'
}
require_no_ui_listener() {
  for network in tcp tcp6; do
    table=/proc/$$/net/$network
    parents_safe "$table" || abort postproof_network_parent_unknown
    rows=0
    while read -r sl local remote state rest; do
      rows=$((rows + 1)); test "$rows" -le 4096 || abort postproof_network_scan_cap
      test "$state" = 0A || continue
      case "$local" in *:265D) abort owned_ui_listener_still_present ;; esac
    done < "$table"
  done
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
numeric_pid() {
  case "$1" in ''|0*|*[!0-9]*) return 1 ;; esac
  test "${#1}" -le 10 && test "$1" -gt 1
}
inspect_maps() {
  xochitl_pid=$(systemctl show xochitl -p MainPID --value)
  if ! numeric_pid "$xochitl_pid" || ! parents_safe "/proc/$xochitl_pid/maps"; then printf '%s\n' 'XOCHITL_PROCESS_UNAVAILABLE'; return 0; fi
  exe=$(readlink "/proc/$xochitl_pid/exe" 2>/dev/null || true)
  if test "$exe" != /usr/bin/xochitl; then printf '%s\n' 'XOCHITL_EXE_LINK_MISMATCH_REDACTED'; return 0; fi
  candidates="xochitl:$xochitl_pid"
  map_xovi=no; map_adapter=no; map_proxy=no; map_rebuilder=no; map_appload=no; map_lines=0; maps_complete=yes
  while IFS= read -r line; do
    map_lines=$((map_lines + 1))
    if test "$map_lines" -gt 4096; then maps_complete=no; break; fi
    case "$line" in
      *' /home/root/xovi/xovi.so'|*' /home/root/xovi/xovi.so (deleted)') map_xovi=yes ;;
      *' /home/root/xovi/extensions.d/pi-ink-loopback-0020.so'|*' /home/root/xovi/extensions.d/pi-ink-loopback-0020.so (deleted)') map_adapter=yes ;;
      *' /home/root/xovi/extensions.d/webserver-remote.so'|*' /home/root/xovi/extensions.d/webserver-remote.so (deleted)') map_proxy=yes ;;
      *' /home/root/xovi/extensions.d/qt-resource-rebuilder.so'|*' /home/root/xovi/extensions.d/qt-resource-rebuilder.so (deleted)') map_rebuilder=yes ;;
      *' /home/root/xovi/extensions.d/appload.so'|*' /home/root/xovi/extensions.d/appload.so (deleted)') map_appload=yes ;;
    esac
  done < "/proc/$xochitl_pid/maps"
  printf 'KNOWN_MODULE_MAPS XOCHITL_PID=%s XOVI=%s ADAPTER=%s ORIGINAL_PROXY=%s REBUILDER=%s APPLOAD=%s SCAN_COMPLETE=%s\n' "$xochitl_pid" "$map_xovi" "$map_adapter" "$map_proxy" "$map_rebuilder" "$map_appload" "$maps_complete"
}
inspect_listeners() {
  candidate_sockets=''
  for candidate in $candidates; do
    candidate_label=${candidate%%:*}; candidate_pid=${candidate#*:}
    if ! parents_safe "/proc/$candidate_pid/fd/0"; then printf 'OWNER_FD_PARENT_UNAVAILABLE %s\n' "$candidate_label"; continue; fi
    fd=0
    while test "$fd" -lt 512; do
      link=$(readlink "/proc/$candidate_pid/fd/$fd" 2>/dev/null || true)
      case "$link" in
        'socket:['*']')
          socket_inode=${link#'socket:['}; socket_inode=${socket_inode%']'}
          case "$socket_inode" in ''|*[!0-9]*) ;; *) candidate_sockets="$candidate_sockets $candidate_label:$candidate_pid:$socket_inode" ;; esac ;;
      esac
      fd=$((fd + 1))
    done
  done
  for network in tcp tcp6; do
    table=/proc/$$/net/$network
    if ! parents_safe "$table" || test ! -f "$table"; then printf 'LISTENER_TABLE_UNAVAILABLE %s\n' "$network"; continue; fi
    rows=0; relevant=0; complete=yes
    while read -r sl local remote state queues timer retransmit uid timeout inode rest; do
      rows=$((rows + 1)); if test "$rows" -gt 4096; then complete=no; break; fi
      test "$state" = 0A || continue
      case "$local" in *:0050) port=80 ;; *:0051) port=81 ;; *:265D) port=9821 ;; *) continue ;; esac
      relevant=$((relevant + 1)); if test "$relevant" -gt 8; then complete=no; break; fi
      case "$inode" in ''|*[!0-9]*) printf '%s\n' 'RELEVANT_LISTENER_INODE_UNKNOWN'; continue ;; esac
      case "$local" in 00000000:*) binding=ipv4_wildcard ;; 0100007F:*) binding=ipv4_loopback ;; 00000000000000000000000000000000:*) binding=ipv6_wildcard ;; 00000000000000000000000001000000:*) binding=ipv6_loopback ;; *) binding=other_REDACTED ;; esac
      printf 'RELEVANT_LISTENER FAMILY=%s PORT=%s BINDING=%s\n' "$network" "$port" "$binding"
      for candidate in $candidates; do
        candidate_label=${candidate%%:*}; candidate_pid=${candidate#*:}; found=NOT_FOUND_WITHIN_BOUND
        case " $candidate_sockets " in *" $candidate_label:$candidate_pid:$inode "*) found=yes ;; esac
        printf 'LISTENER_CANDIDATE_OWNER=%s PID=%s MATCH_WITHIN_FD0_511=%s\n' "$candidate_label" "$candidate_pid" "$found"
      done
    done < "$table"
    printf 'LISTENER_SCAN FAMILY=%s RELEVANT_ROWS=%s SCAN_COMPLETE=%s\n' "$network" "$relevant" "$complete"
  done
  after=$(systemctl show xochitl -p MainPID --value)
  if test "$after" = "$xochitl_pid"; then printf '%s\n' 'XOCHITL_PID_STABLE=yes'; else printf '%s\n' 'XOCHITL_PID_STABLE=no_NO_RETRY'; fi
}
# Fixed-path inspection only. Unknown siblings and history subtrees remain untouched.
check_directory() {
  if test -L "$1"; then printf 'STOP_PARENT_SYMLINK_NO_DEREFERENCE %s\n' "$1"; return 1; fi
  if test ! -e "$1"; then printf 'STOP_PARENT_MISSING_OR_INACCESSIBLE %s\n' "$1"; return 1; fi
  if test ! -d "$1"; then printf 'STOP_PARENT_NOT_DIRECTORY %s\n' "$1"; return 1; fi
  if test "$(stat -c '%u %g' "$1")" != '0 0'; then printf 'STOP_PARENT_OWNER_UNKNOWN_PRESERVE %s\n' "$1"; return 1; fi
}
inspect_metadata() {
  inventory_count=$((inventory_count + 1))
  test "$inventory_count" -le 128 || { printf '%s\n' 'STOP_FIXED_INVENTORY_LIMIT'; exit 1; }
  printf 'FIXED_ARTIFACT %s\n' "$1"
  if ! parents_safe "$1"; then printf '%s\n' 'ARTIFACT_SKIPPED_UNSAFE_PARENT'; return 1; fi
  if test -L "$1"; then stat -c 'TYPE=%F MODE=%a UID=%u GID=%g SIZE=%s MTIME=%Y' "$1"; printf '%s\n' 'ARTIFACT_SYMLINK_PRESERVE_NO_DEREFERENCE'; return 1; fi
  if test ! -e "$1"; then printf '%s\n' 'ARTIFACT_MISSING_OR_INACCESSIBLE'; return 1; fi
  stat -c 'TYPE=%F MODE=%a UID=%u GID=%g SIZE=%s MTIME=%Y' "$1"
  return 0
}
trusted_root() {
  if ! inspect_metadata "$1"; then return 1; fi
  if test ! -d "$1" || test "$(stat -c '%u %g %a' "$1")" != '0 0 700'; then printf '%s\n' 'ROOT_TYPE_OWNER_MODE_UNKNOWN_PRESERVE'; return 1; fi
  marker=$1/owner.txt
  if ! parents_safe "$marker" || test -L "$marker" || test ! -f "$marker"; then printf '%s\n' 'ROOT_OWNER_MARKER_UNKNOWN_PRESERVE'; return 1; fi
  if test "$(stat -c '%u %g' "$marker")" != '0 0' || test "$(stat -c '%s' "$marker")" -gt 256; then printf '%s\n' 'ROOT_OWNER_MARKER_METADATA_UNKNOWN_PRESERVE'; return 1; fi
  marker_digest=$(sha256sum "$marker"); marker_digest=${marker_digest%% *}
  if test "$marker_digest" != a9eecd4c06a5fa0ec38a0935ad97fd29654f7b8b828493b2ca96ffe1116cbf8d; then printf '%s\n' 'ROOT_OWNER_MARKER_HASH_MISMATCH_PRESERVE'; return 1; fi
  printf '%s\n' 'ROOT_OWNER_MARKER_KNOWN_MATCH'
  return 0
}
# Guards for a NEW separately approved recovery, not a retry of historical scripts.
abort() { printf 'ABORT_PRESERVE_CURRENT %s\n' "$1"; exit 1; }
assert_exact() {
  file=$2
  parents_safe "$file" || abort unsafe_fixed_parent
  test ! -L "$file" && test -f "$file" || abort fixed_file_type
  test "$(stat -c '%u %g' "$file")" = '0 0' || abort fixed_file_owner
  test "$(stat -c '%s' "$file")" -le "$3" || abort fixed_file_size_cap
  sum=$(sha256sum "$file"); sum=${sum%% *}
  test "$sum" = "$1" || abort fixed_file_hash_mismatch
  printf 'EXACT_PUBLIC_HASH_MATCH %s\n' "$file"
}
require_current_config() {
  assert_exact 23f537cf59d527bfbf4823f372385d613e1ade0961c98831c935a372018f9566 /usr/lib/systemd/system/xochitl.service 65536
  assert_exact 84a2d95c2284a2f2fdb5ae70b4f25eb4a5ef2fbf6f94391fc03e4c54643314ef /etc/systemd/system/xochitl.service.d/50-computed-widgets-01-preflight.conf 65536
  assert_exact a9432caffacb29d6fcb35136dcc3cb43d8737eb6c2efcb35ea335725f42082d1 /usr/lib/systemd/system/xochitl.service.d/xochitl-service-override.conf 65536
  for absent in /etc/systemd/system/xochitl.service.d/00-xovi.conf /etc/systemd/system/xochitl.service.d/qt-resource-rebuilder.conf; do
    parents_safe "$absent" || abort unavailable_service_parent
    test ! -e "$absent" && test ! -L "$absent" || abort current_service_absence_changed
  done
  fragment=$(systemctl show xochitl -p FragmentPath --value)
  test "$fragment" = /usr/lib/systemd/system/xochitl.service || abort effective_fragment_changed
  dropins=$(systemctl show xochitl -p DropInPaths --value)
  test "$dropins" = '/etc/systemd/system/xochitl.service.d/50-computed-widgets-01-preflight.conf /usr/lib/systemd/system/xochitl.service.d/xochitl-service-override.conf' || abort effective_dropins_changed
  environment=$(systemctl show xochitl -p Environment --value)
  test "$environment" = MALLOC_ARENA_MAX=8 || abort effective_environment_not_exact_known_vendor_value
  unset environment
  command=$(systemctl show xochitl -p ExecStart --value)
  case "$command" in
    '{ path=/usr/bin/xochitl ; argv[]=/usr/bin/xochitl --system ; '*) tail=${command#'{ path=/usr/bin/xochitl ; argv[]=/usr/bin/xochitl --system ; '}; case "$tail" in *'path='*|*'argv[]='*) abort effective_command_extra ;; esac ;;
    *) abort effective_command_changed ;;
  esac
  unset command tail
  pending=$(systemctl show xochitl -p Job --value)
  case "$pending" in ''|0) ;; *) abort pending_xochitl_job ;; esac
  printf '%s\n' 'CURRENT_SERVICE_FILES_AND_EXACT_KNOWN_VENDOR_ACTIVATION_PRESERVED'
}
require_terminal_actor() {
  actor=/home/root/pi-ink-operation-0020/actor.txt
  parents_safe "$actor" || abort actor_parent_unknown
  test "$(stat -c '%u %g %a' /home/root/pi-ink-operation-0020)" = '0 0 700' || abort actor_root_unknown
  test ! -L "$actor" && test -f "$actor" || abort actor_type_unknown
  test "$(stat -c '%u %g %a' "$actor")" = '0 0 600' && test "$(stat -c '%s' "$actor")" -eq 81 || abort actor_metadata_changed
  IFS=' ' read -r phase manifest actor_pid extra < "$actor" || abort actor_parse
  test "$phase" = rollback && test "$manifest" = 9ce7ecaa8bd9607e938ea75ea7cae957728e6592a7d2bdb4b329f06e0939a57c && test "$actor_pid" = 125204 && test -z "$extra" || abort actor_changed_or_unknown
  parents_safe /proc/125204/status || {
    test ! -L /proc && test -d /proc && test "$(stat -c '%u %g' /proc)" = '0 0' || abort proc_visibility_unknown
  }
  test ! -e /proc/125204 && test ! -L /proc/125204 || abort prior_actor_pid_present_or_unknown
  printf '%s\n' 'KNOWN_PRIOR_EXIT1_ACTOR_RECORD_UNCHANGED_PID_PATH_ABSENT_HANDOFF_STILL_REQUIRED'
}
require_client_identity() {
  status=0; load=$(systemctl show pi-ink-bridge-sidebar-0020.service -p LoadState --value) || status=$?
  test "$status" -eq 0 && test "$load" = loaded || abort owned_client_not_loaded_as_expected
  test "$(systemctl show pi-ink-bridge-sidebar-0020.service -p Transient --value)" = yes || abort owned_client_not_transient
  test "$(systemctl show pi-ink-bridge-sidebar-0020.service -p MainPID --value)" = 106748 || abort owned_client_pid_changed
  command=$(systemctl show pi-ink-bridge-sidebar-0020.service -p ExecStart --value)
  case "$command" in
    '{ path=/home/root/pi-ink-bridge-0020/pi-ink-tablet ; argv[]=/home/root/pi-ink-bridge-0020/pi-ink-tablet -config /home/root/pi-ink-bridge-0020/config.json ; '*) tail=${command#'{ path=/home/root/pi-ink-bridge-0020/pi-ink-tablet ; argv[]=/home/root/pi-ink-bridge-0020/pi-ink-tablet -config /home/root/pi-ink-bridge-0020/config.json ; '}; case "$tail" in *'path='*|*'argv[]='*) abort owned_client_extra_command ;; esac ;;
    *) abort owned_client_command_changed ;;
  esac
  unset command tail
  assert_exact 0cdb83b531a1c7b9e3509504551dbd6e52e0908a29d13b6975208ac7cd5efbfd /home/root/pi-ink-bridge-0020/pi-ink-tablet 10485760
  assert_exact a861d40e488cdfe39f13366b4903052bb775910a8b7238dd1a6d1187cd585eca /home/root/pi-ink-bridge-0020/config.json 65536
  parents_safe /proc/106748/exe || abort owned_client_proc_parent_unknown
  test "$(readlink /proc/106748/exe)" = /home/root/pi-ink-bridge-0020/pi-ink-tablet || abort owned_client_executable_link_changed
  test "$(stat -Lc '%s' /proc/106748/exe)" -le 10485760 || abort owned_client_running_binary_cap
  running_sum=$(sha256sum /proc/106748/exe); running_sum=${running_sum%% *}
  test "$running_sum" = 0cdb83b531a1c7b9e3509504551dbd6e52e0908a29d13b6975208ac7cd5efbfd || abort owned_client_running_binary_hash_changed
  other_status=0; other_load=$(systemctl show pi-ink-bridge-0020.service -p LoadState --value) || other_status=$?
  case "$other_load:$other_status" in not-found:0|not-found:4) ;; *) abort other_owned_unit_changed ;; esac
  printf '%s\n' 'OWNED_CLIENT_FILE_AND_RUNNING_BINARY_EXACT_IDENTITY_MATCH'
}
client_is_inactive() {
  client_status=0; client_load=$(systemctl show pi-ink-bridge-sidebar-0020.service -p LoadState --value) || client_status=$?
  case "$client_load:$client_status" in
    not-found:0|not-found:4) return 0 ;;
    loaded:0) test "$(systemctl show pi-ink-bridge-sidebar-0020.service -p ActiveState --value)" = inactive && test "$(systemctl show pi-ink-bridge-sidebar-0020.service -p MainPID --value)" = 0 ;;
    *) return 1 ;;
  esac
}
require_original_proxy_backup() {
  assert_exact 24bcfe6c0b0b44c35401f214b0ccc451cdb60d2fd0e8c718beac92be25f6dd0f /home/root/pi-ink-webserver-remote-backup-0020/webserver-remote.so 9000000
  test "$(stat -c '%a %u %g %s %Y' /home/root/pi-ink-webserver-remote-backup-0020/webserver-remote.so)" = '644 0 0 8453696 1793049401' || abort original_proxy_metadata_changed
  parents_safe /home/root/xovi/extensions.d/webserver-remote.so || abort original_proxy_active_parent_unknown
  test ! -e /home/root/xovi/extensions.d/webserver-remote.so && test ! -L /home/root/xovi/extensions.d/webserver-remote.so || abort original_proxy_active_position_collision
}
main
