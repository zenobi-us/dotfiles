$profileDir = Split-Path -parent $profile

New-Item $profileDir -ItemType Directory -Force -ErrorAction SilentlyContinue

Set-Content `
    "$profileDir/Microsoft.PowerShell_profile.ps1" `
    ". ${PSScriptRoot}\profile\index.ps1"

Get-Content $profile

Remove-Variable profileDir

