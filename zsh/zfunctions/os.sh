#!/bin/sh

if [ -f /etc/os-release ]; then
    # freedesktop.org and systemd
    . /etc/os-release
    OS=$NAME
    OS_ID=$ID
    VER=$VERSION_ID
elif type lsb_release >/dev/null 2>&1; then
    # linuxbase.org
    OS=$(lsb_release -si)
    VER=$(lsb_release -sr)
elif [ -f /etc/lsb-release ]; then
    # For some versions of Debian/Ubuntu without lsb_release command
    . /etc/lsb-release
    OS=$DISTRIB_ID
    VER=$DISTRIB_RELEASE
elif [ -f /etc/debian_version ]; then
    # Older Debian/Ubuntu/etc.
    OS=Debian
    VER=$(cat /etc/debian_version)
# elif [ -f /etc/SuSe-release ]; then
#     # Older SuSE/etc.
# elif [ -f /etc/redhat-release ]; then
    # Older Red Hat, CentOS, etc.
else
    # Fall back to uname, e.g. "Linux <version>", also works for BSD, etc.
    OS=$(uname -s)
    VER=$(uname -r)
fi

case $(uname -m) in
    x86_64)
        ARCH=x64  # or AMD64 or Intel64 or whatever
        ;;
    i*86)
        ARCH=x86  # or IA32 or Intel32 or whatever
        ;;
    *)
        # leave ARCH as-is
        ;;
esac
