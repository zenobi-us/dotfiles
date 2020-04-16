#!/usr/bin/env bash

# install brew
/usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"

# install zsh
brew install zsh

# allow the brew installed shell
cat $(which zsh) | sudo tee /etc/shells
settings