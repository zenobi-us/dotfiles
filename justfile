ENTRYPOINT := "./src/index.ts"

apply module:
    comtrya apply -m {{module}}

setup:
    ./setup.bash
    luarocks make

wm:
    comtrya apply -m windowmanagers.awesome
