#!/bin/zsh

pkill gpg-agent 2>/dev/null
gpg-agent --pinentry-program=/usr/bin/pinentry-gnome3 --daemon 2>/dev/null
