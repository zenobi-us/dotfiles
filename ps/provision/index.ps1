Set-ExecutionPolicy RemoteSigned -Scope CurrentUser

. (join-path $PSScriptRoot "../common.ps1")

& (join-path $PSScriptRoot "./core.pacakgemanagers.ps1")
& (join-path $PSScriptRoot "./window.system.ps1")

& (join-path $PSScriptRoot "./core.tools.ps1")

& (join-path $PSScriptRoot "./dev.tools.ps1")

& (join-path $PSScriptRoot "./windows.updates.ps1")
