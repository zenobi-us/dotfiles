#!/usr/bin/env zsh

function task () {
    target=$1
    [ ! -f "$target" ] && log "ETASKNOEXIST: $target"
    if [ -f "$target" ]; then
        log "TASK ${target}"
        . $target
    fi
}