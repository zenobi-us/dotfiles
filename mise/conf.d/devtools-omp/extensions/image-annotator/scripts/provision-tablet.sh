#!/bin/sh
# Fetches the extension's public bundle before making an explicit SSH install.
set -eu

main() {
    server_url=http://127.0.0.1:47840
    coordinator_url=
    ssh_target=root@10.11.99.1
    dry_run=false
    while [ "$#" -gt 0 ]; do
        case "$1" in
            --server-url|--coordinator-url|--ssh-target)
                [ "$#" -ge 2 ] || fail "Option requires a value: $1"
                case "$1" in
                    --server-url) server_url=$2 ;;
                    --coordinator-url) coordinator_url=$2 ;;
                    --ssh-target) ssh_target=$2 ;;
                esac
                shift 2
                ;;
            --dry-run) dry_run=true; shift ;;
            --help)
                printf '%s\n' 'Usage: provision-tablet.sh --coordinator-url URL [--server-url URL] [--ssh-target USER@HOST] [--dry-run]'
                return
                ;;
            *) fail 'Unknown option; use --help.' ;;
        esac
    done
    validate_url "$coordinator_url" 'Coordinator URL'
    validate_url "$server_url" 'Server URL'
    validate_ssh_target
    for command in curl sha256sum tar sort mktemp sed; do
        command -v "$command" >/dev/null 2>&1 || fail "Required local command is missing: $command"
    done

    umask 077
    work_dir=$(mktemp -d "${TMPDIR:-/tmp}/image-annotator.XXXXXX")
    trap 'rm -rf -- "$work_dir"' 0
    trap 'exit 1' HUP INT TERM
    fetch /tablet/bundle.tar.gz "$work_dir/bundle.tar.gz"
    fetch /tablet/bundle.sha256 "$work_dir/bundle.sha256"
    check_bundle
    if [ "$dry_run" = true ]; then
        printf '%s\n' 'Dry run: bundle checksum and three regular files verified; no SSH connection made.'
        return
    fi
    command -v ssh >/dev/null 2>&1 || fail 'Required local command is missing: ssh'
    quoted_url=$(quote_remote "$coordinator_url")
    remote_command="set -eu
umask 077
stage=\$(mktemp -d /tmp/pi-ink-client.XXXXXX)
trap 'rm -rf -- \"\$stage\"' 0
trap 'exit 1' HUP INT TERM
cd -- \"\$stage\"
tar -xzf -
sh ./install.sh --coordinator-url $quoted_url"
    ssh -o BatchMode=yes -o ConnectTimeout=10 -o StrictHostKeyChecking=yes \
        "$ssh_target" "$remote_command" < "$work_dir/bundle.tar.gz" \
        || fail 'SSH install failed; inspect the remote error before retrying. Existing installs are never replaced.'
}

fail() {
    printf 'provision-tablet.sh: %s\n' "$*" >&2
    exit 1
}

validate_url() {
    # Check transfer argument shape here. The bundled client owns the full coordinator URL rules.
    case "$1" in
        *[![:print:]]*|*[[:space:]]*) fail "$2 must be a single HTTP/HTTPS URL without whitespace." ;;
        http://?*|https://?*) ;;
        *) fail "$2 requires an HTTP/HTTPS URL; --coordinator-url must be tablet-reachable." ;;
    esac
}

validate_ssh_target() {
    case "$ssh_target" in
        ''|-*|*[!a-zA-Z0-9._@-]*) fail 'SSH target must be a plain USER@HOST or HOST; options and URI forms are not allowed.' ;;
    esac
    case "$ssh_target" in
        *@*)
            user=${ssh_target%%@*}
            host=${ssh_target#*@}
            case "$user" in ''|-*) fail 'SSH user must be nonempty and must not start with a hyphen.' ;; esac
            case "$host" in ''|-*|*@*) fail 'SSH host must be nonempty, must not start with a hyphen, and must not contain @.' ;; esac
            ;;
    esac
}

fetch() {
    curl --fail --silent --show-error --location --proto '=http,https' \
        --proto-redir '=http,https' --connect-timeout 10 --max-time 120 \
        --output "$2" "${server_url%/}$1" \
        || fail 'Cannot fetch the bundle from the local coordinator; check --server-url.'
}

check_bundle() {
    checksum=
    filename=
    extra=
    IFS=' ' read -r checksum filename extra < "$work_dir/bundle.sha256" \
        || fail 'Bundle checksum must be a sha256sum line.'
    [ "${#checksum}" -eq 64 ] || fail 'Bundle checksum must contain 64 hexadecimal digits.'
    case "$checksum" in *[!a-fA-F0-9]*) fail 'Bundle checksum contains non-hexadecimal characters.' ;; esac
    [ "$filename" = bundle.tar.gz ] && [ -z "$extra" ] \
        || fail 'Bundle checksum must name only bundle.tar.gz.'
    printf '%s  bundle.tar.gz\n' "$checksum" > "$work_dir/verified.sha256"
    (cd -- "$work_dir" && sha256sum --check --status verified.sha256) \
        || fail 'Bundle SHA-256 does not match; no files were transferred.'
    tar -tzf "$work_dir/bundle.tar.gz" > "$work_dir/entries" \
        || fail 'Cannot read bundle archive.'
    expected=$(printf '%s\n' VERSION install.sh pi-ink-client)
    [ "$(sort "$work_dir/entries")" = "$expected" ] \
        || fail 'Bundle must contain exactly VERSION, install.sh, and pi-ink-client at its root.'
    tar -tvzf "$work_dir/bundle.tar.gz" > "$work_dir/types" \
        || fail 'Cannot inspect bundle file types.'
    count=0
    while IFS= read -r entry; do
        case "$entry" in
            -*) count=$((count + 1)) ;;
            *) fail 'Bundle entries must be regular files; links and directories are not allowed.' ;;
        esac
    done < "$work_dir/types"
    [ "$count" -eq 3 ] || fail 'Bundle must contain exactly three regular files.'
}

quote_remote() {
    escaped=$(printf '%s' "$1" | sed "s/'/'\\\\''/g")
    printf "'%s'" "$escaped"
}

LC_ALL=C
export LC_ALL
main "$@"
