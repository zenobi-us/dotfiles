#!/usr/bin/env zsh

# initialize mcfly if installed
if command -v mcfly >/dev/null 2>&1; then
  eval "$(mcfly init zsh)"
fi
