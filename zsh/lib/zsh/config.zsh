. "${DOTFILE_ROOT}/lib/sh/osinformation.sh"

ENABLED_DIR=${DOTFILE_ROOT}/config.d/enabled
AVAILABLE_DIR=${DOTFILE_ROOT}/config.d/enabled

[ ! -d "${ENABLED_DIR}" ] && mkdir -p "${ENABLED_DIR}"
[ ! -d "${AVAILABLE_DIR}" ] && mkdir -p "${AVAILABLE_DIR}"

function config_enable () {
    local name=$1

    enable_config_part "${name}__zgen"
    enable_config_part "${name}__profile"
    enable_config_part "${name}__config"
    enable_config_part "${name}__env"
    enable_config_part "${name}__aliases"

    list_configs
}

function enable_config_part () {
    local name=$1

    [ -e "${ENABLED_DIR}/${name}.zsh" ] && {
        echo "💫 ${name} already enabled."
        return 0;
    }
    [ ! -e "${AVAILABLE_DIR}/${name}.zsh" ] && {
        return 0;
    }

    ln -s \
        "${AVAILABLE_DIR}/${name}.zsh" \
        "${ENABLED_DIR}/${name}.zsh"

    [ -e "${AVAILABLE_DIR}/${name}-${OSINFO_PLATFORM}.zsh" ] \
    && [ ! -e "${ENABLED_DIR}/${name}-${OSINFO_PLATFORM}.zsh" ] \
    && {
        ln -s \
            "${AVAILABLE_DIR}/${name}-${OSINFO_PLATFORM}.zsh" \
            "${ENABLED_DIR}/${name}-${OSINFO_PLATFORM}.zsh"
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

    list_configs
}

function disable_config_part () {
    local name=$1
    [ ! -e "${ENABLED_DIR}/${name}.zsh" ] && return 0;

    rm "${ENABLED_DIR}/${name}.zsh"

    [ -e "${ENABLED_DIR}/${name}-${OSINFO_PLATFORM}.zsh" ] && {
        rm "${ENABLED_DIR}/${name}-${OSINFO_PLATFORM}.zsh"
    }

    echo "✅ ${name} disabled."
}

function config_enabled_marker () {
    if test -n "$(find "${ENABLED_DIR}" -maxdepth 1 -name "${1}*" -print -quit)"
    then
        echo "🔅"
    else
        echo "  "
    fi
}

function list_configs () {
    regex="([a-zA-Z\-]*)__([a-zA-Z\-]*).zsh"
    configs=()
    echo "🗒 Listing config modules";

    for file in $DOTFILE_ROOT/config.d/available/*.zsh; do
        if [[ $file =~ $regex ]];
        then
            configs+=("${match[1]}")
        fi
    done

    for config in $(echo "${configs[@]}" | tr ' ' '\n' | sort -u | tr '\n' ' '); do
        echo "$(config_enabled_marker $config) ${config}"
    done

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
