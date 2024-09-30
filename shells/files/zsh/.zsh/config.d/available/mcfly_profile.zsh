#!/bin/zsh

# does mcfly command exist?
[ command -v mcfly &> /dev/null ] || {
    eval "$(mcfly init zsh)"
}
