if ! zgen saved; then
    echo "Creating a zgen save"
    zgen oh-my-zsh

    zgen oh-my-zsh plugins/git
    zgen oh-my-zsh plugins/sudo
    zgen oh-my-zsh plugins/command-not-found
    zgen load zsh-users/zsh-syntax-highlighting

    zgen load zsh-users/zsh-completions src
    zgen load mafredri/zsh-async

    zgen load lukechilds/zsh-nvm
    zgen load romkatv/powerlevel10k powerlevel10k

    zgen save
fi
