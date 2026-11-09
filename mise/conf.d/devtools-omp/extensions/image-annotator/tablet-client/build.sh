#!/bin/sh
# Package the standalone tablet client and extension-owned installer, without deploying them.
set -eu

version=0.4.0
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
mkdir -p "$stage/app/backend"
cp ../tablet-appload/manifest.json "$stage/app/manifest.json"
cp ../tablet-appload/entry "$stage/app/backend/entry"
cp ../tablet-appload/sidebar.qmd "$stage/sidebar.qmd"
pyside6-rcc --binary ../tablet-appload/application.qrc -o "$stage/app/resources.rcc"
for name in pi-ink-client VERSION sidebar.qmd app/manifest.json app/backend/entry app/resources.rcc; do
    touch -t 198001010000 "$stage/$name"
done
(
    cd "$stage"
    zip -q -X client.zip pi-ink-client VERSION sidebar.qmd app/manifest.json app/backend/entry app/resources.rcc
)

(
    cd "$stage"
    tar -czf bundle.tar.gz pi-ink-client install.sh VERSION
    sha256sum bundle.tar.gz > bundle.sha256
)
mkdir -p dist
mv "$stage/bundle.tar.gz" dist/bundle.tar.gz
mv "$stage/bundle.sha256" dist/bundle.sha256
mv "$stage/client.zip" dist/client.zip
printf '%s\n' "$source_dir/dist/bundle.tar.gz" "$source_dir/dist/bundle.sha256"
