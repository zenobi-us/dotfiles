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

apply_module() {
  local module
  local module_root

  module="$1"
  module_root=$(echo "$1" | cut -d'.' -f1)

  # if root is not valid module, print usage and exit
  [ -z "$module_root" ] && {
    echo "Invalid module: $module"
    exit 1
  }
  
  # does top level modules contain the chosen root module?
  [ -z "$(echo "$top_level_modules" | grep "$module_root")" ] && {
    echo "Invalid module: $module"
    exit 1
  }

  echo "==> 🚀 Applying $module"
  comtrya apply -m "$module"
}


# if no arguments, print usage and exit
[ -z "$1" ] && print_help

for arg in "$@"; do
    apply_module "$arg"
done


