#!/usr/bin/env zsh

. "${DOTFILE_ROOT}/lib/osinformation.sh"

ENABLED_DIR=${DOTFILE_ROOT}/config.d/enabled
AVAILABLE_DIR=${DOTFILE_ROOT}/config.d/available
CONFIG_REGEX="([a-zA-Z\-]*)__([a-zA-Z\-]*).zsh"

[ ! -d "${ENABLED_DIR}" ] && mkdir -p "${ENABLED_DIR}"
[ ! -d "${AVAILABLE_DIR}" ] && mkdir -p "${AVAILABLE_DIR}"

function dotfiles_config_enable () {
    for config in "${@}"; do
        dotfiles_enable_config_part "${config}__profile"
        dotfiles_enable_config_part "${config}__config"
        dotfiles_enable_config_part "${config}__env"
        dotfiles_enable_config_part "${config}__aliases"
    done
}


function dotfiles_edit_config () {
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
        
        echo "${configs[@]}" | td '\s' '\n' | fzf
        
        $EDITOR $DOTFILE_ROOT/config.d/available/${configs[$choice]}.zsh
    }
}

function dotfiles_enable_config_part () {
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

function dotfiles_config_clear () {
    for file in $ENABLED_DIR/*.zsh; do
        if [[ $file =~ $CONFIG_REGEX ]];
        then
            dotfiles_config_disable "${match[1]}"
        fi
    done
}

function dotfiles_config_disable () {
    local name=$1
    echo "Disabling: ${name}"

    dotfiles_disable_config_part "${name}__profile"
    dotfiles_disable_config_part "${name}__config"
    dotfiles_disable_config_part "${name}__env"
    dotfiles_disable_config_part "${name}__aliases"

    echo "✅ ${name} disabled."
}

function dotfiles_disable_config_part () {
    local name=$1
    local part="${ENABLED_DIR}/${name}.zsh"
    local ospart="${ENABLED_DIR}/${name}-${MACHINE_OS}.zsh"

    rm -f "${part}" || true
    rm -f "${ospart}" || true
}

function dotfiles_config_enabled_marker () {
    if test -n "$(find "${ENABLED_DIR}" -maxdepth 1 -name "${1}*" -print -quit)"
    then
        echo "🔅"
    else
        echo "  "
    fi
}

function dotfiles_list_configs () {
    configs=()
    echo "🗒 Listing config modules";

    for file in $AVAILABLE_DIR/*.zsh; do
        if [[ $file =~ $CONFIG_REGEX ]];
        then
            configs+=("${match[1]}")
        fi
    done

    for config in $(echo "${configs[@]}" | tr ' ' '\n' | sort -u | tr '\n' ' '); do
        echo "$(dotfiles_config_enabled_marker $config) ${config}"
    done

}

function dotfiles_reload () {
    source ~/.zshrc
}

function dotfiles () {
    case "${1}" in
        clear)
            dotfiles_config_clear
        ;;
        enable)
            dotfiles_config_enable "${@:2}"
            dotfiles_list_configs
        ;;
        disable)
            dotfiles_config_disable "${@:2}"
            dotfiles_list_configs
        ;;
        list)
            dotfiles_list_configs "${2}"
        ;;
        edit)
            dotfiles_edit_config "${2}"
        ;;
        reload)
            dotfiles_reload
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
