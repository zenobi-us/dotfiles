. "${DOTFILE_ROOT}/lib/sh/osinformation.sh"

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
        echo "💫 ${name} already enabled."
        return 0;
    }
    [ ! -e "${DOTFILE_ROOT}/config.d/available/${name}.zsh" ] && {
        return 0;
    }

    ln -s \
        "${DOTFILE_ROOT}/config.d/available/${name}.zsh" \
        "${DOTFILE_ROOT}/config.d/enabled/${name}.zsh"

    [ -e "${DOTFILE_ROOT}/config.d/available/${name}-${OSINFO_PLATFORM}.zsh" ] \
    && [ ! -e "${DOTFILE_ROOT}/config.d/enabled/${name}-${OSINFO_PLATFORM}.zsh" ] \
    && {
        ln -s \
            "${DOTFILE_ROOT}/config.d/available/${name}-${OSINFO_PLATFORM}.zsh" \
            "${DOTFILE_ROOT}/config.d/enabled/${name}-${OSINFO_PLATFORM}.zsh"
    }

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

    [ -e "${DOTFILE_ROOT}/config.d/enabled/${name}-${OSINFO_PLATFORM}.zsh" ] && {
        rm "${DOTFILE_ROOT}/config.d/enabled/${name}-${OSINFO_PLATFORM}.zsh"
    }

    echo "✅ ${name} disabled."
}

function list_configs () {
    local type=${1:-'enabled'}
    cd $DOTFILE_ROOT/config.d/$type;
    regex="([a-zA-Z\-]*)__([a-zA-Z\-]*).zsh"
    configs=()
    echo "🗒 Listing ${type} configs";
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

function config () {
    # echo "test ${@}"
    case "${1}" in
        enable)
            config_enable "${2}"
        ;;
        disable)
            config_disable "${2}"
        ;;
        list)
            list_configs "${2}"
        ;;
        *)
            echo """
Commands are

enable    <item>                enables a config item
disable   <item>                disables an item
list      <enabled|available>   shows all available items
            """
        ;;
    esac

}
