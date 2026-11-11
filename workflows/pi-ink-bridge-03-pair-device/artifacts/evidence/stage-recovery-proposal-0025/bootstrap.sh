set -eu
fail() { printf 'STOP=frame_%s\n' "$1" >&2; exit 41; }
command -v base64 >/dev/null || fail capability
IFS= read -r encoded || fail prefix
[ "${#encoded}" = 53584 ] || fail length
script=$(printf '%s' "$encoded" | base64 -d || exit 41; printf '.') || fail decode
script=${script%.}
checksum=$(printf '%s' "$script" | sha256sum)
[ "${checksum%% *}" = '4f65412401b95f2ae09aeea3c58cf9faa814fcb9ebe457c1044527e090d468ae' ] || fail script_hash
exec sh -c "$script"
