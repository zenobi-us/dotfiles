#!/bin/sh
# Copies the verified local tablet bundle for an explicit initial SSH install.
set -eu

main() {
    ssh_target=root@10.11.99.1
    dry_run=false
    while [ "$#" -gt 0 ]; do
        case "$1" in
            --ssh-target)
                [ "$#" -ge 2 ] || fail "Option requires a value: $1"
                ssh_target=$2
                shift 2
                ;;
            --dry-run) dry_run=true; shift ;;
            --help)
                printf '%s\n' 'Usage: provision-tablet.sh [--ssh-target USER@HOST] [--dry-run]'
                return
                ;;
            *) fail 'Unknown option; use --help.' ;;
        esac
    done
    validate_ssh_target
    for command in sha256sum tar sort mktemp cp dirname; do
        command -v "$command" >/dev/null 2>&1 || fail "Required local command is missing: $command"
    done
    script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
    bundle_dir="$script_dir/../tablet-client/dist"
    for name in bundle.tar.gz bundle.sha256; do
        [ -f "$bundle_dir/$name" ] && [ ! -L "$bundle_dir/$name" ] \
            || fail 'Local tablet bundle is missing; run bun run build:tablet from the image-annotator directory.'
    done

    umask 077
    work_dir=$(mktemp -d "${TMPDIR:-/tmp}/image-annotator.XXXXXX")
    trap 'rm -rf -- "$work_dir"' 0
    trap 'exit 1' HUP INT TERM
    # Verify a private snapshot so a concurrent build cannot change the transferred bytes.
    cp -- "$bundle_dir/bundle.tar.gz" "$work_dir/bundle.tar.gz"
    cp -- "$bundle_dir/bundle.sha256" "$work_dir/bundle.sha256"
    check_bundle
    if [ "$dry_run" = true ]; then
        printf '%s\n' 'Dry run: bundle checksum and three regular files verified; no SSH connection made.'
        return
    fi
    command -v ssh >/dev/null 2>&1 || fail 'Required local command is missing: ssh'
    remote_command="set -eu
umask 077
stage=\$(mktemp -d /tmp/pi-ink-client.XXXXXX)
trap 'rm -rf -- \"\$stage\"' 0
trap 'exit 1' HUP INT TERM
cd -- \"\$stage\"
tar -xzf -
sh ./install.sh"
    ssh -o BatchMode=yes -o ConnectTimeout=10 -o StrictHostKeyChecking=yes \
        "$ssh_target" "$remote_command" < "$work_dir/bundle.tar.gz" \
        || fail 'SSH install failed; inspect the remote error before retrying. Existing installs are never replaced.'
}

fail() {
    printf 'provision-tablet.sh: %s\n' "$*" >&2
    exit 1
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


LC_ALL=C
export LC_ALL
main "$@"
