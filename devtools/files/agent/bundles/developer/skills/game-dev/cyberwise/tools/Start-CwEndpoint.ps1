# Start-CwEndpoint.ps1 -- a loopback endpoint so a generated page can ask for work.
#
#     .\Start-CwEndpoint.ps1 -Mode tool -SheetPath '<the html>' -GameRoot '<game>'
#     .\Start-CwEndpoint.ps1 -Status
#     .\Start-CwEndpoint.ps1 -Stop
#
# WHY THIS EXISTS
#
# The reports this family generates are dead HTML. A user looking at a hotkey
# sheet that has drifted from their real bindings has to leave the page, find a
# terminal, and remember a tool name - which means the sheet simply stays wrong.
# A button that says "update this sheet" removes all of that.
#
# WHY IT IS BUILT LIKE THIS, WHICH MATTERS MORE THAN WHAT IT DOES
#
# "A local listener that runs prompts when poked" is a genuinely bad object to
# leave on somebody's machine, and the obvious implementation is an exploit. The
# whole design is five properties that hold together; none of them is optional.
#
#  1. LOOPBACK ONLY. The prefix is 127.0.0.1, never + or *. Nothing off this
#     machine can reach it, and this needs no admin and no URL reservation.
#
#  2. THE REQUEST NAMES AN ID AND NOTHING ELSE. Commands, script paths and
#     arguments live in endpoint.actions.json, which ships. There is no request
#     field that reaches a shell, so there is nothing to inject INTO - which is
#     a stronger claim than sanitising a command would ever be. Placeholders in
#     an action's args are filled from THIS script's startup parameters, never
#     from the caller.
#
#  3. ORIGIN IS CHECKED, AND THIS IS THE ONE PEOPLE MISS. A page on the open
#     internet can absolutely make your browser POST to 127.0.0.1. It cannot
#     forge the Origin header - the browser sets it - so a request carrying any
#     http(s) origin is refused. The sheet is opened from disk, whose origin is
#     "null", and that is the only origin allowed. Without this check every
#     website you visit gets a button on this endpoint.
#
#  4. A TOKEN THE BROWSER CANNOT READ. Kept beside the user's other records and
#     baked into the page when it is generated. A website cannot read a local
#     file, so it cannot present the token even if it defeated the origin check.
#     Requiring it in a CUSTOM header also forces a CORS preflight, which is a
#     second place the origin gets checked before anything runs. This is not a
#     defence against local malware, which already has the user's own rights;
#     it is a defence against a web page, which is the actual threat here.
#
#  5. THE MODE IS THE USER'S, AND IT DEFAULTS TO DOING NOTHING. In 'prompt' the
#     endpoint executes NOTHING - it hands the text back for the page to copy,
#     which is the same affordance the page has when this service is not running
#     at all. 'tool' permits actions the inventory marks as tools. 'agent'
#     additionally permits agent dispatch. Every invocation is appended to an
#     audit log whether it was allowed or refused.
#
# The page must degrade on its own: if /health does not answer, it shows a copy
# button instead. That is deliberate - the endpoint is an accelerator, never a
# dependency, and a user who never starts it loses nothing but a click.

[CmdletBinding()]
param(
    [int] $Port = 47311,

    # prompt < tool < agent. Anything the inventory marks above this is refused
    # and logged. The default is the one that cannot execute anything.
    [ValidateSet('prompt', 'tool', 'agent')]
    [string] $Mode = 'prompt',

    # Resolved into action args as {sheet} / {gameRoot} / {records}. From here,
    # never from a request - see property 2 above.
    [string] $SheetPath,
    [string] $GameRoot,
    [string] $Records,

    [string] $ActionsFile,
    [string] $LogPath,

    [switch] $Status,
    [switch] $Stop
)

# --- upstream guard ---------------------------------------------------------
# Advisory, and only that: silent while this copy matches what shipped, one
# short line when it does not, and it never blocks or changes an exit code.
# Rationale, and why it is deliberately not a PreToolUse hook: UpstreamGuard.ps1.
$cwGuard = Join-Path $PSScriptRoot 'UpstreamGuard.ps1'
if (Test-Path -LiteralPath $cwGuard) { try { . $cwGuard; Invoke-CwStartupGuard } catch { } }

$ErrorActionPreference = 'Stop'

# $PSScriptRoot is EMPTY inside a param default on Windows PowerShell 5.1 when
# the script is run with -File or dot-sourced - it is only populated under the
# call operator, and pwsh 7 populates it in every case. So the defaults below
# are resolved HERE, correct on both engines and by every invocation route.
# See cyberwise/references/environment.md.

if (-not $Records) {
    $Records = Join-Path $env:USERPROFILE 'Saved Games\CD Projekt Red\Cyberpunk 2077\Cyberwise'
}
if (-not $ActionsFile) { $ActionsFile = Join-Path (Split-Path -Parent $PSScriptRoot) 'endpoint.actions.json' }
if (-not $LogPath)     { $LogPath     = Join-Path $Records 'endpoint.log' }

$tokenPath = Join-Path $Records 'endpoint.token'
$statePath = Join-Path $Records 'endpoint.state'

$MODE_RANK = @{ prompt = 0; tool = 1; agent = 2 }

# ------------------------------------------------------------------ helpers --

function Write-Audit {
    param([string] $Event, [string] $Detail)
    $line = '{0}  {1,-9}  {2}' -f (Get-Date).ToString('yyyy-MM-ddTHH:mm:sszzz'), $Event, $Detail
    try {
        $dir = Split-Path -Parent $LogPath
        if (-not (Test-Path -LiteralPath $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
        Add-Content -LiteralPath $LogPath -Value $line -Encoding UTF8
    } catch { }
    Write-Host $line -ForegroundColor DarkGray
}

# The token is created once and kept. Rotating it per start would invalidate
# every page already generated, and a user whose button silently stopped working
# would have no way at all to find out why.
function Get-EndpointToken {
    if (Test-Path -LiteralPath $tokenPath) {
        $t = (Get-Content -LiteralPath $tokenPath -Raw).Trim()
        if ($t) { return $t }
    }
    $bytes = New-Object byte[] 32
    ([System.Security.Cryptography.RandomNumberGenerator]::Create()).GetBytes($bytes)
    $t = -join ($bytes | ForEach-Object { $_.ToString('x2') })
    $dir = Split-Path -Parent $tokenPath
    if (-not (Test-Path -LiteralPath $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    [System.IO.File]::WriteAllText($tokenPath, $t, (New-Object System.Text.UTF8Encoding($false)))
    return $t
}

if ($Status) {
    if (Test-Path -LiteralPath $statePath) {
        Get-Content -LiteralPath $statePath -Raw
    } else {
        Write-Host "endpoint not running (no state file)" -ForegroundColor Yellow
    }
    exit 0
}

if ($Stop) {
    # There is no remote shutdown route on purpose: a /shutdown that anything
    # could call is one more thing to have got wrong. Stopping is a local act.
    if (Test-Path -LiteralPath $statePath) { Remove-Item -LiteralPath $statePath -Force }
    Write-Host "state cleared; stop the listener process itself (tray, or Ctrl+C in its window)" -ForegroundColor Yellow
    exit 0
}

# ---------------------------------------------------------------- inventory --

if (-not (Test-Path -LiteralPath $ActionsFile)) { throw "No action inventory at '$ActionsFile'." }
$inv = Get-Content -LiteralPath $ActionsFile -Raw | ConvertFrom-Json

# Validate the inventory ONCE, at startup, rather than per request. A malformed
# action should stop the service coming up, where somebody is watching, instead
# of failing inside a button press where nobody is.
$actions = @{}
foreach ($a in $inv.actions) {
    foreach ($required in @('id', 'title', 'requires', 'prompt')) {
        if (-not $a.$required) { throw "An action is missing '$required'." }
    }
    if (-not $MODE_RANK.ContainsKey($a.requires)) { throw "Action '$($a.id)' has unknown requires '$($a.requires)'." }
    if ($actions.ContainsKey($a.id)) { throw "Duplicate action id '$($a.id)'." }
    if ($MODE_RANK[$a.requires] -gt 0) {
        foreach ($required in @('skill', 'script')) {
            if (-not $a.run.$required) { throw "Action '$($a.id)' can execute but has no run.$required." }
        }
    }
    $actions[$a.id] = $a
}

$skillsRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$token = Get-EndpointToken

# ------------------------------------------------------------------ running --

function Resolve-ActionArgs {
    param($Action)
    # Placeholders are filled from THIS script's startup parameters. A value
    # that was never supplied is a hard refusal rather than an empty string
    # quietly passed along: New-HotkeySheet.ps1 -Out '' would write somewhere
    # nobody asked for. Plain string replacement, so nothing here is a pattern.
    $map = @{ '{records}' = $Records }
    if ($SheetPath) { $map['{sheet}']    = $SheetPath }
    if ($GameRoot)  { $map['{gameRoot}'] = $GameRoot }

    $out = @()
    foreach ($raw in @($Action.run.args)) {
        $v = [string] $raw
        foreach ($k in @('{sheet}', '{gameRoot}', '{records}')) {
            if ($v.Contains($k)) {
                if (-not $map.ContainsKey($k)) {
                    throw "action '$($Action.id)' needs $k, which was not supplied when the endpoint started"
                }
                $v = $v.Replace($k, $map[$k])
            }
        }
        $out += $v
    }
    return ,$out
}

function Invoke-Action {
    param($Action)
    $script = Join-Path (Join-Path $skillsRoot $Action.run.skill) (Join-Path 'tools' $Action.run.script)
    if (-not (Test-Path -LiteralPath $script)) {
        throw "action '$($Action.id)' points at a script that is not installed: $script"
    }
    $argv = Resolve-ActionArgs $Action
    Write-Audit 'run' "$($Action.id)  $($Action.run.script) $($argv -join ' ')"
    $out = & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $script @argv 2>&1 | Out-String
    [pscustomobject]@{ ExitCode = $LASTEXITCODE; Output = $out }
}

# -------------------------------------------------------------------- serve --

$listener = New-Object System.Net.HttpListener
$prefix = "http://127.0.0.1:$Port/"
$listener.Prefixes.Add($prefix)
try { $listener.Start() } catch { throw "Could not bind $prefix -- $($_.Exception.Message)" }

$state = @"
endpoint  $prefix
mode      $Mode
actions   $($actions.Count)
sheet     $(if ($SheetPath) { $SheetPath } else { '(none)' })
started   $((Get-Date).ToString('yyyy-MM-ddTHH:mm:sszzz'))
pid       $PID
"@
[System.IO.File]::WriteAllText($statePath, $state, (New-Object System.Text.UTF8Encoding($false)))

Write-Host "cyberwise endpoint on $prefix  mode=$Mode  actions=$($actions.Count)" -ForegroundColor Green
Write-Host "  token $($token.Substring(0,8))... (in $tokenPath)" -ForegroundColor DarkGray
Write-Host "  Ctrl+C to stop" -ForegroundColor DarkGray
Write-Audit 'start' "port=$Port mode=$Mode actions=$($actions.Count)"

$lastRun = @{}

function Write-Json {
    param($Ctx, [int] $Code, $Body, [string] $Origin)
    $res = $Ctx.Response
    $res.StatusCode = $Code
    $res.ContentType = 'application/json'
    # Echo back only an origin already judged acceptable. Never '*': that would
    # hand every website on the internet a usable response.
    if ($Origin) {
        $res.Headers['Access-Control-Allow-Origin'] = $Origin
        $res.Headers['Vary'] = 'Origin'
    }
    $res.Headers['Access-Control-Allow-Headers'] = 'content-type, x-cyberwise-token'
    $res.Headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    $json = $Body | ConvertTo-Json -Depth 6 -Compress
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
    $res.ContentLength64 = $bytes.Length
    $res.OutputStream.Write($bytes, 0, $bytes.Length)
    $res.OutputStream.Close()
}

try {
    while ($listener.IsListening) {
        $ctx = $listener.GetContext()
        $req = $ctx.Request
        $path = $req.Url.AbsolutePath.TrimEnd('/')
        if (-not $path) { $path = '/' }
        $origin = $req.Headers['Origin']

        # ---- origin gate, before anything else looks at the request ----
        #
        # A file:// page sends "null". Some browsers omit Origin entirely on a
        # same-context GET. Anything that presents a real scheme+host is a web
        # page, and a web page is exactly what this must not serve.
        $originOk = (-not $origin) -or ($origin -eq 'null') -or ($origin -eq 'file://')
        if (-not $originOk) {
            Write-Audit 'refused' "origin=$origin path=$path"
            Write-Json $ctx 403 @{ error = 'origin not permitted' } $null
            continue
        }
        $allowOrigin = if ($origin) { $origin } else { 'null' }

        if ($req.HttpMethod -eq 'OPTIONS') { Write-Json $ctx 204 @{} $allowOrigin; continue }

        # ---- health: no token, so a page can detect us and degrade ----
        if ($path -eq '/health') {
            Write-Json $ctx 200 @{ ok = $true; mode = $Mode; actions = $actions.Count } $allowOrigin
            continue
        }

        # ---- everything else needs the token ----
        $given = $req.Headers['X-Cyberwise-Token']
        if (-not $given -or $given -ne $token) {
            Write-Audit 'refused' "bad or missing token path=$path"
            Write-Json $ctx 401 @{ error = 'bad or missing token' } $allowOrigin
            continue
        }

        if ($path -eq '/actions') {
            # The ? lightbox reads the prompt FROM HERE, not from a copy baked
            # into the page. A page that shipped its own copy could show one
            # thing and send another, which would make the inspection theatre.
            $list = foreach ($k in $actions.Keys) {
                $a = $actions[$k]
                @{ id = $a.id; title = $a.title; requires = $a.requires
                   summary = $a.summary; prompt = $a.prompt
                   permitted = ($MODE_RANK[$a.requires] -le $MODE_RANK[$Mode]) }
            }
            Write-Json $ctx 200 @{ mode = $Mode; actions = @($list) } $allowOrigin
            continue
        }

        if ($path -eq '/invoke' -and $req.HttpMethod -eq 'POST') {
            $reader = New-Object System.IO.StreamReader($req.InputStream, $req.ContentEncoding)
            $raw = $reader.ReadToEnd(); $reader.Close()
            $body = $null
            try { $body = $raw | ConvertFrom-Json } catch { }
            $id = if ($body) { "$($body.id)" } else { '' }

            if (-not $actions.ContainsKey($id)) {
                Write-Audit 'refused' "unknown action '$id'"
                Write-Json $ctx 404 @{ error = 'unknown action' } $allowOrigin
                continue
            }
            $a = $actions[$id]

            # ---- mode gate ----
            if ($MODE_RANK[$a.requires] -gt $MODE_RANK[$Mode]) {
                Write-Audit 'refused' "$id needs mode '$($a.requires)', running as '$Mode'"
                Write-Json $ctx 200 @{ ran = $false; reason = 'mode'; needs = $a.requires
                                       mode = $Mode; prompt = $a.prompt } $allowOrigin
                continue
            }

            # ---- prompt mode never executes ----
            if ($Mode -eq 'prompt') {
                Write-Audit 'prompt' $id
                Write-Json $ctx 200 @{ ran = $false; reason = 'prompt-only'; prompt = $a.prompt } $allowOrigin
                continue
            }

            # ---- cooldown: a held-down button must not queue twenty runs ----
            $cd = if ($a.cooldownSec) { [int] $a.cooldownSec } else { 5 }
            if ($lastRun.ContainsKey($id)) {
                $since = ((Get-Date) - $lastRun[$id]).TotalSeconds
                if ($since -lt $cd) {
                    Write-Json $ctx 429 @{ error = 'too soon'
                                           retryAfterSec = [int][math]::Ceiling($cd - $since) } $allowOrigin
                    continue
                }
            }
            $lastRun[$id] = Get-Date

            try {
                $r = Invoke-Action $a
                Write-Audit 'done' "$id exit=$($r.ExitCode)"
                Write-Json $ctx 200 @{ ran = $true; exitCode = $r.ExitCode
                                       output = $r.Output.Trim() } $allowOrigin
            } catch {
                Write-Audit 'error' "$id $($_.Exception.Message)"
                Write-Json $ctx 500 @{ ran = $false; error = "$($_.Exception.Message)" } $allowOrigin
            }
            continue
        }

        Write-Json $ctx 404 @{ error = 'no such route' } $allowOrigin
    }
} finally {
    Write-Audit 'stop' "port=$Port"
    if (Test-Path -LiteralPath $statePath) { Remove-Item -LiteralPath $statePath -Force -ErrorAction SilentlyContinue }
    $listener.Stop(); $listener.Close()
}
