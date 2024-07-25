#!/bin/bash

# a list of directorries
top_level_modules=$(
    find . \
      -maxdepth 1 \
      -type d \
      -not -path '*/\.*' \
      -not -path '.' |
    sed 's|./||g' |
    tr '\n' ' '
)


# if not found, print usage and exit
print_help() {
  echo "Usage: comtrya apply <module>"
  echo "Available modules: ${top_level_modules}"
  exit 1
}

# if $1 is empty, print usage and exit
[ -z "$1" ] && print_help

chosen_root_module=$(echo "$1" | cut -d'.' -f1)
# if root is not valid module, print usage and exit
[ -z "$chosen_root_module" ] && print_help
# does top level modules contain the chosen root module?
[ -z "$(echo "$top_level_modules" | grep "$chosen_root_module")" ] && print_help

echo "==> 🚀 Applying $1"

comtrya apply -m "$1"
