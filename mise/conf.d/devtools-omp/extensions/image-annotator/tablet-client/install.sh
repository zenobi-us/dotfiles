#!/bin/sh
# Installs the coordinator client into a new private directory, without services.
set -eu

main() {
    prefix=/home/root/pi-ink-client
    while [ "$#" -gt 0 ]; do
        case "$1" in
            --prefix)
                [ "$#" -ge 2 ] || fail "Option requires a value: $1"
                prefix=$2
                shift 2
                ;;
            --help)
                printf '%s\n' 'Usage: install.sh [--prefix /new/destination]'
                return
                ;;
            *) fail 'Unknown option; use --help.' ;;
        esac
    done
    case "$prefix" in
        /*) ;;
        *) fail 'Install prefix must be an absolute path.' ;;
    esac
    [ ! -e "$prefix" ] && [ ! -L "$prefix" ] || fail 'Install prefix already exists; choose a new destination.'

    source_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
    for name in pi-ink-client VERSION; do
        [ -f "$source_dir/$name" ] && [ ! -L "$source_dir/$name" ] || fail "Bundle requires a regular file: $name"
    done
    umask 077
    mkdir -m 700 -- "$prefix" || fail 'Cannot create install prefix; no existing path will be replaced.'
    cp -- "$source_dir/pi-ink-client" "$prefix/pi-ink-client"
    cp -- "$source_dir/VERSION" "$prefix/VERSION"
    chmod 700 "$prefix/pi-ink-client"
    chmod 600 "$prefix/VERSION"
    printf 'Installed client in %s; no service was started.\n' "$prefix"
}

fail() {
    printf 'install.sh: %s\n' "$*" >&2
    exit 1
}


LC_ALL=C
export LC_ALL
main "$@"
