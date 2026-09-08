# ============================================================================
# New-InputSnapshot.ps1 -- record the input stack, so "is that normal?" has an answer
# ============================================================================
#
# WHY THIS EXISTS
#
# On 2026-08-26 a CET overlay fault was traced to a ghost HID keyboard node -
# a device in `Unknown` status sitting beside live siblings with the same
# instance ID. It looked damning. It was also impossible to judge, because
# nobody had ever recorded what that list looks like when the overlay WORKS.
# An hour went into arguing about a node that may have been there all along.
#
# A snapshot costs a second. Take one while things work and the next occurrence
# is a diff instead of an argument.
#
# WHAT IT RECORDS
#
#   - every keyboard, mouse and HID-class device node, with Status and the
#     Windows problem code
#   - the Corsair/virtual bus nodes specifically, because a synthetic device
#     presenting as a keyboard is the shape that has bitten this install twice
#   - CET's overlay bind, decoded, so a poisoned bind is visible without a
#     second tool
#   - which keys Windows currently reports held - a ONE-SHOT sample, never a
#     loop, because a continuous sweep records the user typing
#
# Written to the same place install snapshots go:
#   %USERPROFILE%\Saved Games\CD Projekt Red\Cyberpunk 2077\Cyberwise\input\
# ============================================================================

param(
    # NOT $PSScriptRoot-derived and NOT defaulted here on purpose: on Windows
    # PowerShell 5.1 a param default cannot see $PSScriptRoot when the script is
    # run with -File or dot-sourced. Defaults are resolved in the body below.
    [string] $Dir,
    [string] $Label,
    [string] $GameRoot,
    [switch] $List,
    [int]    $Keep = 30
)

$ErrorActionPreference = 'Stop'

# --- upstream guard ---------------------------------------------------------
$cwGuard = Join-Path $PSScriptRoot '..\..\cyberwise\tools\UpstreamGuard.ps1'
if (Test-Path -LiteralPath $cwGuard) { try { . $cwGuard; Invoke-CwStartupGuard } catch { } }

function Get-InputSnapshotDir {
    param([string] $Override)
    if ($Override) { $d = $Override }
    else { $d = Join-Path $env:USERPROFILE 'Saved Games\CD Projekt Red\Cyberpunk 2077\Cyberwise\input' }
    if (-not (Test-Path -LiteralPath $d)) { New-Item -ItemType Directory -Path $d -Force | Out-Null }
    return (Resolve-Path -LiteralPath $d).Path
}

$dir = Get-InputSnapshotDir -Override $Dir

if ($List) {
    Get-ChildItem $dir -Filter '*.json' | Sort-Object Name -Descending | ForEach-Object {
        $j = Get-Content $_.FullName -Raw | ConvertFrom-Json
        '{0,-22} {1,-28} keyboards={2} ghosts={3}' -f $_.BaseName, $j.label, $j.keyboardCount, $j.ghostCount
    }
    return
}

# --- device inventory -------------------------------------------------------
function Get-Nodes {
    param([string] $Class)
    $out = @()
    Get-PnpDevice -Class $Class -ErrorAction SilentlyContinue | ForEach-Object {
        $p = $null
        try { $p = (Get-PnpDeviceProperty -InstanceId $_.InstanceId -KeyName DEVPKEY_Device_ProblemCode -ErrorAction Stop).Data } catch { }
        $parent = $null
        try { $parent = (Get-PnpDeviceProperty -InstanceId $_.InstanceId -KeyName DEVPKEY_Device_Parent -ErrorAction Stop).Data } catch { }
        $out += [pscustomobject]@{
            status      = $_.Status
            problem     = $p
            name        = $_.FriendlyName
            instanceId  = $_.InstanceId
            parent      = $parent
        }
    }
    return ,($out | Sort-Object instanceId)
}

$keyboards = Get-Nodes -Class 'Keyboard'
$mice      = Get-Nodes -Class 'Mouse'
$hid       = Get-Nodes -Class 'HIDClass'

# NOT-OK IS THE NORMAL CASE, and the first run of this tool proved it: 29 nodes
# were not OK and 28 of them were simply unplugged peripherals - an Apple
# trackpad, an Apple keyboard, an HP headset. Windows keeps a node for anything
# it has ever seen. Counting those finds a "problem" on every healthy machine.
#
# The shape that actually means something is a HALF-ENUMERATED composite: a node
# that is not OK while another node sharing its instance-ID stem IS present and
# OK. A wholly absent device is a device you unplugged; a device half here and
# half not is a device that failed partway through enumerating, which is the
# signature behind both CET overlay failures on this install.
$all = @($keyboards) + @($mice) + @($hid)
$okStems = New-Object 'System.Collections.Generic.HashSet[string]'
foreach ($n in $all) {
    if ($n.status -eq 'OK' -and $n.instanceId) {
        # stem = instance id up to the collection/interface suffix.
        # -split takes a REGEX, so a literal backslash is '\\'; -join takes a
        # plain string, so it is a single '\'. Getting these two the same way
        # round is what broke the first cut of this file.
        $stem = ($n.instanceId -split '\\')[0..1] -join '\'
        [void]$okStems.Add(($stem -replace '&COL\d+$','' -replace '&MI_\d+$',''))
    }
}
$ghosts = @()        # half-enumerated only
$absent = @()        # merely unplugged - recorded, not alarming
foreach ($n in $all) {
    if ($n.status -eq 'OK') { continue }
    $stem = ($n.instanceId -split '\\')[0..1] -join '\'
    $stem = ($stem -replace '&COL\d+$','' -replace '&MI_\d+$','')
    if ($okStems.Contains($stem)) { $ghosts += $n } else { $absent += $n }
}

# --- CET overlay bind, decoded ---------------------------------------------
$cet = [pscustomobject]@{ found = $false; raw = $null; slots = @(); note = $null }

# FIND THE INSTALL, DO NOT ASSUME IT. An earlier cut of this file hardcoded the
# author's own drive, which the family test caught: a path that works on one
# machine is a tool that works on one machine. Steam records its libraries, so
# ask it.
function Get-CpGameRoot {
    param([string] $Override)
    if ($Override -and (Test-Path -LiteralPath (Join-Path $Override 'bin\x64\Cyberpunk2077.exe'))) { return $Override }
    $seen = New-Object 'System.Collections.Generic.List[string]'
    foreach ($rk in 'HKLM:\SOFTWARE\WOW6432Node\Valve\Steam','HKLM:\SOFTWARE\Valve\Steam','HKCU:\SOFTWARE\Valve\Steam') {
        $steam = $null
        try { $steam = (Get-ItemProperty -Path $rk -ErrorAction Stop).InstallPath } catch { }
        if (-not $steam) { continue }
        $seen.Add((Join-Path $steam 'steamapps\common\Cyberpunk 2077'))
        $vdf = Join-Path $steam 'steamapps\libraryfolders.vdf'
        if (Test-Path -LiteralPath $vdf) {
            foreach ($m in ([regex]'"path"\s+"([^"]+)"').Matches((Get-Content $vdf -Raw))) {
                $seen.Add((Join-Path ($m.Groups[1].Value -replace '\\\\','\') 'steamapps\common\Cyberpunk 2077'))
            }
        }
    }
    foreach ($p in $seen) {
        if (Test-Path -LiteralPath (Join-Path $p 'bin\x64\Cyberpunk2077.exe')) { return $p }
    }
    return $null
}

$gameRoot = Get-CpGameRoot -Override $GameRoot
$bindPathCandidates = @()
if ($gameRoot) {
    $bindPathCandidates += (Join-Path $gameRoot 'bin\x64\plugins\cyber_engine_tweaks\bindings.json')
}
foreach ($bp in $bindPathCandidates) {
    if ($bp -and (Test-Path -LiteralPath $bp)) {
        try {
            $b = Get-Content $bp -Raw | ConvertFrom-Json
            $v = [int64]$b.cet.overlay_key
            $slots = @(($v -shr 48) -band 0xFFFF, ($v -shr 32) -band 0xFFFF, ($v -shr 16) -band 0xFFFF, $v -band 0xFFFF)
            $note = if ($slots[0] -eq 255) { 'POISONED: HID filler 255 in first slot' }
                    elseif ($v -eq 0)      { 'UNBOUND: CET will force first-time setup' }
                    else                   { 'ok' }
            $cet = [pscustomobject]@{ found = $true; raw = $v; slots = $slots; note = $note }
        } catch { }
        break
    }
}

# --- one-shot held-key sample ----------------------------------------------
# ONE sample, deliberately. A polling loop over all 254 keys records whatever
# the user types, which is both useless and a privacy problem.
Add-Type -Namespace CwInput -Name Keys -MemberDefinition '[DllImport("user32.dll")] public static extern short GetAsyncKeyState(int vKey);' -ErrorAction SilentlyContinue
$held = @()
foreach ($vk in 1..254) {
    if ((([CwInput.Keys]::GetAsyncKeyState($vk)) -band 0x8000) -ne 0) { $held += $vk }
}

$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$snap = [pscustomobject]@{
    taken         = (Get-Date).ToString('o')
    label         = $Label
    overlayWorks  = $null   # set by hand, or by -Label 'working' / 'broken'
    keyboardCount = $keyboards.Count
    ghostCount    = $ghosts.Count
    keyboards     = $keyboards
    mice          = $mice
    hidNotOk      = @($hid | Where-Object { $_.status -ne 'OK' })
    ghosts        = $ghosts
    absentDevices = $absent
    cetOverlayKey = $cet
    keysHeldNow   = $held
}

$path = Join-Path $dir "$stamp.json"
# 5.1 has no -Encoding utf8NoBOM, and -Encoding UTF8 writes a BOM. .NET also has
# its own working directory, so the path must be absolute before it gets here.
[System.IO.File]::WriteAllText($path, ($snap | ConvertTo-Json -Depth 6), (New-Object System.Text.UTF8Encoding($false)))

# prune
Get-ChildItem $dir -Filter '*.json' | Sort-Object Name -Descending | Select-Object -Skip $Keep | Remove-Item -Force -ErrorAction SilentlyContinue

'input snapshot: {0}' -f $path
'  keyboards {0}, HALF-ENUMERATED {1}, merely-unplugged {2}' -f $keyboards.Count, $ghosts.Count, $absent.Count
if ($cet.found) { '  CET overlay bind: slots {0} - {1}' -f ($cet.slots -join ','), $cet.note }
if ($held.Count) { '  KEYS HELD RIGHT NOW: {0}' -f ($held -join ',') } else { '  no keys held' }
foreach ($g in $ghosts) { '  HALF-ENUMERATED: {0,-9} {1,-34} {2}' -f $g.status, $g.name, $g.instanceId }
if (-not $ghosts.Count) { '  no half-enumerated devices' }
