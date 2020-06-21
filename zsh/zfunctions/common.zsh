#!/usr/bin/env zsh

function load-parts {
    [[ -n "${DEBUG}" ]] && echo "> ${1}" || echo -ne "> ${1} " 
    for part in $(find $DOTFILE_ROOT -path "*/${1}.zsh"); do
        [[ -n "${DEBUG}" ]] && echo "part > ${part}" || echo -ne '.'
        [[ -e "${part}" ]] && source "${part}"
    done
    echo ""
}
