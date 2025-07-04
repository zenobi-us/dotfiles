#!/bin/bash
#
#
DOTFILE_ROOT=$(
    cd "$(dirname "$0")/shells/files/zsh/.zsh/" || exit
    pwd
)

#!/bin/bash
if [ ! -f "${DOTFILE_ROOT}/lib/osinformation.sh" ]; then
    echo "Required OSINFORMATION lib not found"
    exit 1
fi

. "${DOTFILE_ROOT}/lib/osinformation.sh"

get_release_url() {
    local version
    local machine_processor
    local machine_os
    local platform

    version="$1"
    machine_processor=$(get_machine_processor)
    machine_os=$(get_machine_os)
    platform="$machine_processor-$machine_os"

    case "$platform" in
        x86_64-linux)
            echo "https://github.com/comtrya/comtrya/releases/download/v$version/comtrya-x86_64-unknown-linux-gnu"
            ;;
        *)
            echo "Unsupported: $platform"
            exit 1
            ;;
    esac
}

download_comtrya () {
    local version
    local url

    version="$1"

    if [ -z "$version" ]; then
        echo "Please provide a version"
        exit 1
    fi

    url=$(get_release_url "$version")


    if [ -z "$url" ]; then
        exit 1
    fi

    echo "Downloading Comtrya $version: $url"

    curl -L -o comtrya "$url"
    chmod +x comtrya

    echo "Installing Comtrya"

    sudo mv comtrya /usr/local/bin/comtrya
}

download_comtrya "$1"