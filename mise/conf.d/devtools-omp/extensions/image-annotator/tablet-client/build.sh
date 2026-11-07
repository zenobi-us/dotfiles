#!/bin/sh
# Package the standalone tablet client and extension-owned installer, without deploying them.
set -eu

version=0.3.1
source_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
stage=$(mktemp -d "${TMPDIR:-/tmp}/pi-ink-client.XXXXXX")
trap 'rm -rf -- "$stage"' 0
trap 'exit 1' HUP INT TERM

cd "$source_dir"
CGO_ENABLED=0 GOOS=linux GOARCH=arm64 go build \
    -trimpath -ldflags "-s -w -X main.version=$version" \
    -o "$stage/pi-ink-client" .
cp install.sh "$stage/install.sh"
chmod 755 "$stage/pi-ink-client" "$stage/install.sh"
printf '%s\n' "$version" > "$stage/VERSION"
chmod 644 "$stage/VERSION"

(
    cd "$stage"
    tar -czf bundle.tar.gz pi-ink-client install.sh VERSION
    sha256sum bundle.tar.gz > bundle.sha256
)
mkdir -p dist
mv "$stage/bundle.tar.gz" dist/bundle.tar.gz
mv "$stage/bundle.sha256" dist/bundle.sha256
printf '%s\n' "$source_dir/dist/bundle.tar.gz" "$source_dir/dist/bundle.sha256"
