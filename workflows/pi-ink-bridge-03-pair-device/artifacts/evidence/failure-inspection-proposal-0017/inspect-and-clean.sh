set -eu
fail() { printf 'STOP=%s\n' "$1" >&2; exit 41; }
printf 'KERNEL_RELEASE=%s\n' "$(uname -r)"
(
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
)
base='/home/root/.local/share/pi-ink-bridge'
dir='/home/root/.local/share/pi-ink-bridge/.preflight-stop-0015'
helper='/home/root/.local/share/pi-ink-bridge/.preflight-stop-0015/stop'
for path in / /home /home/root /home/root/.local /home/root/.local/share "$base"; do
 [ -d "$path" ] && [ ! -L "$path" ] || fail cleanup_parent_type
 [ "$(stat -c %u "$path")" = 0 ] || fail cleanup_parent_owner
done
[ "$(stat -c '%d:%i:%u:%g:%a' "$base")" = '65026:1150:0:0:700' ] || fail cleanup_base_identity
[ -d "$dir" ] && [ ! -L "$dir" ] || fail cleanup_directory_type
[ "$(stat -c '%d:%i:%u:%g:%a' "$dir")" = '65026:1476:0:0:700' ] || fail cleanup_directory_identity
[ -f "$helper" ] && [ ! -L "$helper" ] || fail cleanup_helper_type
[ "$(stat -c '%d:%i:%u:%g:%a:%s' "$helper")" = '65026:1482:0:0:700:2162872' ] || fail cleanup_helper_identity
seen=0
for entry in "$dir"/* "$dir"/.[!.]* "$dir"/..?*; do
 if [ ! -e "$entry" ] && [ ! -L "$entry" ]; then continue; fi
 [ "$entry" = "$helper" ] || fail cleanup_foreign_directory_entry
 seen=$((seen + 1))
done
[ "$seen" = 1 ] || fail cleanup_directory_contents
for proc in /proc/[0-9]*; do
 exe=$(readlink "$proc/exe" 2>/dev/null || true)
 case "$exe" in "$helper"|"$helper (deleted)") fail cleanup_helper_active;; esac
done
printf '%s\n' '7d73d400086aef839109386ec581228df1eb40682aac435d12e60ffe346f3a22  /home/root/.local/share/pi-ink-bridge/.preflight-stop-0015/stop' | sha256sum -c -
rm -- "$helper"
rmdir -- "$dir"
printf 'OWNED_FAILED_STOP_HELPER_REMOVED\n'
