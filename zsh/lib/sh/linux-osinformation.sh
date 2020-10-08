#!/usr/bin/env sh
SOURCE=/etc/os-release

if [ -f "$SOURCE" ]; then
    source <(cat $SOURCE \
    | sed -E '/^\s*#.*/d' \
    | tr '\n' '\000' \
    | sed -z -E 's/^([^=]+)=(.*)/\1\x0\2/g' \
    | xargs -0 -n2 bash -c 'printf "export OSINFO_%s=%q;\n" "${@}"' /dev/null)
fi
