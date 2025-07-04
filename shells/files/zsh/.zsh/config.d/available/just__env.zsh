#!/usr/bin/env bash

# in wsl, just has a problem writing the shell scripts to file 
# before executing them, so we need to create the directories
# and files in advance where the user certainly has write access.
#
# For some reason setting these to places in the home directory
# doesn't work, so we use /tmp instead.
XDG_RUNTIME_DIR="$(mktemp -d "/tmp/xdg-runtime-XXXXXX")"
XDG_CACHE_HOME="$(mktemp -d "/tmp/xdg-cache-XXXXXX")"
export XDG_CACHE_HOME
export XDG_RUNTIME_DIR
