#!/usr/bin/env sh

log () {
	echo "[SETUP/osx] $@"
}

log "Installing HomeBrew"
# install brew
/usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"

# install zsh
log "Installing ZSH"
sudo brew install zsh

# allow the brew installed shell
cat $(which zsh) | tee /etc/shells

# settings
log "Starting UserSetup"
task "${HEREPATH}/setup.d/setup.osx.user.sh"
task "${HEREPATH}/setup.d/setup.user.sh"

log "Done"
