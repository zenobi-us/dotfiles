#Requires -Version 5.1
# Windows compatibility wrapper for the Bun discovery script.
[CmdletBinding()]
param()
$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$script = Join-Path $here 'get_cp2077_help_context.ts'
$bun = Get-Command bun -ErrorAction SilentlyContinue
if (-not $bun) {
    Write-Error 'Bun is required for cyberpunk-help discovery.'
    exit 1
}
& $bun.Source $script
exit $LASTEXITCODE
