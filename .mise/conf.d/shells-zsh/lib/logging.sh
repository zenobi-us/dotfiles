#!/usr/bin/env bash

can_use_color() {
    [ -z "$NO_COLOR" ] && [ -t 1 ]
}

# prints string wrapped in color
color() {
    local color
    local string

    color="$1"
    string="$2"

    if [[ ! $(can_use_color) ]]; then
        printf "%b%s%b" "${color}" "$string" "${NC}"
    else
        printf "%s" "$string"
    fi
}

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
GRAY='\033[0;90m'
NC='\033[0m' # No Color

log() {
    local level="$1"
    shift
    case "$level" in
        info) info "$@" ;;
        success) success "$@" ;;
        warning) warning "$@" ;;
        error) error "$@" ;;
        debug) debug "$@" ;;
        fatal) fatal "$@" ;;
        trace) trace "$@" ;;
        *) echo "Unknown log level: $level" ;;
    esac
}

general() {
    echo "$(color "$WHITE" "[GENERAL]") $1"
}

note() {
    echo "$(color "$BLUE" "[NOTE]") $1"
}

info() {
    echo "$(color "$CYAN" "[INFO]") $1"
}
success() {
    echo "$(color "$GREEN" "[SUCCESS]") $1"
}
warning() {
    color "$YELLOW" "[WARNING] $1"
}
error() {
    echo "$(color "$RED" "[ERROR]") $1"
}
debug() {
    if [ -n "$DEBUG" ]; then
        echo "$(color "$GRAY" "[DEBUG]") $1"
    fi
}
fatal() {
    echo "$(color "$RED" "[FATAL]") $1"
    exit 1
}
trace() {
    if [ -n "$DEBUG" ]; then
        echo "$(color "$PURPLE" "[TRACE]") $1"
    fi
}