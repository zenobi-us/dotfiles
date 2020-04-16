function global:reload-profile () {
  . "${profile}";
}

function global:List-Open-Ports () {
  Param(
    [string]$port
  )

  Get-Process -Id (Get-NetTCPConnection -LocalPort $port).OwningProcess
}

Set-Alias Show-OpenPorts List-Open-Ports