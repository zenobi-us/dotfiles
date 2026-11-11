set -eu
fail() { printf 'STOP=%s\n' "$1" >&2; exit 41; }
[ "$(id -u)" = 0 ] || fail account
[ "$(cat /proc/sys/kernel/random/boot_id)" = '8e816d98-6bf4-4f9e-9abe-891fbf83d06f' ] || fail boot_changed
base='/home/root/.local/share/pi-ink-bridge'
dir='/home/root/.local/share/pi-ink-bridge/.preflight-reader-0011'
helper='/home/root/.local/share/pi-ink-bridge/.preflight-reader-0011/metadata-reader'
for path in / /home /home/root /home/root/.local /home/root/.local/share "$base"; do
 [ -d "$path" ] && [ ! -L "$path" ] || fail parent_type
 [ "$(stat -c %u "$path")" = 0 ] || fail parent_owner
done
[ "$(stat -c '%d:%i:%u:%g:%a' "$base")" = '65026:1150:0:0:700' ] || fail base_identity_changed
for proc in /proc/[0-9]*; do
 exe=$(readlink "$proc/exe" 2>/dev/null || true)
 case "$exe" in *pi-ink-client*|*pi-annotations*) fail client_active;; esac
done
[ ! -e "$dir" ] && [ ! -L "$dir" ] || fail helper_directory_occupied
umask 077
mkdir -m 700 "$dir"
dir_identity=$(stat -c '%d:%i:%u:%g:%a' "$dir")
set -C
cat > "$helper"
[ -f "$helper" ] && [ ! -L "$helper" ] || fail helper_type
[ "$(stat -c '%u:%g:%a:%s' "$helper")" = '0:0:600:2162872' ] || fail helper_metadata
printf '%s\n' '0fe207302d7feb59fe6ff9a6beb407950d9fce9386522b533ad0868514d9e7ed  /home/root/.local/share/pi-ink-bridge/.preflight-reader-0011/metadata-reader' | sha256sum -c -
chmod 700 "$helper"
helper_identity=$(stat -c '%d:%i:%u:%g:%a:%s' "$helper")
printf 'READER_DIRECTORY_IDENTITY=%s\nREADER_FILE_IDENTITY=%s\n' "$dir_identity" "$helper_identity"
"$helper"
[ -d "$dir" ] && [ ! -L "$dir" ] || fail cleanup_directory_type
[ "$(stat -c '%d:%i:%u:%g:%a' "$dir")" = "$dir_identity" ] || fail cleanup_directory_identity
[ -f "$helper" ] && [ ! -L "$helper" ] || fail cleanup_helper_type
[ "$(stat -c '%d:%i:%u:%g:%a:%s' "$helper")" = "$helper_identity" ] || fail cleanup_helper_identity
printf '%s\n' '0fe207302d7feb59fe6ff9a6beb407950d9fce9386522b533ad0868514d9e7ed  /home/root/.local/share/pi-ink-bridge/.preflight-reader-0011/metadata-reader' | sha256sum -c -
rm -- "$helper"
rmdir -- "$dir"
printf 'OWNED_READER_REMOVED\n'
