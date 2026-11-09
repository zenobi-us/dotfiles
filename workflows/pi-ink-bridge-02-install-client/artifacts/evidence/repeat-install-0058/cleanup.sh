set -eu
fail() { printf "STOP=%s\n" "$*" >&2; exit 41; }
stage=/home/root/.local/share/pi-ink-bridge/.upgrade-0055.eQVGWv
[ -d "$stage" ] && [ ! -L "$stage" ] && [ "$(stat -c '%F|%u|%g|%a' "$stage")" = 'directory|0|0|700' ] || fail owned_stage
count=0
for entry in "$stage"/* "$stage"/.[!.]* "$stage"/..?*; do
 [ -e "$entry" ] || [ -L "$entry" ] || continue
 case "${entry##*/}" in install.sh|client.zip|server.json) ;; *) fail unexpected_stage_entry;; esac
 count=$((count+1))
done
[ "$count" = 3 ] || fail stage_count
[ -f "$stage/install.sh" ] && [ ! -L "$stage/install.sh" ] && [ "$(stat -c '%u|%g|%a' "$stage/install.sh")" = '0|0|600' ] || fail download_metadata
printf '%s  %s\n' 765593a9a36fdbf097d67bb3a41d613038150268636616447b9244b87c17578f "$stage/install.sh" | sha256sum -c -
[ -f "$stage/client.zip" ] && [ ! -L "$stage/client.zip" ] && [ "$(stat -c '%u|%g|%a' "$stage/client.zip")" = '0|0|600' ] || fail download_metadata
printf '%s  %s\n' ba36897369a1c89f3299ca87e5b8a4fd9db919116580315095133ac2ffa3cb33 "$stage/client.zip" | sha256sum -c -
[ -f "$stage/server.json" ] && [ ! -L "$stage/server.json" ] && [ "$(stat -c '%u|%g|%a' "$stage/server.json")" = '0|0|600' ] || fail download_metadata
printf '%s  %s\n' bcd72b4841d47400e61b8fde5116863dac43f8c4e28730155b4f8304c0a8c86e "$stage/server.json" | sha256sum -c -
rm -- "$stage/install.sh" "$stage/client.zip" "$stage/server.json"
rmdir -- "$stage"
[ ! -e "$stage" ] && [ ! -L "$stage" ] || fail stage_remains
printf 'OWNED_STAGE_REMOVED=1\nPUBLIC_FILES_REMOVED=3\n'
