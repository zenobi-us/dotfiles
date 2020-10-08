#!/usr/bin/env bash
log () {
	echo "[SETUP/osx] $@"
}

# install brew
/usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
# install zsh
sudo brew install zsh

# allow the brew installed shell
cat $(which zsh) | tee /etc/shells

settings

task "${HEREPATH}/setup.d/setup.user.sh"
