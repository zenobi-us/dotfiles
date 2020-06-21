#!/bin/sh

apk add --update \
    libstdc++ \
    zsh \
    openssh \
    gnupg \
    sudo \
    git \
    curl

curl -fsSL https://git.io/shellspec | sh
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | sh

chsh -s /bin/zsh $(whoami)

mkdir -p /etc/sudoers.d/
echo '%sudo ALL=(ALL) ALL' >> /etc/sudoers.d/group