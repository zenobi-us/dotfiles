#!/bin/sh

xrandr \
    --output eDP-1 --off \
    --output DP-1 --off \
    --output HDMI-1 --off \
    --output DP-2 --off \
    --output HDMI-2 --off \
    --output DP-1-1 --mode 3440x1440 --pos 3440x0 --rotate normal \
    --output DP-1-2 --primary --mode 3440x1440 --pos 0x0 --rotate normal \
    --output DP-1-3 --off
