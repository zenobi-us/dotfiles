$profileDir = Split-Path -parent $profile

New-Item $profileDir -ItemType Directory -Force -ErrorAction SilentlyContinue

copy-item `
    -Path $PSScriptRoot/profile/Microsoft.PowerShell_profile.ps1 `
    -Destination $profileDir

# Copy-Item -Path ./home/** -Destination $home -Include **

Remove-Variable profileDir

