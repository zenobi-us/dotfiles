#!/bin/sh

set -eu

fail() {
    printf 'mergr installer: %s\n' "$*" >&2
    exit 1
}

script_directory=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
repository_root=$(CDPATH= cd -- "$script_directory/.." && pwd)
manifest_path="$repository_root/herdr-plugin.toml"
install_path=${MERGR_INSTALL_PATH:-"$repository_root/target/release/mergr"}

if [ "${MERGR_BUILD_FROM_SOURCE:-0}" = "1" ]; then
    cargo_binary=${MERGR_CARGO_BIN:-cargo}
    command -v "$cargo_binary" >/dev/null 2>&1 ||
        fail "MERGR_BUILD_FROM_SOURCE=1 requires Rust 1.88 or newer and Cargo"
    cd "$repository_root"
    exec "$cargo_binary" build --release --locked
fi

command -v curl >/dev/null 2>&1 ||
    fail "curl is required to download the prebuilt binary"
command -v shasum >/dev/null 2>&1 ||
    fail "shasum is required to verify the prebuilt binary"

operating_system=${MERGR_INSTALLER_OS:-$(uname -s)}
architecture=${MERGR_INSTALLER_ARCH:-$(uname -m)}

case "$operating_system" in
    Darwin) ;;
    *)
        fail "prebuilt binaries are not available for operating system '$operating_system'"
        ;;
esac

case "$architecture" in
    arm64 | aarch64)
        asset_architecture=aarch64
        ;;
    x86_64 | amd64)
        asset_architecture=x86_64
        ;;
    *)
        fail "prebuilt binaries are not available for macOS architecture '$architecture'"
        ;;
esac

version=$(awk -F '"' '/^version = "/ { print $2; exit }' "$manifest_path")
[ -n "$version" ] ||
    fail "could not read the plugin version from $manifest_path"

tag="v$version"
asset_name="mergr-$tag-macos-$asset_architecture"
release_base_url=${MERGR_RELEASE_BASE_URL:-https://github.com/jsmenzies/mergr/releases/download}
asset_url="$release_base_url/$tag/$asset_name"
checksum_url="$asset_url.sha256"

temporary_directory=
staged_binary=
cleanup() {
    if [ -n "$staged_binary" ]; then
        rm -f -- "$staged_binary"
    fi
    if [ -n "$temporary_directory" ]; then
        rm -f -- \
            "$temporary_directory/$asset_name" \
            "$temporary_directory/$asset_name.sha256"
        rmdir "$temporary_directory" 2>/dev/null || true
    fi
}
trap cleanup EXIT
trap 'exit 1' HUP INT TERM

temporary_directory=$(mktemp -d "${TMPDIR:-/tmp}/mergr-install.XXXXXX")
downloaded_binary="$temporary_directory/$asset_name"
downloaded_checksum="$temporary_directory/$asset_name.sha256"

printf 'mergr installer: downloading %s\n' "$asset_name"
curl -fsSL --retry 3 --retry-delay 1 --output "$downloaded_binary" "$asset_url" ||
    fail "could not download $asset_url"
curl -fsSL --retry 3 --retry-delay 1 --output "$downloaded_checksum" "$checksum_url" ||
    fail "could not download $checksum_url"

(
    cd "$temporary_directory"
    shasum -a 256 -c "$asset_name.sha256"
) || fail "checksum verification failed for $asset_name"

install_directory=$(dirname -- "$install_path")
mkdir -p -- "$install_directory"
staged_binary="$install_directory/.mergr-install.$$"
cp -- "$downloaded_binary" "$staged_binary"
chmod 755 "$staged_binary"
mv -f -- "$staged_binary" "$install_path"
staged_binary=

printf 'mergr installer: installed verified binary at %s\n' "$install_path"
