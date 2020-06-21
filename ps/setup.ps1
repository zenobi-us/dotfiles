& "${PSScriptRoot}/common.ps1"

# Setup the Profile first
New-Item $ProfileDir -ItemType Directory -Force -ErrorAction SilentlyContinue
Set-Content ( `
    (join-path $ProfileDir "Microsoft.PowerShell_profile.ps1" -resolve) `
    ". " (join-path $PSScriptRoot "profile" "index.ps1") `
)

# Link all the Application Dotfiles
Stow "vscode" "keybinding.json"
Stow "vscode" "tasks.json"
Stow "vscode" "settings.json"

Stow "git" ".gitconfig"
