[ -e "${HOME}/.bin" ] && export PATH=$HOME/.bin:$PATH
[ -e "${HOME}/.local/bin" ] && export PATH=$HOME/.local/bin:$PATH
[ -e "${HOME}/.local/share/bin" ] && export PATH=$HOME/.local/share/bin:$PATH
[ -e "${HOME}/Applications" ] && export PATH=$HOME/Applications:$PATH
[ -e "${HOME}/Applications/android-studio" ] && export PATH=$HOME/Applications/android-studio:$PATH

export XDG_RUNTIME_DIR=/run/user/$(id -u)
