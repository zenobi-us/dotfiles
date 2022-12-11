#!/usr/bin/env zsh
load-parts "config.d/*__profile"
load-parts "config.d/asdf_config"
export PATH="$HOME/.asdf/shims:$HOME/.asdf/bin:$PATH"
