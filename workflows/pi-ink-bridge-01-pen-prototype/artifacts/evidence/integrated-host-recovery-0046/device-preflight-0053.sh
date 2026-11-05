#!/bin/sh
# Read only the approved compatibility and fixed-path metadata. Never repair.
set -eu
LC_ALL=C
export LC_ALL
fail() { printf 'PREFLIGHT_STOP\t%s\n' "$1" >&2; exit 20; }
check_components() {
    component=$1
    while [ "$component" != / ]; do
        [ ! -L "$component" ] || fail "symlink: $component"
        component=${component%/*}
        [ -n "$component" ] || component=/
    done
}
printf 'PREFLIGHT_BEGIN\t0053\n'
firmware=
while IFS='=' read -r key value; do
    case "$key" in
        VERSION_ID)
            os_version=${value#\"}
            os_version=${os_version%\"}
            printf 'OS_VERSION_ID\t%s\n' "$os_version"
            ;;
        IMG_VERSION)
            firmware=${value#\"}
            firmware=${firmware%\"}
            printf 'PRODUCT_IMG_VERSION\t%s\n' "$firmware"
            ;;
    esac
done < /etc/os-release
[ "$firmware" = 3.28.0.172 ] || fail 'unsupported or missing product IMG_VERSION; no further checks'
for path in /usr/bin/xochitl /home/root/xovi/exthome/qt-resource-rebuilder/hashtab /home/root/pi-ink-client/pi-ink-client /home/root/xovi/extensions.d/webserver-remote.so; do
    check_components "$path"
    if [ ! -e "$path" ]; then
        printf 'ABSENT\t%s\n' "$path"
        case "$path" in
            /usr/bin/xochitl|/home/root/xovi/exthome/qt-resource-rebuilder/hashtab|/home/root/pi-ink-client/pi-ink-client) fail "required file absent: $path" ;;
        esac
        continue
    fi
    [ -f "$path" ] || fail "not a regular file: $path"
    printf 'HASH_FILE_METADATA\t%s\t' "$path"
    stat -c '%F|%a|%u|%g|%s' "$path"
    digest_line=$(sha256sum "$path")
    digest=${digest_line%% *}
    printf 'SHA256\t%s\t%s\n' "$path" "$digest"
    case "$path" in
        /usr/bin/xochitl) [ "$digest" = b1816408cf90b19e448c70082625c4d6a36060368706eb7a9b35425428a9a021 ] || fail 'stock binary hash mismatch' ;;
        /home/root/xovi/exthome/qt-resource-rebuilder/hashtab) [ "$digest" = 9ff003d49c24b853aabe693ff13a4f30edf8b4966c6c3cb736d480999c143615 ] || fail 'hashtab hash mismatch' ;;
    esac
done
for path in /home/root/pi-ink-client /home/root/pi-ink-client/pi-ink-client /home/root/pi-ink-bridge-0049 /home/root/pi-ink-bridge-0049/runtime.json /home/root/pi-ink-bridge-0049/tablet-qml/PiInkToolbar.qml /home/root/xovi/exthome/qt-resource-rebuilder/pi-ink-bridge-0049.qmd /home/root/xovi/extensions.d/pi-ink-loopback.so /home/root/xovi/extensions.d/webserver-remote.so; do
    check_components "$path"
    if [ ! -e "$path" ]; then
        printf 'ABSENT\t%s\n' "$path"
        continue
    fi
    case "$path" in
        /home/root/pi-ink-client|/home/root/pi-ink-bridge-0049) [ -d "$path" ] || fail "not a directory: $path" ;;
        *) [ -f "$path" ] || fail "not a regular file: $path" ;;
    esac
    printf 'PATH_METADATA\t%s\t' "$path"
    stat -c '%F|%a|%u|%g|%s' "$path"
    case "$path" in
        /home/root/pi-ink-client|/home/root/pi-ink-client/pi-ink-client|/home/root/xovi/extensions.d/webserver-remote.so) ;;
        *) fail "occupied proposed-owned path: $path" ;;
    esac
done
printf 'PREFLIGHT_READ_ONLY_COMPLETE\n'
