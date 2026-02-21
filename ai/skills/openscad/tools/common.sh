#!/bin/bash
# Common utilities for OpenSCAD tools

# Find OpenSCAD executable
find_openscad() {
    # Check common locations
    if command -v openscad &> /dev/null; then
        echo "openscad"
        return 0
    fi
    
    # macOS Application bundle
    if [ -d "/Applications/OpenSCAD.app" ]; then
        echo "/Applications/OpenSCAD.app/Contents/MacOS/OpenSCAD"
        return 0
    fi
    
    # Homebrew on Apple Silicon
    if [ -x "/opt/homebrew/bin/openscad" ]; then
        echo "/opt/homebrew/bin/openscad"
        return 0
    fi
    
    # Homebrew on Intel
    if [ -x "/usr/local/bin/openscad" ]; then
        echo "/usr/local/bin/openscad"
        return 0
    fi
    
    return 1
}

# Check if OpenSCAD is available
check_openscad() {
    OPENSCAD=$(find_openscad) || {
        echo "Error: OpenSCAD not found!"
        echo ""
        echo "Install OpenSCAD using one of:"
        echo "  brew install openscad"
        echo "  Download from https://openscad.org/downloads.html"
        exit 1
    }
    export OPENSCAD
}

# Get version info
openscad_version() {
    check_openscad
    $OPENSCAD --version 2>&1
}
