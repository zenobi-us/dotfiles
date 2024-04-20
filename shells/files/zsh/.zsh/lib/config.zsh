#!/usr/bin/env zsh

. "${DOTFILE_ROOT}/lib/osinformation.sh"

ENABLED_DIR=${DOTFILE_ROOT}/config.d/enabled
AVAILABLE_DIR=${DOTFILE_ROOT}/config.d/available
CONFIG_REGEX="([a-zA-Z\-]*)__([a-zA-Z\-]*).zsh"

[ ! -d "${ENABLED_DIR}" ] && mkdir -p "${ENABLED_DIR}"
[ ! -d "${AVAILABLE_DIR}" ] && mkdir -p "${AVAILABLE_DIR}"

function config_enable () {
    for config in "${@}"; do
        enable_config_part "${config}__profile"
        enable_config_part "${config}__config"
        enable_config_part "${config}__env"
        enable_config_part "${config}__aliases"
    done
}

function edit_config () {
    local name=$1
    local regex="(${name:-"[a-zA-Z\-]*"})__([a-zA-Z\-]*).zsh"
    local configs=()

    for file in $DOTFILE_ROOT/config.d/available/*.zsh; do
        if [[ $file =~ $regex ]];
        then
            configs+=("${match[1]}__${match[2]}")
        fi
    done
    local count=${#configs[@]}

    if [ "${count}" -gt "0" ] && {
        echo $count items found

        for (( i = 1; i < ${count} + 1; i++ )) do
            echo "$i) ${configs[$i]}"
        done

        echo "Choose item to edit >"
        read choice

        micro $DOTFILE_ROOT/config.d/available/${configs[$choice]}.zsh
    }
}

function enable_config_part () {
    local name=$1

    [ -e "${ENABLED_DIR}/${name}.zsh" ] && {
        echo "💫 ${name} already enabled."
        return 0;
    }

    local files=( "${AVAILABLE_DIR}/${name}.zsh" "${AVAILABLE_DIR}/${name}-${MACHINE_OS}.zsh" )

    # loop through files and test if they exist
    # for each file that doesn't exist, remve it from the list
    for file in "${files[@]}"; do
        [ ! -e "${file}" ] && {
            files=("${files[@]/$file}")
        }
    done
    
    # test if there are any files left
    [ ${#files[@]} -eq 0 ] && {
        echo "❌ ${name} not found."
        return 1;
    }

    # loop through the files and create a symlink for each
    for file in "${files[@]}"; do
        # skip it if it's already enabled
        [ -e "${ENABLED_DIR}/${name}.zsh" ] && {
            echo "💫 ${name} already enabled."
            continue;
        }

        ln -s \
            "${file}" \
            "${ENABLED_DIR}/${name}.zsh"
    done

    echo "✅ ${name} enabled."
}

function config_clear () {
    for file in $ENABLED_DIR/*.zsh; do
        if [[ $file =~ $CONFIG_REGEX ]];
        then
            config_disable "${match[1]}"
        fi
    done
}

function config_disable () {
    local name=$1
    echo "Disabling: ${name}"

    disable_config_part "${name}__profile"
    disable_config_part "${name}__config"
    disable_config_part "${name}__env"
    disable_config_part "${name}__aliases"

    echo "✅ ${name} disabled."
}

function disable_config_part () {
    local name=$1
    local part="${ENABLED_DIR}/${name}.zsh"
    local ospart="${ENABLED_DIR}/${name}-${MACHINE_OS}.zsh"

    rm -f "${part}" || true
    rm -f "${ospart}" || true
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
    configs=()
    echo "🗒 Listing config modules";

    for file in $AVAILABLE_DIR/*.zsh; do
        if [[ $file =~ $CONFIG_REGEX ]];
        then
            configs+=("${match[1]}")
        fi
    done

    for config in $(echo "${configs[@]}" | tr ' ' '\n' | sort -u | tr '\n' ' '); do
        echo "$(config_enabled_marker $config) ${config}"
    done

}

function reload () {
    source ~/.zshrc
}

function config () {
    case "${1}" in
        clear)
            config_clear
        ;;
        enable)
            config_enable "${@:2}"
            list_configs
        ;;
        disable)
            config_disable "${@:2}"
            list_configs
        ;;
        list)
            list_configs "${2}"
        ;;
        edit)
            edit_config "${2}"
        ;;
        reload)
            reload
        ;;
        *)
            echo """
Commands are

clear                           resets enabled config items
enable    <item>                enables a config item
disable   <item>                disables an item
list      <enabled|available>   shows all available items
edit      partname              edits item
reload                          reloads profile
"""
        ;;
    esac

}
