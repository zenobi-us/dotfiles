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

get_mise() {
  echo "==> 💁 Installing mise"

  curl https://mise.run | sh
}

get_latest_version() {
    curl -s https://api.github.com/repos/comtrya/comtrya/releases/latest | grep '"tag_name":' | sed -E 's/.*"v([^"]+)".*/\1/'
}

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

get_comtrya() {
    local version
    local url

    echo "==> 💁 Installing comtrya"

    version="${1:-$(get_latest_version)}"

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

add_to_shell() {
  local shell
  local line

  # if mise is already activated dont do anything
  mise doctor | grep "activated: yes" && return 0

  shell=$(basename "$SHELL")
  shell_rc="/$HOME/.${shell}rc"
  line="eval \"\$(/$HOME/.local/bin/mise activate ${shell})\""

  # if the file doesn't exist create it
  if [ ! -f "${shell_rc}" ]; then
    echo "==> 💁 Creating ${shell_rc}"
    touch "${shell_rc}"
  fi

  # if the line doesn't exist add it
  if ! grep -q "$line" "${shell_rc}"; then
    echo "==> 💁 Adding mise to shell"
    echo " " >> "${shell_rc}"
    echo "$line" >> "${shell_rc}"
  fi
}

link_mise_config () {
    ln -s "$"
}

install_tooling () {
  echo "==> 💁 Installing tooling"

  mise install
}

{
  get_mise
  add_to_shell
  get_comtrya "$1"
  install_tooling
}
