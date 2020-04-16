#!/bin/sh

alias compose='docker-compose $@'
alias flameshot='~/.dotfiles/zsh/tools/flameshot.sh $@'
alias samba_public="docker run --rm -it \
            --name samba \
            --privileged \
            -p 139:139 -p 445:445 \
            -v ${HOME}/Public:/shares/Public \
            -v ${HOME}/Projects:/shares/Projects \
            dperson/samba \
            -s 'Public;/shares/Public'\
            -s 'Projects;/shares/Projects'\
            -n "

alias dry="docker run --rm -it \
    -v /var/run/docker.sock:/var/run/docker.sock \
    -e DOCKER_HOST=$DOCKER_HOST \
    moncho/dry"

