# Separate read-only postrecovery entry inventory. No cleanup mutation.
set -eu
set -f
proxy_choice=keep-quarantined
main() {
  inventory_count=0; hash_bytes=0; candidates=''; xochitl_pid=0
  entry_failures=0; entry_total=0
  inspect_effective_service
  inspect_maps
  inspect_client_unit sidebar pi-ink-bridge-sidebar-0020.service
  inspect_client_unit client pi-ink-bridge-0020.service
  inspect_listeners
  inspect_actor
  if trusted_root /home/root/pi-ink-bridge-0020; then
    inspect_artifact /home/root/pi-ink-bridge-0020/adapter.so
    inspect_artifact /home/root/pi-ink-bridge-0020/config.json
    inspect_artifact /home/root/pi-ink-bridge-0020/config.json.0020-next
    inspect_artifact /home/root/pi-ink-bridge-0020/owner.txt
    inspect_artifact /home/root/pi-ink-bridge-0020/payload-sha256.txt
    inspect_artifact /home/root/pi-ink-bridge-0020/payload-sha256.txt.0020-next
    inspect_artifact /home/root/pi-ink-bridge-0020/payload-sha256.txt.0020-repair-next
    inspect_artifact /home/root/pi-ink-bridge-0020/payload-sha256.txt.0023-ui-next
    inspect_artifact /home/root/pi-ink-bridge-0020/pi-ink-bridge.qmd
    inspect_artifact /home/root/pi-ink-bridge-0020/pi-ink-bridge.qmd.0020-next
    inspect_artifact /home/root/pi-ink-bridge-0020/pi-ink-bridge.qmd.0023-ui-next
    inspect_artifact /home/root/pi-ink-bridge-0020/pi-ink-tablet
    inspect_artifact /home/root/pi-ink-bridge-0020/pi-ink-tablet.0020-next
    inspect_artifact /home/root/pi-ink-bridge-0020/state.json
    inspect_artifact /home/root/pi-ink-bridge-0020/tablet-qml
    inspect_artifact /home/root/pi-ink-bridge-0020/tablet-qml/PiInkToolbar.qml
    inspect_artifact /home/root/pi-ink-bridge-0020/tablet-qml/PiInkToolbar.qml.0020-next
    inspect_artifact /home/root/pi-ink-bridge-0020/tablet-qml/PiInkToolbar.qml.0020-repair-next
    inspect_artifact /home/root/pi-ink-bridge-0020/tablet-qml/PiInkToolbar.qml.0023-ui-next
    inspect_artifact /home/root/pi-ink-bridge-0020/trust
    inspect_artifact /home/root/pi-ink-bridge-0020/trust/server-a.pem
    inspect_artifact /home/root/pi-ink-bridge-0020/trust/server-b.pem
  fi
  if trusted_root /home/root/pi-ink-bridge-retained-0020; then
    inspect_artifact /home/root/pi-ink-bridge-retained-0020/adapter.so
    inspect_artifact /home/root/pi-ink-bridge-retained-0020/config.json
    inspect_artifact /home/root/pi-ink-bridge-retained-0020/config.json.0020-next
    inspect_artifact /home/root/pi-ink-bridge-retained-0020/owner.txt
    inspect_artifact /home/root/pi-ink-bridge-retained-0020/payload-sha256.txt
    inspect_artifact /home/root/pi-ink-bridge-retained-0020/payload-sha256.txt.0020-next
    inspect_artifact /home/root/pi-ink-bridge-retained-0020/payload-sha256.txt.0020-repair-next
    inspect_artifact /home/root/pi-ink-bridge-retained-0020/payload-sha256.txt.0023-ui-next
    inspect_artifact /home/root/pi-ink-bridge-retained-0020/pi-ink-bridge.qmd
    inspect_artifact /home/root/pi-ink-bridge-retained-0020/pi-ink-bridge.qmd.0020-next
    inspect_artifact /home/root/pi-ink-bridge-retained-0020/pi-ink-bridge.qmd.0023-ui-next
    inspect_artifact /home/root/pi-ink-bridge-retained-0020/pi-ink-tablet
    inspect_artifact /home/root/pi-ink-bridge-retained-0020/pi-ink-tablet.0020-next
    inspect_artifact /home/root/pi-ink-bridge-retained-0020/state.json
    inspect_artifact /home/root/pi-ink-bridge-retained-0020/tablet-qml
    inspect_artifact /home/root/pi-ink-bridge-retained-0020/tablet-qml/PiInkToolbar.qml
    inspect_artifact /home/root/pi-ink-bridge-retained-0020/tablet-qml/PiInkToolbar.qml.0020-next
    inspect_artifact /home/root/pi-ink-bridge-retained-0020/tablet-qml/PiInkToolbar.qml.0020-repair-next
    inspect_artifact /home/root/pi-ink-bridge-retained-0020/tablet-qml/PiInkToolbar.qml.0023-ui-next
    inspect_artifact /home/root/pi-ink-bridge-retained-0020/trust
    inspect_artifact /home/root/pi-ink-bridge-retained-0020/trust/server-a.pem
    inspect_artifact /home/root/pi-ink-bridge-retained-0020/trust/server-b.pem
  fi
  if trusted_root /home/root/pi-ink-webserver-remote-backup-0020; then
    inspect_artifact /home/root/pi-ink-webserver-remote-backup-0020/owner.txt
    inspect_artifact /home/root/pi-ink-webserver-remote-backup-0020/webserver-remote.so
  fi
  if trusted_root /home/root/pi-ink-rollback-owned-0020; then
    inspect_artifact /home/root/pi-ink-rollback-owned-0020/adapter.so
    inspect_artifact /home/root/pi-ink-rollback-owned-0020/interrupted-patch.0020-next
    inspect_artifact /home/root/pi-ink-rollback-owned-0020/interrupted-patch.0023-ui-next
    inspect_artifact /home/root/pi-ink-rollback-owned-0020/owner.txt
    inspect_artifact /home/root/pi-ink-rollback-owned-0020/pi-ink-bridge.qmd
  fi
  if trusted_root /home/root/pi-ink-sidebar-stage-0020; then
    inspect_artifact /home/root/pi-ink-sidebar-stage-0020/adapter.so
    inspect_artifact /home/root/pi-ink-sidebar-stage-0020/config.json
    inspect_artifact /home/root/pi-ink-sidebar-stage-0020/owner.txt
    inspect_artifact /home/root/pi-ink-sidebar-stage-0020/payload-sha256.txt
    inspect_artifact /home/root/pi-ink-sidebar-stage-0020/pi-ink-bridge.qmd
    inspect_artifact /home/root/pi-ink-sidebar-stage-0020/pi-ink-tablet
    inspect_artifact /home/root/pi-ink-sidebar-stage-0020/tablet-qml
    inspect_artifact /home/root/pi-ink-sidebar-stage-0020/tablet-qml/PiInkToolbar.qml
    inspect_artifact /home/root/pi-ink-sidebar-stage-0020/trust
    inspect_artifact /home/root/pi-ink-sidebar-stage-0020/trust/server-a.pem
    inspect_artifact /home/root/pi-ink-sidebar-stage-0020/trust/server-b.pem
  fi
  if trusted_root /home/root/pi-ink-sidebar-backup-0020; then
    inspect_artifact /home/root/pi-ink-sidebar-backup-0020/config.json
    inspect_artifact /home/root/pi-ink-sidebar-backup-0020/live-pi-ink-bridge.qmd
    inspect_artifact /home/root/pi-ink-sidebar-backup-0020/owner.txt
    inspect_artifact /home/root/pi-ink-sidebar-backup-0020/payload-sha256.txt
    inspect_artifact /home/root/pi-ink-sidebar-backup-0020/pi-ink-bridge.qmd
    inspect_artifact /home/root/pi-ink-sidebar-backup-0020/pi-ink-tablet
    inspect_artifact /home/root/pi-ink-sidebar-backup-0020/tablet-qml
    inspect_artifact /home/root/pi-ink-sidebar-backup-0020/tablet-qml/PiInkToolbar.qml
  fi
  if trusted_root /home/root/pi-ink-native-button-stage-0020; then
    inspect_artifact /home/root/pi-ink-native-button-stage-0020/PiInkToolbar.qml
    inspect_artifact /home/root/pi-ink-native-button-stage-0020/owner.txt
    inspect_artifact /home/root/pi-ink-native-button-stage-0020/payload-sha256.txt
  fi
  if trusted_root /home/root/pi-ink-native-button-backup-0020; then
    inspect_artifact /home/root/pi-ink-native-button-backup-0020/PiInkToolbar.qml
    inspect_artifact /home/root/pi-ink-native-button-backup-0020/owner.txt
    inspect_artifact /home/root/pi-ink-native-button-backup-0020/payload-sha256.txt
  fi
  if trusted_root /home/root/pi-ink-ui-stage-0023; then
    inspect_artifact /home/root/pi-ink-ui-stage-0023/PiInkToolbar.qml
    inspect_artifact /home/root/pi-ink-ui-stage-0023/owner.txt
    inspect_artifact /home/root/pi-ink-ui-stage-0023/payload-sha256.txt
    inspect_artifact /home/root/pi-ink-ui-stage-0023/pi-ink-bridge.qmd
  fi
  if trusted_root /home/root/pi-ink-ui-backup-0023; then
    inspect_artifact /home/root/pi-ink-ui-backup-0023/PiInkToolbar.qml
    inspect_artifact /home/root/pi-ink-ui-backup-0023/live-pi-ink-bridge.qmd
    inspect_artifact /home/root/pi-ink-ui-backup-0023/owner.txt
    inspect_artifact /home/root/pi-ink-ui-backup-0023/payload-sha256.txt
    inspect_artifact /home/root/pi-ink-ui-backup-0023/pi-ink-bridge.qmd
  fi
  if trusted_root /home/root/pi-ink-operation-history-0020; then
    inspect_artifact /home/root/pi-ink-operation-history-0020/owner.txt
  fi
  inspect_artifact /home/root/xovi/extensions.d/webserver-remote.so
  inspect_artifact /home/root/xovi/extensions.d/pi-ink-loopback-0020.so
  inspect_artifact /home/root/xovi/exthome/qt-resource-rebuilder/pi-ink-bridge-0020.qmd
  inspect_artifact /home/root/xovi/exthome/qt-resource-rebuilder/pi-ink-bridge-0020.qmd.0020-next
  inspect_artifact /home/root/xovi/exthome/qt-resource-rebuilder/pi-ink-bridge-0020.qmd.0023-ui-next
  if trusted_root /home/root/pi-ink-bridge-0020; then
    scan_directory_entries /home/root/pi-ink-bridge-0020
    if test -e /home/root/pi-ink-bridge-0020/tablet-qml || test -L /home/root/pi-ink-bridge-0020/tablet-qml; then scan_directory_entries /home/root/pi-ink-bridge-0020/tablet-qml; fi
    if test -e /home/root/pi-ink-bridge-0020/trust || test -L /home/root/pi-ink-bridge-0020/trust; then scan_directory_entries /home/root/pi-ink-bridge-0020/trust; fi
  fi
  if trusted_root /home/root/pi-ink-bridge-retained-0020; then
    scan_directory_entries /home/root/pi-ink-bridge-retained-0020
    if test -e /home/root/pi-ink-bridge-retained-0020/tablet-qml || test -L /home/root/pi-ink-bridge-retained-0020/tablet-qml; then scan_directory_entries /home/root/pi-ink-bridge-retained-0020/tablet-qml; fi
    if test -e /home/root/pi-ink-bridge-retained-0020/trust || test -L /home/root/pi-ink-bridge-retained-0020/trust; then scan_directory_entries /home/root/pi-ink-bridge-retained-0020/trust; fi
  fi
  if trusted_root /home/root/pi-ink-webserver-remote-backup-0020; then
    scan_directory_entries /home/root/pi-ink-webserver-remote-backup-0020
  fi
  if trusted_root /home/root/pi-ink-rollback-owned-0020; then
    scan_directory_entries /home/root/pi-ink-rollback-owned-0020
  fi
  if trusted_root /home/root/pi-ink-sidebar-stage-0020; then
    scan_directory_entries /home/root/pi-ink-sidebar-stage-0020
    if test -e /home/root/pi-ink-sidebar-stage-0020/tablet-qml || test -L /home/root/pi-ink-sidebar-stage-0020/tablet-qml; then scan_directory_entries /home/root/pi-ink-sidebar-stage-0020/tablet-qml; fi
    if test -e /home/root/pi-ink-sidebar-stage-0020/trust || test -L /home/root/pi-ink-sidebar-stage-0020/trust; then scan_directory_entries /home/root/pi-ink-sidebar-stage-0020/trust; fi
  fi
  if trusted_root /home/root/pi-ink-sidebar-backup-0020; then
    scan_directory_entries /home/root/pi-ink-sidebar-backup-0020
    if test -e /home/root/pi-ink-sidebar-backup-0020/tablet-qml || test -L /home/root/pi-ink-sidebar-backup-0020/tablet-qml; then scan_directory_entries /home/root/pi-ink-sidebar-backup-0020/tablet-qml; fi
  fi
  if trusted_root /home/root/pi-ink-native-button-stage-0020; then
    scan_directory_entries /home/root/pi-ink-native-button-stage-0020
  fi
  if trusted_root /home/root/pi-ink-native-button-backup-0020; then
    scan_directory_entries /home/root/pi-ink-native-button-backup-0020
  fi
  if trusted_root /home/root/pi-ink-ui-stage-0023; then
    scan_directory_entries /home/root/pi-ink-ui-stage-0023
  fi
  if trusted_root /home/root/pi-ink-ui-backup-0023; then
    scan_directory_entries /home/root/pi-ink-ui-backup-0023
  fi
  verify_go_binary /home/root/pi-ink-bridge-0020/pi-ink-tablet
  verify_go_binary /home/root/pi-ink-sidebar-stage-0020/pi-ink-tablet
  verify_go_binary /home/root/pi-ink-sidebar-backup-0020/pi-ink-tablet
  require_current_config
  client_is_inactive || abort owned_client_not_inactive_after_recovery
  require_terminal_actor
  printf 'ENTRY_ALLOWLIST_FAILURES=%s ENTRY_ROWS=%s\n' "$entry_failures" "$entry_total"
  test "$entry_failures" -eq 0 || abort unknown_or_unsafe_entry_preserve_no_cleanup
  test "${maps_complete-unknown}" = yes && test "${map_adapter-unknown}" = no || abort postinventory_owned_adapter_mapped
  case "$proxy_choice" in
    return-original) assert_exact 24bcfe6c0b0b44c35401f214b0ccc451cdb60d2fd0e8c718beac92be25f6dd0f /home/root/xovi/extensions.d/webserver-remote.so 9000000 ;;
    keep-quarantined) require_original_proxy_backup; test "${map_proxy-unknown}" = no || abort postinventory_quarantined_proxy_mapped ;;
  esac
  printf '%s\n' 'POSTRECOVERY_ENTRY_INVENTORY_COMPLETE_FINAL_EXACT_DELETION_APPROVAL_REQUIRED'
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
# Read-only runtime facts. Unknown values and unrelated kernel rows never leave this script.
inspect_client_unit() {
  label=$1; unit=$2
  printf 'OWNED_CLIENT_UNIT %s\n' "$unit"
  status=0; load=$(systemctl show "$unit" -p LoadState --value) || status=$?
  case "$load:$status" in loaded:0|not-found:0|not-found:4) printf 'LoadState=%s\n' "$load" ;; *) printf '%s\n' 'UNIT_LOAD_UNKNOWN_REDACTED'; return 0 ;; esac
  test "$load" = loaded || return 0
  active=$(systemctl show "$unit" -p ActiveState --value)
  case "$active" in active|inactive|failed|activating|deactivating) printf 'ActiveState=%s\n' "$active" ;; *) printf '%s\n' 'ActiveState=UNKNOWN_REDACTED' ;; esac
  transient=$(systemctl show "$unit" -p Transient --value)
  case "$transient" in yes|no) printf 'Transient=%s\n' "$transient" ;; *) printf '%s\n' 'Transient=UNKNOWN_REDACTED' ;; esac
  client_pid=$(systemctl show "$unit" -p MainPID --value)
  if ! numeric_pid "$client_pid"; then printf '%s\n' 'MainPID=NONE_OR_UNKNOWN'; return 0; fi
  printf 'MainPID=%s\n' "$client_pid"
  command=$(systemctl show "$unit" -p ExecStart --value)
  command_matches=no
  case "$command" in
    '{ path=/home/root/pi-ink-bridge-0020/pi-ink-tablet ; argv[]=/home/root/pi-ink-bridge-0020/pi-ink-tablet -config /home/root/pi-ink-bridge-0020/config.json ; '*)
      tail=${command#'{ path=/home/root/pi-ink-bridge-0020/pi-ink-tablet ; argv[]=/home/root/pi-ink-bridge-0020/pi-ink-tablet -config /home/root/pi-ink-bridge-0020/config.json ; '}
      case "$tail" in *'path='*|*'argv[]='*) ;; *) command_matches=yes ;; esac ;;
  esac
  unset command tail 2>/dev/null || true
  printf 'KNOWN_SINGLE_EXECSTART_MATCH=%s\n' "$command_matches"
  if test "$command_matches" != yes || test "$transient" != yes; then printf '%s\n' 'UNIT_OWNERSHIP_UNCONFIRMED_NO_PROCESS_READ'; return 0; fi
  if ! parents_safe "/proc/$client_pid/exe"; then printf '%s\n' 'CLIENT_PROCESS_PARENT_UNAVAILABLE'; return 0; fi
  exe=$(readlink "/proc/$client_pid/exe" 2>/dev/null || true)
  case "$exe" in /home/root/pi-ink-bridge-0020/pi-ink-tablet|/home/root/pi-ink-bridge-retained-0020/pi-ink-tablet) candidates="$candidates $label:$client_pid"; printf '%s\n' 'KNOWN_CLIENT_EXE_LINK_MATCH=yes' ;; *) printf '%s\n' 'KNOWN_CLIENT_EXE_LINK_MATCH=no_REDACTED' ;; esac
  after=$(systemctl show "$unit" -p MainPID --value)
  if test "$after" = "$client_pid"; then printf '%s\n' 'CLIENT_PID_STABLE=yes'; else printf '%s\n' 'CLIENT_PID_STABLE=no_NO_RETRY'; fi
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
inspect_artifact() {
  if ! inspect_metadata "$1"; then return 0; fi
  case "$1" in
    */config.json|*/config.json.*|*/state.json|*/trust|*/trust/*) printf '%s\n' 'SENSITIVE_OR_OPAQUE_METADATA_ONLY_NO_HASH'; return 0 ;;
  esac
  if test -d "$1"; then printf '%s\n' 'DIRECTORY_METADATA_ONLY_NO_LISTING'; return 0; fi
  if test ! -f "$1" || test "$(stat -c '%u %g' "$1")" != '0 0'; then printf '%s\n' 'UNKNOWN_TYPE_OR_OWNER_PRESERVE_NO_READ'; return 0; fi
  case "$1" in
    */owner.txt) known='a9eecd4c06a5fa0ec38a0935ad97fd29654f7b8b828493b2ca96ffe1116cbf8d' ;;
    */pi-ink-tablet|*/pi-ink-tablet.*) known='f601436dd591ae782f15c0714bcfd4412fb3facebeadeb7d31914a5dc69ecada 0cdb83b531a1c7b9e3509504551dbd6e52e0908a29d13b6975208ac7cd5efbfd' ;;
    */PiInkToolbar.qml|*/PiInkToolbar.qml.*) known='57416f0b80a3a100c6dc7ee2162647b2c866588a85cf46ef09106bbf1354595f e008dec2b9df0bc7115fbc1dc5535defeeff1ad72d62b8dc718a67e06cd780bf 8e976fa96d01babb6a9c5ea405544ce3b1fd63eef7de72e53e8fe5ac4aa929d9 c09f7f617760b4dc839787d228a2ab2bf12ba26f1f52a6ec910124072b8db869' ;;
    */pi-ink-bridge.qmd|*/pi-ink-bridge.qmd.*|*/live-pi-ink-bridge.qmd|*/interrupted-patch.*|*/pi-ink-bridge-0020.qmd|*/pi-ink-bridge-0020.qmd.*) known='c631208b621272227551a557dfee2e28142c79cb8a47987ac3460dab9304efc8 09aff9e7671d2931ffc54e16f943e922d2b66712fa40fb5e940acb1480e5b4e9 0dc1dad15002559d943f63fb73298aca68c570a9f46cefe38bb42c5798e8edc0' ;;
    */payload-sha256.txt|*/payload-sha256.txt.*) known='27645009e37fec8270d7d2e7541d4b1ae2a4da4378736d0b6a0277c39a354278 d5b0222e8806b5a3bc1874fb49a07290eedfb54892573257f6a08d607df9a8fa 261f3409cc7315a86710b72308de30396eee651870d0c145dd800c786c1d8a72 9ce7ecaa8bd9607e938ea75ea7cae957728e6592a7d2bdb4b329f06e0939a57c' ;;
    */adapter.so|*/pi-ink-loopback-0020.so) known='aeba9fc3d8aa816bda0db8c08d4cc5929a677a83f5e8e14b02a39bc70aef5c4f' ;;
    */webserver-remote.so) known='24bcfe6c0b0b44c35401f214b0ccc451cdb60d2fd0e8c718beac92be25f6dd0f' ;;
    *) printf '%s\n' 'UNKNOWN_FIXED_FILE_PRESERVE_NO_READ'; return 0 ;;
  esac
  size=$(stat -c '%s' "$1")
  hash_bytes=$((hash_bytes + size))
  if test "$size" -gt 10485760 || test "$hash_bytes" -gt 67108864; then printf '%s\n' 'HASH_BOUND_REACHED_PRESERVE_NO_READ'; return 0; fi
  digest=$(sha256sum "$1"); digest=${digest%% *}
  case "$digest" in ''|*[!0-9a-f]*) printf '%s\n' 'HASH_UNKNOWN_PRESERVE'; return 0 ;; esac
  if test "${#digest}" -ne 64; then printf '%s\n' 'HASH_UNKNOWN_PRESERVE'; return 0; fi
  printf 'PUBLIC_ARTIFACT_SHA256=%s\n' "$digest"
  case " $known " in *" $digest "*) printf '%s\n' 'KNOWN_PUBLIC_BYTES=MATCH_NO_REMOVAL_AUTHORITY' ;; *) printf '%s\n' 'KNOWN_PUBLIC_BYTES=MISMATCH_PRESERVE' ;; esac
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

# One-level reads only at explicitly owned directories. Unknown entries block cleanup.
scan_directory_entries() {
  directory=$1
  if ! parents_safe "$directory/entry-check" || test -L "$directory" || test ! -d "$directory"; then printf 'ENTRY_DIRECTORY_UNSAFE %s\n' "$directory"; entry_failures=$((entry_failures + 1)); return 0; fi
  if test "$(stat -c '%u %g %a' "$directory")" != '0 0 700'; then printf 'ENTRY_DIRECTORY_OWNER_MODE_UNKNOWN %s\n' "$directory"; entry_failures=$((entry_failures + 1)); return 0; fi
  listing=$({ if find "$directory" -mindepth 1 -maxdepth 1 -print; then printf '%s\n' '__PI_INK_SCAN_OK_0026__'; else printf '%s\n' '__PI_INK_SCAN_ERROR_0026__'; fi; } | dd bs=1 count=65537 2>/dev/null)
  if test "${#listing}" -ge 65536; then printf 'ENTRY_BYTE_CAP_REACHED %s\n' "$directory"; entry_failures=$((entry_failures + 1)); return 0; fi
  rows=0; scan_end=no
  while IFS= read -r entry; do
    case "$entry" in '__PI_INK_SCAN_OK_0026__') scan_end=yes; continue ;; '__PI_INK_SCAN_ERROR_0026__') entry_failures=$((entry_failures + 1)); continue ;; esac
    rows=$((rows + 1)); entry_total=$((entry_total + 1))
    if test "$rows" -gt 128 || test "$entry_total" -gt 512; then printf '%s\n' 'ENTRY_COUNT_CAP_REACHED'; entry_failures=$((entry_failures + 1)); break; fi
    case "$entry" in "$directory"/*) name=${entry#"$directory"/} ;; *) name='' ;; esac
    case "$name" in ''|*[!A-Za-z0-9_.-]*) printf '%s\n' 'UNKNOWN_ENTRY_NAME_REDACTED_PRESERVE'; entry_failures=$((entry_failures + 1)); continue ;; esac
    if ! entry_allowed "$directory" "$name"; then
      name_digest=$(printf '%s' "$name" | sha256sum); name_digest=${name_digest%% *}
      printf 'UNKNOWN_ENTRY_REDACTED_NAME_SHA256=%s PRESERVE\n' "$name_digest"
      entry_failures=$((entry_failures + 1)); continue
    fi
    printf 'ALLOWLISTED_ENTRY %s/%s\n' "$directory" "$name"
    if test -L "$entry"; then printf '%s\n' 'ENTRY_SYMLINK_PRESERVE_NO_DEREFERENCE'; entry_failures=$((entry_failures + 1)); continue; fi
    if test ! -e "$entry"; then printf '%s\n' 'ENTRY_CHANGED_OR_INACCESSIBLE_PRESERVE'; entry_failures=$((entry_failures + 1)); continue; fi
    stat -c 'TYPE=%F MODE=%a UID=%u GID=%g SIZE=%s MTIME=%Y' "$entry"
    if test "$(stat -c '%u %g' "$entry")" != '0 0'; then printf '%s\n' 'ENTRY_OWNER_UNKNOWN_PRESERVE'; entry_failures=$((entry_failures + 1)); fi
    case "$name" in
      .tablet-state-*)
        if test ! -f "$entry" || test "$(stat -c '%u %g %a' "$entry")" != '0 0 600'; then
          printf '%s\n' 'OPAQUE_STATE_TYPE_OWNER_MODE_UNKNOWN_PRESERVE'; entry_failures=$((entry_failures + 1))
        else printf '%s\n' 'OPAQUE_INTERRUPTED_STATE_PRESERVE_NO_CONTENT_OR_HASH'; fi ;;
    esac
  done <<ENTRIES
$listing
ENTRIES
  if test "$scan_end" != yes; then printf 'ENTRY_SCAN_INCOMPLETE %s\n' "$directory"; entry_failures=$((entry_failures + 1)); fi
}
verify_go_binary() {
  binary=$1
  if ! parents_safe "$binary" || test -L "$binary" || test ! -f "$binary"; then printf 'GO_BINARY_MISSING_OR_UNSAFE_PRESERVE %s\n' "$binary"; entry_failures=$((entry_failures + 1)); return 0; fi
  if test "$(stat -c '%u %g' "$binary")" != '0 0' || test "$(stat -c '%s' "$binary")" -gt 10485760; then printf 'GO_BINARY_OWNER_OR_10MIB_CAP_UNKNOWN_PRESERVE %s\n' "$binary"; entry_failures=$((entry_failures + 1)); return 0; fi
  binary_digest=$(sha256sum "$binary"); binary_digest=${binary_digest%% *}
  case "$binary_digest" in f601436dd591ae782f15c0714bcfd4412fb3facebeadeb7d31914a5dc69ecada|0cdb83b531a1c7b9e3509504551dbd6e52e0908a29d13b6975208ac7cd5efbfd) printf 'GO_BINARY_EXACT_KNOWN_SHA256=%s PATH=%s\n' "$binary_digest" "$binary" ;; *) printf 'GO_BINARY_UNKNOWN_SHA256=%s PRESERVE\n' "$binary_digest"; entry_failures=$((entry_failures + 1)) ;; esac
}

entry_allowed() {
  case "$1:$2" in
    '/home/root/pi-ink-bridge-0020:adapter.so'|'/home/root/pi-ink-bridge-0020:config.json'|'/home/root/pi-ink-bridge-0020:config.json.0020-next'|'/home/root/pi-ink-bridge-0020:owner.txt'|'/home/root/pi-ink-bridge-0020:payload-sha256.txt'|'/home/root/pi-ink-bridge-0020:payload-sha256.txt.0020-next'|'/home/root/pi-ink-bridge-0020:payload-sha256.txt.0020-repair-next'|'/home/root/pi-ink-bridge-0020:payload-sha256.txt.0023-ui-next'|'/home/root/pi-ink-bridge-0020:pi-ink-bridge.qmd'|'/home/root/pi-ink-bridge-0020:pi-ink-bridge.qmd.0020-next'|'/home/root/pi-ink-bridge-0020:pi-ink-bridge.qmd.0023-ui-next'|'/home/root/pi-ink-bridge-0020:pi-ink-tablet'|'/home/root/pi-ink-bridge-0020:pi-ink-tablet.0020-next'|'/home/root/pi-ink-bridge-0020:state.json'|'/home/root/pi-ink-bridge-0020:tablet-qml'|'/home/root/pi-ink-bridge-0020:trust') return 0 ;;
    '/home/root/pi-ink-bridge-0020/tablet-qml:PiInkToolbar.qml'|'/home/root/pi-ink-bridge-0020/tablet-qml:PiInkToolbar.qml.0020-next'|'/home/root/pi-ink-bridge-0020/tablet-qml:PiInkToolbar.qml.0020-repair-next'|'/home/root/pi-ink-bridge-0020/tablet-qml:PiInkToolbar.qml.0023-ui-next') return 0 ;;
    '/home/root/pi-ink-bridge-0020/trust:server-a.pem'|'/home/root/pi-ink-bridge-0020/trust:server-b.pem') return 0 ;;
    '/home/root/pi-ink-bridge-retained-0020:adapter.so'|'/home/root/pi-ink-bridge-retained-0020:config.json'|'/home/root/pi-ink-bridge-retained-0020:config.json.0020-next'|'/home/root/pi-ink-bridge-retained-0020:owner.txt'|'/home/root/pi-ink-bridge-retained-0020:payload-sha256.txt'|'/home/root/pi-ink-bridge-retained-0020:payload-sha256.txt.0020-next'|'/home/root/pi-ink-bridge-retained-0020:payload-sha256.txt.0020-repair-next'|'/home/root/pi-ink-bridge-retained-0020:payload-sha256.txt.0023-ui-next'|'/home/root/pi-ink-bridge-retained-0020:pi-ink-bridge.qmd'|'/home/root/pi-ink-bridge-retained-0020:pi-ink-bridge.qmd.0020-next'|'/home/root/pi-ink-bridge-retained-0020:pi-ink-bridge.qmd.0023-ui-next'|'/home/root/pi-ink-bridge-retained-0020:pi-ink-tablet'|'/home/root/pi-ink-bridge-retained-0020:pi-ink-tablet.0020-next'|'/home/root/pi-ink-bridge-retained-0020:state.json'|'/home/root/pi-ink-bridge-retained-0020:tablet-qml'|'/home/root/pi-ink-bridge-retained-0020:trust') return 0 ;;
    '/home/root/pi-ink-bridge-retained-0020/tablet-qml:PiInkToolbar.qml'|'/home/root/pi-ink-bridge-retained-0020/tablet-qml:PiInkToolbar.qml.0020-next'|'/home/root/pi-ink-bridge-retained-0020/tablet-qml:PiInkToolbar.qml.0020-repair-next'|'/home/root/pi-ink-bridge-retained-0020/tablet-qml:PiInkToolbar.qml.0023-ui-next') return 0 ;;
    '/home/root/pi-ink-bridge-retained-0020/trust:server-a.pem'|'/home/root/pi-ink-bridge-retained-0020/trust:server-b.pem') return 0 ;;
    '/home/root/pi-ink-native-button-backup-0020:PiInkToolbar.qml'|'/home/root/pi-ink-native-button-backup-0020:owner.txt'|'/home/root/pi-ink-native-button-backup-0020:payload-sha256.txt') return 0 ;;
    '/home/root/pi-ink-native-button-stage-0020:PiInkToolbar.qml'|'/home/root/pi-ink-native-button-stage-0020:owner.txt'|'/home/root/pi-ink-native-button-stage-0020:payload-sha256.txt') return 0 ;;
    '/home/root/pi-ink-rollback-owned-0020:adapter.so'|'/home/root/pi-ink-rollback-owned-0020:interrupted-patch.0020-next'|'/home/root/pi-ink-rollback-owned-0020:interrupted-patch.0023-ui-next'|'/home/root/pi-ink-rollback-owned-0020:owner.txt'|'/home/root/pi-ink-rollback-owned-0020:pi-ink-bridge.qmd') return 0 ;;
    '/home/root/pi-ink-sidebar-backup-0020:config.json'|'/home/root/pi-ink-sidebar-backup-0020:live-pi-ink-bridge.qmd'|'/home/root/pi-ink-sidebar-backup-0020:owner.txt'|'/home/root/pi-ink-sidebar-backup-0020:payload-sha256.txt'|'/home/root/pi-ink-sidebar-backup-0020:pi-ink-bridge.qmd'|'/home/root/pi-ink-sidebar-backup-0020:pi-ink-tablet'|'/home/root/pi-ink-sidebar-backup-0020:tablet-qml') return 0 ;;
    '/home/root/pi-ink-sidebar-backup-0020/tablet-qml:PiInkToolbar.qml') return 0 ;;
    '/home/root/pi-ink-sidebar-stage-0020:adapter.so'|'/home/root/pi-ink-sidebar-stage-0020:config.json'|'/home/root/pi-ink-sidebar-stage-0020:owner.txt'|'/home/root/pi-ink-sidebar-stage-0020:payload-sha256.txt'|'/home/root/pi-ink-sidebar-stage-0020:pi-ink-bridge.qmd'|'/home/root/pi-ink-sidebar-stage-0020:pi-ink-tablet'|'/home/root/pi-ink-sidebar-stage-0020:tablet-qml'|'/home/root/pi-ink-sidebar-stage-0020:trust') return 0 ;;
    '/home/root/pi-ink-sidebar-stage-0020/tablet-qml:PiInkToolbar.qml') return 0 ;;
    '/home/root/pi-ink-sidebar-stage-0020/trust:server-a.pem'|'/home/root/pi-ink-sidebar-stage-0020/trust:server-b.pem') return 0 ;;
    '/home/root/pi-ink-ui-backup-0023:PiInkToolbar.qml'|'/home/root/pi-ink-ui-backup-0023:live-pi-ink-bridge.qmd'|'/home/root/pi-ink-ui-backup-0023:owner.txt'|'/home/root/pi-ink-ui-backup-0023:payload-sha256.txt'|'/home/root/pi-ink-ui-backup-0023:pi-ink-bridge.qmd') return 0 ;;
    '/home/root/pi-ink-ui-stage-0023:PiInkToolbar.qml'|'/home/root/pi-ink-ui-stage-0023:owner.txt'|'/home/root/pi-ink-ui-stage-0023:payload-sha256.txt'|'/home/root/pi-ink-ui-stage-0023:pi-ink-bridge.qmd') return 0 ;;
    '/home/root/pi-ink-webserver-remote-backup-0020:owner.txt'|'/home/root/pi-ink-webserver-remote-backup-0020:webserver-remote.so') return 0 ;;
  esac
  case "$1:$2" in
    /home/root/pi-ink-bridge-0020:.tablet-state-*|/home/root/pi-ink-bridge-retained-0020:.tablet-state-*)
      suffix=${2#.tablet-state-}; case "$suffix" in ''|*[!0-9]*) return 1 ;; esac; test "${#suffix}" -le 20; return $? ;;
  esac
  return 1
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
