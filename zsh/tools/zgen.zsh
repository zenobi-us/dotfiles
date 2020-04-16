if [[ -f ~/.zgen/zgen.zsh ]]; then
else
    git clone https://github.com/tarjoilija/zgen.git "${HOME}/.zgen"
fi
	source ~/.zgen/zgen.zsh
