function android__paths() {
    local target_dir="$1"
    local paths=(
        "${target_dir}/emulator"
        # "${target_dir}/tools"
        "${target_dir}/tools/bin"
        "${target_dir}/platform-tools"
        "${target_dir}/cmdline-tools/latest/bin"
    )

    # join array with :
    IFS=:; echo "${paths[*]}"
}

export ANDROID_HOME="$HOME/.local/share/android-sdk"
export ANDROID_SDK_ROOT=$ANDROID_HOME

export PATH="$(android__paths $ANDROID_HOME):$PATH"
