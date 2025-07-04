#!/bin/bash

color () {
  local color_name
  local message

  color_name="$1"
  message="$2"
  
  case "$color_name" in
    red)
      color=1
      ;;
    green)
      color=2
      ;;
    yellow)
      color=3
      ;;
    blue)
      color=4
      ;;
    magenta)
      color=5
      ;;
    cyan)
      color=6
      ;;
    silver)
      color=7
      ;;
    gray)
      color=8
      ;;
    brightred)
      color=9
      ;;
    brightgreen)
      color=10
      ;;
    brightyellow)
      color=11
      ;;
    brightblue)
      color=12
      ;;
    brightmagenta)
      color=13
      ;;
    brightcyan)
      color=14
      ;;
    white)
      color=15
      ;;
    *)
    color=0
  esac

  echo -e "\e[38;5;${color}m${message}\e[0m"
}

error () {
  color red "$1"
  exit 1
}

info () {
  color cyan "$1"
}

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
  info "Usage: comtrya apply <module>"
  info "Available modules: ${top_level_modules}"
  exit 1
}

validate_module() {
  local module
  local module_root

  module="$1"
  module_root=$(echo "$1" | cut -d'.' -f1)

  module_as_path=$(echo "$module" | tr '.' '/')

  # does "${module_as_path}.yml" exist?
  [ ! -e "${module_as_path}.yml" ] && {
    error "Invalid module: $module"
  }

  # if root is not valid module, print usage and exit
  [ -e "$module_root" ] && {
    error "Invalid module: $module"
  }
  
  # does top level modules contain the chosen root module?
  [ -z "$(echo "$top_level_modules" | grep "$module_root")" ] && {
    error "Invalid module: $module"
  }

}

apply_module() {
  local module
  local module_root

  module="$1"

  validate_module "$module"

  info "==> 🚀 Applying $module"
  comtrya -d . apply -m "$module"
}


# if no arguments, print usage and exit
[ -z "$1" ] && print_help

for arg in "$@"; do
    apply_module "$arg"
done


