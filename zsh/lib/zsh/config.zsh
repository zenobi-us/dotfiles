function config_enable () {
    local name=$1

    enable_config_part "${name}__zgen"
    enable_config_part "${name}__profile"
    enable_config_part "${name}__config"
    enable_config_part "${name}__env"
    enable_config_part "${name}__aliases"

}

alias enable-config="config_enable $@"

function enable_config_part () {
    local name=$1
    [ -e "${DOTFILE_ROOT}/config.d/enabled/${name}.zsh" ] && {
        return 0;
    }
    [ ! -e "${DOTFILE_ROOT}/config.d/available/${name}.zsh" ] && {
        return 0;
    }

    ln -s \
        "${DOTFILE_ROOT}/config.d/available/${name}.zsh" \
        "${DOTFILE_ROOT}/config.d/enabled/${name}.zsh"

    echo "✅ ${name} enabled."
}

function config_disable () {
    local name=$1

    disable_config_part "${name}__zgen"
    disable_config_part "${name}__profile"
    disable_config_part "${name}__config"
    disable_config_part "${name}__env"
    disable_config_part "${name}__aliases"
}

alias disable-config="config_disable $@"

function disable_config_part () {
    local name=$1
    [ ! -e "${DOTFILE_ROOT}/config.d/enabled/${name}.zsh" ] && return 0;

    rm "${DOTFILE_ROOT}/config.d/enabled/${name}.zsh"

    echo "✅ ${name} disabled."
}

function list_configs () {
    local type=${1:-'enabled'}
    cd $DOTFILE_ROOT/config.d/$type;
    regex="([a-zA-Z\-]*)__([a-zA-Z\-]*).zsh"
    configs=()
    for file in *.zsh; do
        if [[ $file =~ $regex ]];
        then
            configs+=("${match[1]}")
        else
            echo "${file} doesn match $regex" >&2
        fi
    done

    unique_configs=($(echo "${configs[@]}" | tr ' ' '\n' | sort -u | tr '\n' ' '))

    echo $unique_configs

}
alias list-config="list_configs $@"
