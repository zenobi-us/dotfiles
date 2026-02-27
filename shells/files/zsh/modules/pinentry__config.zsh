#!/bin/zsh

pkill gpg-agent
gpg-agent --pinentry-program=/usr/bin/pinentry-gnome3 --daemon
