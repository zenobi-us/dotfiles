eval "$(/home/zenobius/.local/bin/mise activate zsh)"

if test "$VSCODE_RESOLVING_ENVIRONMENT" = 1
    mise activate zsh --shims | source
else if status is-interactive
    mise activate zsh | source
else
    mise activate zsh --shims | source
end
