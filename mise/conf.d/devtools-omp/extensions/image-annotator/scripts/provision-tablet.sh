#!/bin/sh
# Prints trusted instructions. It never connects to a tablet.
set -eu
extension_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
case "${1:-}" in
    --help)
        printf '%s\n' 'Usage: provision-tablet.sh [--dry-run]' 'Default: start the per-user host service and print a verified SSH command. No device connection occurs.' 'Dry run: verify local production package inputs without starting a service.'
        exit 0 ;;
    --dry-run)
        [ "$#" -eq 1 ] || exit 2
        for file in tablet-client/dist/client.zip tablet-client/production-install.sh; do
            [ -f "$extension_dir/$file" ] && [ ! -L "$extension_dir/$file" ] || { printf 'Missing regular package input: %s\n' "$file" >&2; exit 1; }
            sha256sum "$extension_dir/$file"
        done
        exit 0 ;;
    '') [ "$#" -eq 0 ] || exit 2 ;;
    *) printf '%s\n' 'Unknown option. Use --help.' >&2; exit 2 ;;
esac
cd "$extension_dir"
MISE_AUTO_INSTALL=0 exec mise exec bun@1.4.3 pitchfork@2.30.1 -- bun installation-client.ts
