if [[ ! -d ~/.nvm ]]; then
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.37.2/install.sh | bash
fi

export NVM_DIR="$HOME/.nvm"
export NVSHIM_AUTO_INSTALL=1
