#!/bin/sh

function tolowercase() {
    tr '[:upper:]' '[:lower:]' <<<"$1"
}