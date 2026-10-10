#!/bin/bash
# Firefox Extension Loader
# Usage: ./load-extensions.sh [extension-name]
#
# Without arguments: lists available extensions
# With extension name: runs web-ext for that extension

EXTENSIONS_DIR="$(dirname "$0")"

if [ -z "$1" ]; then
    echo "Available extensions:"
    for dir in "$EXTENSIONS_DIR"/*/; do
        if [ -f "$dir/manifest.json" ]; then
            name=$(basename "$dir")
            echo "  - $name"
        fi
    done
    echo ""
    echo "Usage: $0 <extension-name>"
    echo "  This will run the extension in Firefox with web-ext"
    echo ""
    echo "Or load manually:"
    echo "  1. Open Firefox"
    echo "  2. Go to about:debugging"
    echo "  3. Click 'This Firefox'"
    echo "  4. Click 'Load Temporary Add-on'"
    echo "  5. Select manifest.json from extension directory"
    exit 0
fi

EXTENSION_PATH="$EXTENSIONS_DIR/$1"

if [ ! -d "$EXTENSION_PATH" ]; then
    echo "Error: Extension '$1' not found"
    exit 1
fi

if [ ! -f "$EXTENSION_PATH/manifest.json" ]; then
    echo "Error: No manifest.json in '$1'"
    exit 1
fi

if ! command -v web-ext &> /dev/null; then
    echo "web-ext not found. Install with: npm install -g web-ext"
    echo ""
    echo "Alternatively, load manually via about:debugging"
    exit 1
fi

echo "Starting Firefox with extension: $1"
cd "$EXTENSION_PATH" && web-ext run --firefox-profile=default-release
