set -efu
fail() { printf 'STOP=%s\n' "$1" >&2; exit 41; }
[ "$(id -u)" = 0 ] || fail account
[ "$(cat /proc/sys/kernel/random/boot_id)" = '8e816d98-6bf4-4f9e-9abe-891fbf83d06f' ] || fail boot_changed
proc=/proc/41472
if [ ! -d "$proc" ]; then
 printf 'PROCESS_ABSENT=41472\n'
 exit 0
fi
start_ticks() {
 IFS= read -r stats < "$proc/stat" || fail process_stat
 fields=${stats##*) }
 set -- $fields
 [ "$#" -ge 20 ] || fail process_stat_shape
 shift 19
 case "$1" in ''|*[!0-9]*) fail process_start_shape;; esac
 printf '%s' "$1"
}
start=$(start_ticks)
proc_identity=$(stat -c '%d:%i:%u:%g' "$proc")
exe=$(readlink "$proc/exe")
[ -f "$proc/exe" ] || fail executable_type
exe_identity=$(stat -Lc '%d:%i:%u:%g:%a:%s' "$proc/exe")
size=$(stat -Lc '%s' "$proc/exe")
case "$size" in ''|*[!0-9]*) fail executable_size;; esac
[ "$size" -le 33554432 ] || fail executable_too_large
printf 'PID=41472\nSTART_TICKS=%s\nPROC_IDENTITY=%s\nEXE=%s\nEXE_IDENTITY=%s\n' "$start" "$proc_identity" "$exe" "$exe_identity"
while IFS= read -r line; do
 case "$line" in Name:*|State:*|PPid:*|Uid:*|Gid:*) printf 'STATUS|%s\n' "$line";; esac
done < "$proc/status"
sha256sum "$proc/exe"
[ "$(start_ticks)" = "$start" ] || fail process_reused_or_changed
[ "$(stat -c '%d:%i:%u:%g' "$proc")" = "$proc_identity" ] || fail process_identity_changed
[ "$(readlink "$proc/exe")" = "$exe" ] || fail executable_changed
[ "$(stat -Lc '%d:%i:%u:%g:%a:%s' "$proc/exe")" = "$exe_identity" ] || fail executable_identity_changed
printf 'READ_ONLY_PROCESS_INSPECTION_COMPLETE\n'
