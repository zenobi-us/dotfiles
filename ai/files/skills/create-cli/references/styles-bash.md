# Cli Styles: Bash

This reference provides examples of how to define a CLI tool using Bash scripting.

## Principles

- discrete logic as functions
- clear input/output handling
- error handling with trap. define a register of error codes
- use getopts for argument parsing
- modular structure with sourcing of common utilities
- comments for documentation
- use switch case for command dispatching and subcommands
- default to help output when no arguments provided
- cli tool can be invoked or sourced as a library

## Example Structure

```bash
#!/bin/bash
set -euo pipefail

# Load common utilities
source "$(dirname "$0")/utils.sh"

function print_help() {
    cat << EOF
Usage: $(basename "$0") [options] <command> [args]
Commands:
  init        Initialize something
  start       Start the process
  stop        Stop the process
  status      Show status
Options:
  -h          Show help
EOF
}

function requires_arg() {
local arg_name
local arg_value

    arg_name="$1"
    arg_value="$2"

    if [ -z "$arg_value" ]; then
        echo "Error: Missing required argument: $arg_name" >&2
        print_help
        exit 1
    fi


}

function helper_function() {
    local msg

    msg="$1"
    echo "This is a helper function."
}


function init_command() {
    echo "Initializing..."
    helper_function
    # Initialization logic here
}

function start_command() {
    echo "Starting..."
    # Start logic here
}

function stop_command() {
    echo "Stopping..."
    # Stop logic here
}

function status_command() {
    echo "Status:"
    # Status logic here
}

# Dispatch commands
function main() {
    if [ $# -eq 0 ]; then
        print_help
        exit 1
    fi

    case "$1" in
        init)
            init_command
            ;;
        start)
            start_command
            ;;
        stop)
            stop_command
            ;;
        status)
            status_command
            ;;
        -h|--help)
            print_help
            ;;
        *)
            echo "Unknown command: $1"
            print_help
            exit 1
            ;;
    esac
}

# If script is being run directly, invoke main
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi



```
