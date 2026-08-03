$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

if (-not (Get-Command mise -ErrorAction SilentlyContinue)) {
  winget install -e --id jdx.mise --accept-source-agreements --accept-package-agreements
  $env:PATH = "$env:LOCALAPPDATA\mise\bin;$env:PATH"
}

mise trust "$RepoRoot\mise.toml" | Out-Null
mise -C "$RepoRoot" bootstrap --yes @args
