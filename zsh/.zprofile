#!/bin/bash/env zsh
export DOTFILE_ROOT=$(dirname $(readlink "${(%):-%x}"))
. "${DOTFILE_ROOT}/lib/zsh/loadparts.zsh";

load-parts "config.d/*__profile"
