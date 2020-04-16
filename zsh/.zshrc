#!/bin/bash/env zsh

source "${DOTFILE_ROOT}/zfunctions/include";

include "tools/zgen.zsh"
include "config/tools__zgen.zsh"
include "config/aspect__prompt.zsh"
include "config/aspect__npm.zsh"
include "config/aspect__pypi.zsh"
include "config/aspect__history.zsh"
include "config/aspect__keybindings.zsh"
include "config/aspect__autocomplete.zsh"
include "config/aspect__path.zsh"
include "config/aliases__docker.zsh"
include "config/aliases__git.zsh"
include "config/aliases__aws.zsh"

echo 'Loaded'

# The next line updates PATH for the Google Cloud SDK.
if [ -f '${HOME}/google-cloud-sdk/path.zsh.inc' ]; then . '${HOME}/google-cloud-sdk/path.zsh.inc'; fi

# The next line enables shell command completion for gcloud.
if [ -f '${HOME}/google-cloud-sdk/completion.zsh.inc' ]; then . '${HOME}/google-cloud-sdk/completion.zsh.inc'; fi

