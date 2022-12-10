ENTRYPOINT := "./src/index.ts"

_default:
    @just --list

setup:
    ./setup.bash

wm:
    comtrya apply -m windowmanagers.awesome
