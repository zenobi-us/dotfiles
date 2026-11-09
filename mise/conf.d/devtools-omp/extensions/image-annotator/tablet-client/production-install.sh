#!/bin/sh
# Runs only after the desktop command verifies this script's digest.
set -eu
fail() { printf 'Pi Annotations: %s\n' "$*" >&2; exit 1; }
[ "$#" -eq 2 ] || fail 'Use the generated trusted desktop command, including its ZIP and server digests.'
for digest in "$@"; do
    [ "${#digest}" -eq 64 ] || fail 'Invalid expected SHA-256 digest.'
    case "$digest" in *[!0-9a-f]*) fail 'Invalid expected SHA-256 digest.' ;; esac
done
for tool in id uname tr sha256sum unzip mktemp rm chmod; do
    command -v "$tool" >/dev/null 2>&1 || fail "Missing dependency: $tool. No installation changes were made."
done
[ "$(id -u)" = 0 ] || fail 'Installation requires the owner-approved root SSH account.'
[ "$(uname -m)" = aarch64 ] || fail 'Only ARM64 Paper Pro is supported.'
[ -r /sys/firmware/devicetree/base/model ] || fail 'Cannot read tablet model.'
model=$(tr -d '\000\n' < /sys/firmware/devicetree/base/model)
case "$model" in 'reMarkable Ferrari'|'reMarkable Paper Pro') ;; *) fail 'Unsupported model. Only Paper Pro is supported.' ;; esac
[ -r /etc/os-release ] || fail 'Cannot read firmware version.'
. /etc/os-release
[ "${IMG_VERSION:-}" = 3.28.0.172 ] || fail 'Unsupported firmware. Only 3.28.0.172 has prior device evidence. Do not upgrade or downgrade automatically.'
printf '%s  /usr/bin/xochitl\n' b1816408cf90b19e448c70082625c4d6a36060368706eb7a9b35425428a9a021 | sha256sum -c - || fail 'Stock Xochitl does not match the recorded firmware build.'
[ -d /home/root ] && [ ! -L /home/root ] && [ -w /home/root ] || fail 'The home partition must be writable and not a symlink.'
[ -f /home/root/xovi/xovi.so ] || fail 'Missing XOVI native library: xovi.so must be a regular file. Install and verify XOVI separately.'
[ -d /home/root/xovi/exthome/appload ] && [ -w /home/root/xovi/exthome/appload ] || fail 'Install and verify AppLoad first; its application directory must be writable.'
[ -f /home/root/xovi/extensions.d/appload.so ] || fail 'Missing AppLoad extension: appload.so. Install and verify it separately.'
[ -f /home/root/xovi/extensions.d/qt-resource-rebuilder.so ] || fail 'Missing qt-resource-rebuilder native library: qt-resource-rebuilder.so must be a regular file. Install and verify qt-resource-rebuilder separately.'
[ -d /home/root/xovi/exthome/qt-resource-rebuilder ] && [ -w /home/root/xovi/exthome/qt-resource-rebuilder ] || fail 'Install and verify qt-resource-rebuilder first.'
printf '%s  client.zip\n' "$1" | sha256sum -c - || fail 'Client ZIP was altered. Nothing was extracted.'
printf '%s  server.json\n' "$2" | sha256sum -c - || fail 'Server trust record was altered.'
umask 077
stage=$(mktemp -d /tmp/pi-annotations.XXXXXX)
trap 'rm -rf "$stage"' EXIT HUP INT TERM
# The archive is hash-pinned by the trusted desktop. It is never extracted into live directories.
unzip -q client.zip -d "$stage"
[ -f "$stage/pi-ink-client" ] && [ ! -L "$stage/pi-ink-client" ] || fail 'Verified archive has no regular client executable.'
chmod 700 "$stage/pi-ink-client"
"$stage/pi-ink-client" install-client --archive-sha256 "$1" --source "$stage" --server "$PWD/server.json"
printf '%s\n' 'Installation is staged. No process was restarted.' 'Save and close all documents. Obtain separate owner approval before restarting Xochitl or rebooting.' 'After the approved restart, select Pi Annotations in the sidebar and observe its connection screen.'
