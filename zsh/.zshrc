#!/bin/bash/env zsh
source "${DOTFILE_ROOT}/zfunctions/common.zsh";

load-parts "tools/*"
load-parts "config.d/tools*"
load-parts "config.d/aspect*"
load-parts "config.d/aliases*"
load-parts "secrets.d/*"
