#!/usr/bin/env sh

#
# Calculates the absolute path of a
# relative path
#
function absolute_path() {
    cd "$(dirname "$1")"
    case $(basename $1) in
        ..) echo "$(dirname $(pwd))";;
        .)  echo "$(pwd)";;
        *)  echo "$(pwd)/$(basename $1)";;
    esac
}