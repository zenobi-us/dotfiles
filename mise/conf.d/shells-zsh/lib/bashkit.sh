#!/bin/bash

# a function that checks if an argument is empty
# and exits with an error if it is
require_arg() {
    if [[ -z "${1}" ]]; then
        echo "${2} is required."
        exit 1
    fi
}

# a function that checks if an environment variable is empty
require_envvar() {
    if [[ -z "${!1}" ]]; then
        echo "envvar ${1} is required."
        exit 1
    fi
}

# a function that checks if an argument is equal to a value
require_arg_tobe() {
    if [[ "${1}" != "${2}" ]]; then
        echo "${3} is required to be ${2}."
        exit 1
    fi
}

command_exists () {
    type "$1" >/dev/null 2>&1;
}

# a function that checks if a command exists
requires_command() {
    if command_exists "${1}"; then
        return 0
    fi

    echo "${2} is required. Expected to find: ${1}"
    exit 1
}

#
# Confirm a or exit
confirm() {
    local message
    local response

    message="${1}"

    echo "${message}"
    read -r response

    if [[ ! "${response}" =~ ^[Yy]$ ]]; then
        echo "Exiting..."
        exit 0
    fi
}

#
# Get the root of the repo
get_gitrepo_root() {
    git rev-parse --show-toplevel
}

#
# format a date to iso format
format_date_to_iso() {
    local date

    date="$1"

    date -d "$date" +%Y-%m-%d
}
