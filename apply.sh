#!/bin/bash

# a list of directorries
top_level_modules=$(find . -maxdepth 1 -type d -not -path '*/\.*' -not -path '.' | sed 's|./||g' | tr '\n' ' ')

# split $1 by .
top_level_module=$(echo "$1" | cut -d'.' -f1)

echo "top_level_module: $top_level_module"
echo "modules: ${top_level_modules}"

# if not found, print usage and exit
if [[ ! " ${top_level_modules[*]} " =~ " ${top_level_module} " ]]; then
  echo "Usage: comtrya apply <module>"
  echo "Available modules: ${top_level_modules}"
  exit 1
fi

comtrya apply -m $1
