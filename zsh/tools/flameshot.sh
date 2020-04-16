#!/bin/sh

KEY=$(xauth list | grep $(hostname) | awk '{ print $3 }' | head -n 1)
DCK_HOST=docker-flameshot
xauth add $DCK_HOST/unix:0 . $KEY

docker run -it --rm \
    -e DISPLAY=unix$DISPLAY \
    -v /tmp/.X11-unix:/tmp/.X11-unix \
    -v ~/.Xauthority:/root/.Xauthority \
    -e XAUTHORITY=/root/.Xauthority \
    -h $DCK_HOST \
    --net=host \
    manuellr/flameshot
