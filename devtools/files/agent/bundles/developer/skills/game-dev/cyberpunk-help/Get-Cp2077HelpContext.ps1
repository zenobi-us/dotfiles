#Requires -Version 5.1
# Windows wrapper: prefer Python (canonical). Fallback is the Python script only —
# install Python 3 if this fails. Discovery lives in get_cp2077_help_context.py.
[CmdletBinding()]
param()
$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$pyScript = Join-Path $here 'get_cp2077_help_context.py'

$python = $null
foreach ($cmd in @('python', 'python3', 'py')) {
    $hit = Get-Command $cmd -ErrorAction SilentlyContinue
    if ($hit) {
        $python = $hit.Source
        break
    }
}
if (-not $python) {
    Write-Error 'Python 3 is required for cyberpunk-help discovery (get_cp2077_help_context.py).'
    exit 1
}

& $python $pyScript
exit $LASTEXITCODE
