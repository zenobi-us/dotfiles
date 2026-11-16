if (-not $env:MISE_GLOBAL_CONFIG_ROOT) {
	Write-Warning "MISE_GLOBAL_CONFIG_ROOT is not set. Run mise bootstrap with --from-dir."
}

. "${PSScriptRoot}/common.ps1"

load-parts (join-path $PSScriptRoot "parts") "init*"
load-parts (join-path $PSScriptRoot "parts") "commands*"
load-parts (join-path $PSScriptRoot "parts") "alias*"
load-parts (join-path $PSScriptRoot "secrets")
