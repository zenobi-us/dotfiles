set -eu
fail() { printf 'STOP=frame_%s\n' "$1" >&2; exit 41; }
probe=$(printf '%b' '\0160\0151\0055\0151\0156\0153\0055\0146\0162\0141\0155\0145') || fail printf
[ "$probe" = 'pi-ink-frame' ] || fail printf
script=''
for expected in 61440 61440 61440 16620; do
 IFS= read -r encoded || fail prefix
 [ "${#encoded}" = "$expected" ] || fail length
 piece=$(printf '%b' "$encoded" || exit 41; printf '.') || fail decode
 script="$script${piece%.}"
done
checksum=$(printf '%s' "$script" | sha256sum)
[ "${checksum%% *}" = '4f65412401b95f2ae09aeea3c58cf9faa814fcb9ebe457c1044527e090d468ae' ] || fail script_hash
exec sh -c "$script"
