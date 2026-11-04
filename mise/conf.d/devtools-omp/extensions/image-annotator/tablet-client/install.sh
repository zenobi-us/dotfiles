#!/bin/sh
# Installs the coordinator client into a new private directory, without services.
set -eu

main() {
    prefix=/home/root/pi-ink-client
    coordinator_url=
    while [ "$#" -gt 0 ]; do
        case "$1" in
            --prefix|--coordinator-url)
                [ "$#" -ge 2 ] || fail "Option requires a value: $1"
                case "$1" in
                    --prefix) prefix=$2 ;;
                    --coordinator-url) coordinator_url=$2 ;;
                esac
                shift 2
                ;;
            --help)
                printf '%s\n' 'Usage: install.sh --coordinator-url URL [--prefix /new/destination]'
                return
                ;;
            *) fail 'Unknown option; use --help.' ;;
        esac
    done
    validate_url "$coordinator_url"
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
    printf '%s\n' "$coordinator_url" > "$prefix/coordinator-url"
    chmod 700 "$prefix/pi-ink-client"
    chmod 600 "$prefix/VERSION" "$prefix/coordinator-url"
    printf 'Installed client in %s; no service was started.\n' "$prefix"
}

fail() {
    printf 'install.sh: %s\n' "$*" >&2
    exit 1
}

validate_url() {
    case "$1" in
        *[![:print:]]*|*[[:space:]]*) fail 'Coordinator URL must be a single HTTP/HTTPS URL without whitespace.' ;;
        http://?*|https://?*) ;;
        *) fail 'Provide --coordinator-url with a tablet-reachable HTTP/HTTPS URL.' ;;
    esac
}

LC_ALL=C
export LC_ALL
main "$@"
