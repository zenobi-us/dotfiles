#!/bin/bash

require_arg() {
  local arg="${1}"
  local value="${2}"
  local syntax="${3}"

  if [ -z "${value}" ]; then
    echo "==> 📛📦 Missing ${arg}."
    echo "==> 📝 Syntax: ${syntax}"
    exit 1
  fi
}

# ensures that provided line is in the provided file but only once
ensure_unique_lines() {
  local file="${1}"
  local line="${2}"

  if ! grep -q "${line}" "${file}"; then
    echo "${line}" >> "${file}"
  fi
}

require_command() {
  local cmd
  local cmd_path

  cmd="${1}"
  cmd_path=$(command -v "${cmd}")

  if [ -z "${cmd_path}" ]; then
    echo "==> 📛📦 Missing ${cmd}"
    exit 1
  fi
}

download_sdk() {
  local target_dir="${1:-"$HOME"}"
  local sdk_version="${2:-22.6.2}"
  local sdk_url="${3:-"http://dl.google.com/android/android-sdk_r${sdk_version}-linux.tgz"}"

  echo "==> 💁 [Android] Downloading Android SDK"

  curl --location "${sdk_url}" \
       --output "sdk.tgz"

  # skip first level of directory
  tar -xf \
    "sdk.tgz" \
    -C "${target_dir}" \
    --strip-components=1

  rm 'sdk.tgz'

}

download_ndk() {
  local target_dir="${1:-"$HOME"}"
  local ndk_version="${2:-r26b}"
  local ndk_url="${3:-"https://dl.google.com/android/repository/android-ndk-${ndk_version}-linux.zip"}"

  echo "==> 💁 [Android] Downloading Android NDK"

  curl --location "${ndk_url}" \
       --output "ndk.zip"


  # unzip into target, replace all files
  unzip \
    -o \
    -d "${target_dir}" 'ndk.zip'

  rm 'ndk.zip'
}

download_cmd_tools(){
  local target_dir="${1:-"$HOME"}"

  echo "==> 💁 [Android] Downloading Commandline Tools"

  curl --location 'https://dl.google.com/android/repository/commandlinetools-linux-10406996_latest.zip' \
       --output 'cmd-tools.zip'

  # unzip as $target/cmdline-tools/tools
  tmp=$(mktemp -d)
  unzip \
    -o \
    -d "${tmp}" 'cmd-tools.zip'

  mv "${tmp}/cmdline-tools" "${target_dir}/tools"
  mkdir -p "${target_dir}/cmdline-tools"
  mv "${target_dir}/tools" "${target_dir}/cmdline-tools/tools"

  rm 'cmd-tools.zip'

}

get_environment_paths(){
  local profile_file="${1}"
  local target_dir="${2}"

    # an array of paths to add to PATH
  local paths=(
    "${target_dir}/emulator"
    "${target_dir}/tools"
    "${target_dir}/tools/bin"
    "${target_dir}/platform-tools"
    "${target_dir}/cmdline-tools/bin"
    "\$PATH"
  )

  # join array with :
  IFS=:; echo "${paths[*]}"
}

configure_profile() {
  local profile_file="${1}"
  local target_dir="${2}"

  echo "==> 💁 [Android] Configuring profile"

  ensure_unique_lines \
    "${profile_file}" \
    "export ANDROID_HOME=${target_dir};"

  ensure_unique_lines \
    "${profile_file}" \
    "export ANDROID_SDK_ROOT=${target_dir};"

  # join array with :
  ensure_unique_lines \
    "${profile_file}" \
    "export PATH=$(get_environment_paths "${profile_file}" "${target_dir}")"
}

install_sdk() {
  local target_dir="${1:-"$HOME/android-sdk-linux"}"
  local profile_file="${2:-"$HOME/.bash_profile"}"

  mkdir -p "${target_dir}"

  download_cmd_tools "${target_dir}"
  download_sdk "${target_dir}"
  download_ndk "${target_dir}"
  configure_profile "${profile_file}" "${target_dir}"


  require_command "android"

  export ANDROID_SDK_ROOT=${target_dir};
  export ANDROID_HOME=${target_dir};
  export PATH="${PATH}:$(get_environment_paths "${profile_file}" "${target_dir}")"

  (while sleep 3; do echo "y"; done) | android update sdk --no-ui
  (while sleep 3; do echo "y"; done) | android update sdk --no-ui --filter $(seq -s, 34)
  yes | sdkmanager --update --sdk_root="${target_dir}"
  yes | sdkmanager --licenses --sdk_root="${target_dir}"
}

remove_sdk(){
  local target_dir="${1:-"$HOME/android-sdk-linux"}"
  local profile_file="${2:-"$HOME/.bash_profile"}"

  rm -rf "${target_dir}"

}

create_machine() {
  local name="${1}"
  local api="${2:-33}"
  local abi="${3:-arm64-v8a}"

  yes | sdkmanager \
    --install "system-images;android-${api}-ext5;google_apis_playstore;${abi}"

  echo no | avdmanager \
    create avd \
    --force \
    --name "${name}" \
    --abi "${abi}" \
    --package "system-images;android-${api};google_apis_playstore;${abi}"

}


case "${1}" in
  "reset")
    require_arg "target_dir" "${2}" "./android.sh reset target_dir"
    require_arg "profile_file" "${3}" "./android.sh reset target_dir profile_file"

    remove_sdk "${2}" "${3}"
    ;;

  "install")
    require_arg "target_dir" "${2}" "./android.sh install target_dir profile_file"
    require_arg "profile_file" "${3}" "./android.sh install target_dir profile_file"

    install_sdk "${2}" "${3}"
    ;;

  "create")
    require_arg "name" "${2}" "./android.sh create name [api] [abi]"

    create_machine "${2}" "${3}"
    ;;

  *)
    echo "Usage: $0 [install|create]"
    exit 1
    ;;
esac
