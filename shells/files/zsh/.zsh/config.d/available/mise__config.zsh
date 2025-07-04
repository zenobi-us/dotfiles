#!/usr/bin/env bash
eval "$(/home/zenobius/.local/bin/mise activate zsh)"

if [ "$VSCODE_RESOLVING_ENVIRONMENT" = "1" ]; then
    eval "$(/home/zenobius/.local/bin/mise activate zsh --shims)"
elif [ -n "$PS1" ]; then
    eval "$(/home/zenobius/.local/bin/mise activate zsh)"
else
    eval "$(/home/zenobius/.local/bin/mise activate zsh --shims)"
fi
