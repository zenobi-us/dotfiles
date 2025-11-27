#!/usr/bin/env zsh
eval "$(/home/zenobius/.local/bin/mise activate zsh)"

if [[ -n "$VSCODE_RESOLVING_ENVIRONMENT" && "$VSCODE_RESOLVING_ENVIRONMENT" == 1 ]]; then
    eval "$(mise activate zsh --yes --silent --shims)"

# checks if the shell is running in interactive mode.
elif [[ -o interactive ]]; then
    eval "$(mise activate zsh --yes --silent)"

else
    eval "$(mise activate zsh --yes --silent --shims)"

fi
