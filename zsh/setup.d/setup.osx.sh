#!/usr/bin/env bash

cd ~;
rm ~/.z*

[ -f ${HERE}/.zshrc ] && ln -s ${HERE}/.zshrc ~/
[ -f ${HERE}/.zprofile ] && ln -s ${HERE}/.zprofile ~/
[ -f ${HERE}/.zshenv ] && ln -s ${HERE}/.zshenv ~/

# install brew
/usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"

# install zsh
brew install zsh

# allow the brew installed shell
cat $(which zsh) | sudo tee /etc/shells
settings