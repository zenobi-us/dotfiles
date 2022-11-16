#!/usr/bin/env zsh

function load-parts {

    parts=($DOTFILE_ROOT/${1}.zsh)
    if [ ${#parts[@]} -eq 0 ]; then
        return
    fi

    [[ -n "${DEBUG}" ]] && echo "> ${1}" || echo -ne "> ${1} "
    for part in $(find $DOTFILE_ROOT -path "*/${1}.zsh" | sort -z); do
        [[ -n "${DEBUG}" ]] && echo "part > ${part}" || echo -ne '.'
        [[ -e "${part}" ]] && source "${part}"
    done
    echo ""
}
