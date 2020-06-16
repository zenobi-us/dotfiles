#!/usr/bin/env zsh

function load-parts {
    echo -ne "> ${1} "
    for part in $(find $DOTFILE_ROOT -path "*/${1}"); do
        echo -ne '.'
        [ -e "${part}" ] && source "${part}"
    done
    echo ""
}
