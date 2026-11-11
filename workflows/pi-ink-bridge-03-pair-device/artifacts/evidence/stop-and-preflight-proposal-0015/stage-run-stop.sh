set -eu
fail() { printf 'STOP=%s\n' "$1" >&2; exit 41; }
[ "$(id -u)" = 0 ] || fail account
[ "$(cat /proc/sys/kernel/random/boot_id)" = '8e816d98-6bf4-4f9e-9abe-891fbf83d06f' ] || fail boot_changed
base='/home/root/.local/share/pi-ink-bridge'
dir='/home/root/.local/share/pi-ink-bridge/.preflight-stop-0015'
helper='/home/root/.local/share/pi-ink-bridge/.preflight-stop-0015/stop'
for path in / /home /home/root /home/root/.local /home/root/.local/share "$base"; do
 [ -d "$path" ] && [ ! -L "$path" ] || fail parent_type
 [ "$(stat -c %u "$path")" = 0 ] || fail parent_owner
done
[ "$(stat -c '%d:%i:%u:%g:%a' "$base")" = '65026:1150:0:0:700' ] || fail base_identity_changed
[ ! -e "$dir" ] && [ ! -L "$dir" ] || fail helper_directory_occupied
umask 077
mkdir -m 700 "$dir"
dir_identity=$(stat -c '%d:%i:%u:%g:%a' "$dir")
set -C
cat > "$helper"
[ -f "$helper" ] && [ ! -L "$helper" ] || fail helper_type
[ "$(stat -c '%u:%g:%a:%s' "$helper")" = '0:0:600:2162872' ] || fail helper_metadata
printf '%s\n' '7d73d400086aef839109386ec581228df1eb40682aac435d12e60ffe346f3a22  /home/root/.local/share/pi-ink-bridge/.preflight-stop-0015/stop' | sha256sum -c -
chmod 700 "$helper"
helper_identity=$(stat -c '%d:%i:%u:%g:%a:%s' "$helper")
printf 'STOP_HELPER_DIRECTORY_IDENTITY=%s\nSTOP_HELPER_FILE_IDENTITY=%s\n' "$dir_identity" "$helper_identity"
"$helper"
[ -d "$dir" ] && [ ! -L "$dir" ] || fail cleanup_directory_type
[ "$(stat -c '%d:%i:%u:%g:%a' "$dir")" = "$dir_identity" ] || fail cleanup_directory_identity
[ -f "$helper" ] && [ ! -L "$helper" ] || fail cleanup_helper_type
[ "$(stat -c '%d:%i:%u:%g:%a:%s' "$helper")" = "$helper_identity" ] || fail cleanup_helper_identity
printf '%s\n' '7d73d400086aef839109386ec581228df1eb40682aac435d12e60ffe346f3a22  /home/root/.local/share/pi-ink-bridge/.preflight-stop-0015/stop' | sha256sum -c -
rm -- "$helper"
rmdir -- "$dir"
printf 'OWNED_STOP_HELPER_REMOVED\n'
