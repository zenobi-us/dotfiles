& "${PSScriptRoot}/common.ps1"

# Setup the Profile first
new-item $ProfileDir -ItemType Directory -Force -ErrorAction SilentlyContinue
set-content ( `
    (join-path $ProfileDir "Microsoft.PowerShell_profile.ps1" -resolve) `
    ". " (join-path $PSScriptRoot "profile" "index.ps1") `
)
