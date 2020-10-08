#!/usr/bin/env bash

cd ~;
rm ~/.z*

[ -f ${HERE}/.zshrc ] && ln -s ${HERE}/.zshrc ~/
[ -f ${HERE}/.zprofile ] && ln -s ${HERE}/.zprofile ~/
[ -f ${HERE}/.zshenv ] && ln -s ${HERE}/.zshenv ~/
