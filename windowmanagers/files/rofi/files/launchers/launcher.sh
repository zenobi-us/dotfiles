#!/usr/bin/env bash

type=${1:-'type-1'}
theme=${2:-'style-1'}
colors=${3:-'onedark'}

dir="$HOME/.config/rofi/launchers/${type}"

## Set Colors
echo "@import \"~/.config/rofi/colors/${colors}.rasi\"" > "${dir}/${theme}/shared/colors.rasi"

## Run
rofi \
    -show drun \
    -theme ${dir}/${theme}.rasi
