[ -e "${HOME}/.bin" ] && export PATH=$HOME/.bin:$PATH
[ -e "${HOME}/dotfiles/bin" ] && export PATH=$HOME/dotfiles/bin:$PATH
[ -e "${HOME}/Applications" ] && export PATH=$HOME/Applications:$PATH
[ -e "${HOME}/dotfiles/zsh/zfunctions" ] && fpath=( "${HOME}/dotfiles/zsh/zfunctions" $fpath )
