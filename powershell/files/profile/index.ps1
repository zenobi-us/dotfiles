. "${PSScriptRoot}/../common.ps1"

load-parts (join-path $PSScriptRoot "parts") "init*"
load-parts (join-path $PSScriptRoot "parts") "commands*"
load-parts (join-path $PSScriptRoot "parts") "alias*"
load-parts (join-path $PSScriptRoot "secrets")

