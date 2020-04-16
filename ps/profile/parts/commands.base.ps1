function global:reload-profile () {
  . "${HOME}\.dotfiles\ps\profile\index.ps1";
}

function global:List-Open-Ports () {
  Param(
    [string]$port
  )

  Get-Process -Id (Get-NetTCPConnection -LocalPort $port).OwningProcess
}

Set-Alias Show-OpenPorts List-Open-Ports