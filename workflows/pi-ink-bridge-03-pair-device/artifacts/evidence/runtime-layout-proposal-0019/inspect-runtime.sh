set -eu
fail() { printf 'STOP=%s\n' "$1" >&2; exit 41; }
start_ticks() {
 IFS= read -r stats < "$proc/stat" || fail process_stat
 fields=${stats##*) }
 set -- $fields
 [ "$#" -ge 20 ] || fail process_stat_shape
 shift 19
 case "$1" in ''|*[!0-9]*) fail process_start_shape;; esac
 printf '%s' "$1"
}
inspect_process() {
 requested_pid=$1
 case "$requested_pid" in ''|*[!0-9]*) fail process_pid_shape;; esac
 proc=/proc/$requested_pid
 if [ ! -d "$proc" ]; then
  printf 'PROCESS_ABSENT=%s\n' "$requested_pid"
  return 0
 fi
 start=$(start_ticks)
 proc_identity=$(stat -c '%d:%i:%u:%g' "$proc")
 exe=$(readlink "$proc/exe")
 [ -f "$proc/exe" ] || fail executable_type
 exe_identity=$(stat -Lc '%d:%i:%u:%g:%a:%s' "$proc/exe")
 size=$(stat -Lc '%s' "$proc/exe")
 case "$size" in ''|*[!0-9]*) fail executable_size;; esac
 [ "$size" -le 33554432 ] || fail executable_too_large
 printf 'PID=%s\nSTART_TICKS=%s\nPROC_IDENTITY=%s\nEXE=%s\nEXE_IDENTITY=%s\n' "$requested_pid" "$start" "$proc_identity" "$exe" "$exe_identity"
 while IFS= read -r line; do
  case "$line" in Name:*|State:*|PPid:*|Uid:*|Gid:*) printf 'STATUS|%s\n' "$line";; esac
 done < "$proc/status"
 sha256sum "$proc/exe"
 [ "$(start_ticks)" = "$start" ] || fail process_reused_or_changed
 [ "$(stat -c '%d:%i:%u:%g' "$proc")" = "$proc_identity" ] || fail process_identity_changed
 [ "$(readlink "$proc/exe")" = "$exe" ] || fail executable_changed
 [ "$(stat -Lc '%d:%i:%u:%g:%a:%s' "$proc/exe")" = "$exe_identity" ] || fail executable_identity_changed
 printf 'PROCESS_SNAPSHOT_COMPLETE=%s\n' "$requested_pid"
}
# Execution guard: the function above is also smoke-checked on one owned host child.
[ "$(id -u)" = 0 ] || fail account
[ "$(cat /proc/sys/kernel/random/boot_id)" = '8e816d98-6bf4-4f9e-9abe-891fbf83d06f' ] || fail boot_changed
base='/home/root/.local/share/pi-ink-bridge'
for path in / /home /home/root /home/root/.local /home/root/.local/share "$base"; do
 [ -d "$path" ] && [ ! -L "$path" ] || fail parent_type
 [ "$(stat -c %u "$path")" = 0 ] || fail parent_owner
done
[ "$(stat -c '%d:%i:%u:%g:%a' "$base")" = '65026:1150:0:0:700' ] || fail base_identity_changed
printf 'OBSERVATION_ONLY_NO_QUIESCENCE_ATTESTATION\n'
systemctl show xochitl.service -p ActiveState -p SubState -p MainPID -p KillMode -p KillSignal -p SendSIGKILL -p TimeoutStopUSec -p ControlGroup -p FragmentPath -p ExecMainStartTimestampMonotonic
ui_pid=$(systemctl show xochitl.service -p MainPID --value)
case "$ui_pid" in ''|0|*[!0-9]*) fail ui_pid;; esac
[ "$(systemctl show xochitl.service -p ActiveState --value)" = active ] || fail ui_inactive
[ "$(systemctl show xochitl.service -p SubState --value)" = running ] || fail ui_not_running
printf 'UI_PID=%s\nUI_EXE=%s\n' "$ui_pid" "$(readlink "/proc/$ui_pid/exe")"
clients=''
count=0
for candidate in /proc/[0-9]*; do
 candidate_exe=$(readlink "$candidate/exe" 2>/dev/null || true)
 case "$candidate_exe" in
  *pi-ink-client*|*pi-annotations*)
   count=$((count + 1))
   [ "$count" -le 4 ] || fail too_many_matching_clients
   clients="$clients ${candidate##*/}"
   ;;
 esac
done
set -f
printf 'MATCHING_CLIENTS_AT_SNAPSHOT=%s\n' "$count"
for client in $clients; do inspect_process "$client"; done
for tool in sha256sum unzip stat readlink cmp ln mv df cp mkdir chmod rm rmdir sync systemctl; do
 command -v "$tool" >/dev/null || fail command_missing
 printf 'AVAILABLE_TOOL=%s\n' "$tool"
done
printf 'RENAME_INTERFACE_BEGIN\n'
mv --help
printf 'RENAME_INTERFACE_END\n'
df -Pk /home/root
for path in '/home/root/.local/share/pi-ink-bridge/releases/8468df658f658820bbf6f31e6b8c0d683a67109a5998a86467c959ca803d8962' '/home/root/.local/share/pi-ink-bridge/.upgrade-0010' '/home/root/.local/share/pi-ink-bridge/.backup-0010'; do
 [ ! -e "$path" ] && [ ! -L "$path" ] || fail proposed_path_occupied
 printf 'ABSENT|%s\n' "$path"
done
set +f
for entry in /home/root/xovi/exthome/qt-resource-rebuilder/*.qmd; do
 printf 'QMD_NAME|%s\n' "${entry##*/}"
done
printf 'READ_ONLY_RUNTIME_INSPECTION_COMPLETE\n'
