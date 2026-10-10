# New-SystemProfile.ps1 -- a deterministic profile of a modded Cyberpunk 2077
# install, as Discord-pasteable markdown, an HTML report, and an OKF wiki article.
#
#     .\New-SystemProfile.ps1                      # auto-detect, write both
#     .\New-SystemProfile.ps1 -GameRoot 'D:\...' -Md prof.md -Html prof.html
#     .\New-SystemProfile.ps1 -GameRoot 'D:\...' -Wiki    # + the wiki article
#
# ---------------------------------------------------------------------------
# The wiki article (-Wiki), and why it is allowed to clobber
# ---------------------------------------------------------------------------
#
# -Wiki writes an OKF 0.2 article - `machine.md` - into the USER bundle beside
# the game's own records. Every user should have one: without it, each fresh
# session rediscovers the hardware from scratch, and the sessions that do not
# bother reason about a machine they have never measured.
#
# It is USER-ONLY and the tool refuses to write it into the shipping base wiki.
# Nothing here is knowledge about the game; it is a description of one person's
# machine, and it carries their paths unredacted because it never leaves it.
#
# **Re-running OVERWRITES the article, and that is correct.** The no-clobber
# rule that protects a hand-deepened mod article (New-ModStubs.ps1 skips what
# already exists) does not apply to a file whose every line is derived from the
# machine: a merged machine profile would be half measurement and half memory,
# with nothing marking which half. The article says so in its own header, so a
# later session does not "protect" a stale profile out of the wrong instinct.
#
# ---------------------------------------------------------------------------
# Scope: only stats that change a diagnosis
# ---------------------------------------------------------------------------
#
# This is deliberately NOT a full system dump. Every field here exists because
# it has explained a real modding failure - "your 8K texture pack is thrashing
# 6 GB of VRAM", "your framework is a patch behind so every .reds mod is off",
# "40 archives are missing from your load order". Motherboard model and audio
# devices explain nothing about a mod, so they are not collected.
#
# The FLAGS section at the top is the point of the tool. Everything below it is
# the evidence for those flags. Someone pasting this into a help channel should
# get a useful answer from the first six lines.
#
# ---------------------------------------------------------------------------
# Deterministic
# ---------------------------------------------------------------------------
#
# Same install, same output: fixed section order, sorted enumerations, no
# hardware ordering left to WMI's whim. Two runs either side of a change should
# diff cleanly - only the timestamp and what actually changed.
#
# ---------------------------------------------------------------------------
# Traps worth knowing, since both cost real time
# ---------------------------------------------------------------------------
#
#   * Win32_VideoController.AdapterRAM is a uint32 and SATURATES AT 4 GB. Every
#     card above 4 GB reports exactly 4294967295. Read
#     HardwareInformation.qwMemorySize from the display class registry key
#     instead - it is a QWORD and reports the truth.
#   * Discord does NOT render markdown tables. Pipes-and-dashes turn into
#     unreadable line noise in the one place this file is meant to be pasted.
#     The markdown output uses fenced code blocks with aligned columns, which
#     render identically everywhere.

[CmdletBinding()]
param(
    [string] $GameRoot,
    [string] $Md   = "$env:USERPROFILE\Saved Games\CD Projekt Red\Cyberpunk 2077\Cyberwise\reports\cp2077-system-profile.md",
    [string] $Html = "$env:USERPROFILE\Saved Games\CD Projekt Red\Cyberpunk 2077\Cyberwise\reports\cp2077-system-profile.html",
    [switch] $NoHtml,

    # Also write the OKF machine-profile article into the user's wiki bundle.
    # -WikiPath on its own implies -Wiki, so nobody points the path somewhere
    # deliberate and then gets nothing because they forgot the switch.
    [switch] $Wiki,
    [string] $WikiPath = (Join-Path $env:USERPROFILE 'Saved Games\CD Projekt Red\Cyberpunk 2077\Cyberwise\wiki\machine.md'),

    # Every type size in the HTML derives from one base, so this moves the whole
    # report together. Size it for the window it will be read in - see
    # Show-ViewportProbe.ps1 and references/report-design.md.
    [double] $Scale = 1.0,

    # Paths and machine identity are stripped by default, because the whole
    # point of the markdown output is that it gets pasted somewhere public.
    [switch] $NoRedact
)

# --- upstream guard ---------------------------------------------------------
# Advisory, and only that: silent while this copy matches what shipped, one
# short line when it does not, and it never blocks or changes an exit code.
# Rationale, and why it is deliberately not a PreToolUse hook: UpstreamGuard.ps1.
$cwGuard = Join-Path $PSScriptRoot '..\..\cyberwise\tools\UpstreamGuard.ps1'
if (Test-Path -LiteralPath $cwGuard) { try { . $cwGuard; Invoke-CwStartupGuard } catch { } }


$ErrorActionPreference = 'Stop'
$PSDefaultParameterValues['*:ErrorAction'] = 'SilentlyContinue'

if ($PSBoundParameters.ContainsKey('WikiPath')) { $Wiki = $true }

# ================================================================== helpers ==

function Get-GameRootAuto {
    <#
        Steam, GOG and Epic in that order, then a plain guess. Returns $null
        rather than a wrong path - a profile of the wrong directory is worse
        than no profile.
    #>
    $seen = [System.Collections.Generic.List[string]]::new()

    # Steam: read the library folders file rather than assuming C:\Program Files.
    $steam = (Get-ItemProperty 'HKLM:\SOFTWARE\WOW6432Node\Valve\Steam' -Name InstallPath).InstallPath
    if (-not $steam) { $steam = (Get-ItemProperty 'HKCU:\SOFTWARE\Valve\Steam' -Name SteamPath).SteamPath }
    if ($steam) {
        $vdf = Join-Path $steam 'steamapps\libraryfolders.vdf'
        if (Test-Path -LiteralPath $vdf) {
            foreach ($m in [regex]::Matches((Get-Content -LiteralPath $vdf -Raw), '"path"\s+"([^"]+)"')) {
                $seen.Add((Join-Path ($m.Groups[1].Value -replace '\\\\','\') 'steamapps\common\Cyberpunk 2077'))
            }
        }
        $seen.Add((Join-Path $steam 'steamapps\common\Cyberpunk 2077'))
    }

    # GOG registry, any product id.
    foreach ($k in (Get-ChildItem 'HKLM:\SOFTWARE\WOW6432Node\GOG.com\Games')) {
        $p = (Get-ItemProperty $k.PSPath -Name path).path
        if ($p -and (Test-Path -LiteralPath (Join-Path $p 'bin\x64\Cyberpunk2077.exe'))) { $seen.Add($p) }
    }

    # Epic ships a manifest per install.
    foreach ($f in (Get-ChildItem 'C:\ProgramData\Epic\EpicGamesLauncher\Data\Manifests' -Filter *.item)) {
        $j = Get-Content -LiteralPath $f.FullName -Raw | ConvertFrom-Json
        if ($j.DisplayName -match 'Cyberpunk' -and $j.InstallLocation) { $seen.Add($j.InstallLocation) }
    }

    foreach ($p in $seen) {
        if ($p -and (Test-Path -LiteralPath (Join-Path $p 'bin\x64\Cyberpunk2077.exe'))) { return $p }
    }
    return $null
}

if (-not $GameRoot) { $GameRoot = Get-GameRootAuto }
if (-not $GameRoot -or -not (Test-Path -LiteralPath (Join-Path $GameRoot 'bin\x64\Cyberpunk2077.exe'))) {
    throw "Could not locate a Cyberpunk 2077 install. Pass -GameRoot 'X:\path\to\Cyberpunk 2077'."
}
$GameRoot = (Resolve-Path -LiteralPath $GameRoot).Path

# For measured quantities - free space, pagefile, total archive size - where the
# exact figure is the point.
function GB { param([double]$bytes) if ($bytes -le 0) { '?' } else { '{0:N1} GB' -f ($bytes / 1GB) } }

# For INSTALLED CAPACITY - system RAM and VRAM - where the exact figure is noise.
# Windows reports RAM the OS can address, not what is in the slots: a 64 GB
# machine reports 61.6 GB because firmware and integrated graphics reserve the
# rest, and a 32 GB card reports 31.8. Printing those raw invites "why does it
# say 61.6, did a stick fail?" - a question about the reporting, not the machine.
# Snap to the nearest real capacity people actually buy, and only when the value
# is close enough that the snap is safe; anything else rounds normally, so a
# genuinely odd configuration still shows as odd.
$stdCapacity = 1,2,3,4,6,8,10,11,12,16,20,24,32,40,48,64,80,96,128,192,256
function Cap {
    param([double]$bytes)
    if ($bytes -le 0) { return '?' }
    $g = $bytes / 1GB
    foreach ($s in $stdCapacity) { if ($g -le $s -and $g -ge $s * 0.88) { return "$s GB" } }
    return '{0:N0} GB' -f $g
}
function Ver {
    param([string]$relPath)
    $p = Join-Path $GameRoot $relPath
    if (-not (Test-Path -LiteralPath $p)) { return $null }
    $v = (Get-Item -LiteralPath $p).VersionInfo.ProductVersion
    if (-not $v) { $v = (Get-Item -LiteralPath $p).VersionInfo.FileVersion }
    if ($v) { ($v -split '\+')[0].Trim() } else { 'present' }
}
function CountIn {
    param([string]$rel, [string]$filter, [switch]$Recurse, [switch]$Directory)
    $p = Join-Path $GameRoot $rel
    if (-not (Test-Path -LiteralPath $p)) { return 0 }
    @(Get-ChildItem -LiteralPath $p -Filter $filter -Recurse:$Recurse -Directory:$Directory -File:(-not $Directory)).Count
}

# ================================================================= hardware ==

$cs   = Get-CimInstance Win32_ComputerSystem
$os   = Get-CimInstance Win32_OperatingSystem
$cpu  = @(Get-CimInstance Win32_Processor | Sort-Object DeviceID)[0]

# Pick the adapter the game will actually run on: the one with the most VRAM.
#
# Name and VRAM must come from the SAME registry entry. Reading the name from
# Win32_VideoController and the VRAM separately pairs them wrong the moment a
# machine has more than one adapter - and plenty do: an APU's integrated
# graphics alongside a discrete card, or a USB display adapter. On one test
# machine that mismatch reported a 32 GB integrated GPU that does not exist.
#
# The VRAM has to come from the registry QWORD because
# Win32_VideoController.AdapterRAM is a uint32 and saturates: an RTX 5090 with
# 32 GB reports 4293918720 there, which is where a "4 GB" misdiagnosis comes
# from.
$adapters = foreach ($k in (Get-ChildItem 'HKLM:\SYSTEM\CurrentControlSet\Control\Class\{4d36e968-e325-11ce-bfc1-08002be10318}' |
                            Where-Object { $_.PSChildName -match '^\d{4}$' } | Sort-Object PSChildName)) {
    $p = Get-ItemProperty $k.PSPath
    if ($p.DriverDesc) {
        [pscustomobject]@{ Name = [string]$p.DriverDesc; VRam = [long]($p.'HardwareInformation.qwMemorySize') }
    }
}
# Sort by VRAM then name so a tie resolves the same way on every run.
$gpu       = @($adapters | Sort-Object @{E='VRam';Descending=$true}, Name)[0]
$gpuName   = if ($gpu) { $gpu.Name } else { 'unknown' }
$vram      = if ($gpu) { $gpu.VRam } else { 0L }
$gpuDriver = (Get-CimInstance Win32_VideoController | Where-Object { $_.Name -eq $gpuName } | Select-Object -First 1).DriverVersion
if (-not $gpuDriver) { $gpuDriver = '?' }

# NVIDIA's Windows driver version is not the version anybody says out loud. WMI
# reports 32.0.16.1088; the driver everyone - the GeForce app, a mod page's
# requirements, a forum thread - calls 610.88 is the LAST FIVE DIGITS of that,
# with a decimal point three in. Reporting only the WMI form makes the profile
# impossible to compare against the one number a user can actually check, so
# print both and never silently substitute one for the other.
$gpuDriverShown = $gpuDriver
if ($gpuName -match '(?i)nvidia' -and $gpuDriver -match '^\d+\.\d+\.\d+\.\d+$') {
    $digits = ($gpuDriver -replace '\.', '')
    if ($digits.Length -ge 5) {
        $tail = $digits.Substring($digits.Length - 5)
        $gpuDriverShown = "$($tail.Substring(0,3)).$($tail.Substring(3)) ($gpuDriver)"
    }
}
$ramBytes  = [long]$cs.TotalPhysicalMemory

# Pagefile. A small fixed pagefile is a recurring cause of late-load crashes on
# heavily modded installs, and it is invisible unless you go looking.
$pfAuto  = [bool]$cs.AutomaticManagedPagefile
$pfBytes = 0L
foreach ($pf in @(Get-CimInstance Win32_PageFileUsage | Sort-Object Name)) { $pfBytes += ([long]$pf.AllocatedBaseSize * 1MB) }

# Game drive: type and free space.
$letter   = $GameRoot.Substring(0,1)
$vol      = Get-Volume -DriveLetter $letter
$freeBytes= if ($vol) { [long]$vol.SizeRemaining } else { 0 }
$media    = 'unknown'
$part = Get-Partition -DriveLetter $letter
if ($part) {
    $pd = Get-Disk -Number $part.DiskNumber | Get-PhysicalDisk
    if ($pd) {
        $media = "$($pd.MediaType)"
        if ($pd.BusType -eq 'NVMe') { $media = 'NVMe SSD' }
        elseif ($media -eq 'SSD')   { $media = 'SSD' }
        elseif ($media -eq 'HDD')   { $media = 'HDD' }
    }
}

# ===================================================================== game ==

$exeInfo  = (Get-Item -LiteralPath (Join-Path $GameRoot 'bin\x64\Cyberpunk2077.exe')).VersionInfo
$gameVer  = if ($exeInfo.ProductVersion) { ($exeInfo.ProductVersion -split '\+')[0].Trim() } else { 'unknown' }

$store = 'unknown'
if (Test-Path -LiteralPath (Join-Path $GameRoot 'bin\x64\steam_api64.dll'))            { $store = 'Steam' }
elseif (@(Get-ChildItem -LiteralPath $GameRoot -Filter 'goggame-*.info').Count -gt 0)  { $store = 'GOG' }
elseif (Test-Path -LiteralPath (Join-Path $GameRoot '.egstore'))                       { $store = 'Epic' }

# Mod manager. Detection is best-effort and says so - an MO2 install can look
# almost empty with the game closed, so absence of files proves nothing.
$manager = 'manual / unknown'
if (Get-ChildItem -LiteralPath $GameRoot -Recurse -Depth 3 -Filter '__folder_managed_by_vortex') { $manager = 'Vortex' }
elseif (Test-Path -LiteralPath (Join-Path $GameRoot 'usvfs_x64.dll')) { $manager = 'MO2 (USVFS)' }

# =============================================================== frameworks ==

# Ordered deliberately: load-bearing runtimes first, then content frameworks.
$frameworks = [ordered]@{
    'RED4ext'     = Ver 'red4ext\RED4ext.dll'
    'CET'         = Ver 'bin\x64\plugins\cyber_engine_tweaks.asi'
    'redscript'   = Ver 'engine\tools\scc.exe'
    'ArchiveXL'   = Ver 'red4ext\plugins\ArchiveXL\ArchiveXL.dll'
    'TweakXL'     = Ver 'red4ext\plugins\TweakXL\TweakXL.dll'
    'Codeware'    = Ver 'red4ext\plugins\Codeware\Codeware.dll'
    'ModSettings' = Ver 'red4ext\plugins\mod_settings\mod_settings.dll'
    'ReShade'     = Ver 'bin\x64\dxgi.dll'
}

# ============================================================== mod payload ==

$archDir  = Join-Path $GameRoot 'archive\pc\mod'
$archives = @(Get-ChildItem -LiteralPath $archDir -Filter *.archive -File | Sort-Object Name)
$archBytes= ($archives | Measure-Object Length -Sum).Sum
if (-not $archBytes) { $archBytes = 0 }

$payload = [ordered]@{
    'archives'   = $archives.Count
    'REDmods'    = CountIn 'mods' '*' -Directory
    '.reds'      = CountIn 'r6\scripts' '*.reds' -Recurse
    'CET mods'   = CountIn 'bin\x64\plugins\cyber_engine_tweaks\mods' '*' -Directory
    '.asi'       = CountIn 'bin\x64\plugins' '*.asi'
    'tweaks'     = (CountIn 'r6\tweaks' '*.yaml' -Recurse) + (CountIn 'r6\tweaks' '*.yml' -Recurse)
    '.xl'        = CountIn 'archive\pc\mod' '*.xl'
}

# =============================================================== load order ==

$modlist   = Join-Path $archDir 'modlist.txt'
$hasList   = Test-Path -LiteralPath $modlist
$listed    = @()
if ($hasList) {
    # NO COMMENT STRIPPING. modlist.txt has no comment syntax - every non-blank
    # line is an archive filename - and '#' is a legitimate LEADING CHARACTER in
    # those filenames, used by mods to sort themselves early. Treating '#' as a
    # comment marker silently discarded 61 real entries on the install this was
    # written against and reported all 61 as "on disk but unlisted", which reads
    # as a serious load-order fault and is entirely fabricated.
    $listed = @(Get-Content -LiteralPath $modlist |
        ForEach-Object { $_.Trim() } |
        Where-Object { $_ })
}
$onDisk    = @($archives | ForEach-Object { $_.Name })
$unlisted  = @($onDisk | Where-Object { $listed -notcontains $_ })
$missing   = @($listed | Where-Object { $onDisk -notcontains $_ })

# ===================================================================== logs ==

# One line of truth per framework: is it running, and did it last succeed?
$redscriptState = 'not installed'
$rlog = Join-Path $GameRoot 'r6\logs\redscript_rCURRENT.log'
if (Test-Path -LiteralPath $rlog) {
    $txt = Get-Content -LiteralPath $rlog -Raw
    $redscriptState =
        if     ($txt -match '(?i)compilation failed|failed to compile') { 'FAILED to compile' }
        elseif ($txt -match '(?i)successfully compiled|compilation complete') { 'compiled OK' }
        else { 'ran, result unclear' }
}

$xlErrors = 0
$xlog = Join-Path $GameRoot 'red4ext\logs\archivexl.log'
if (Test-Path -LiteralPath $xlog) { $xlErrors = @(Select-String -LiteralPath $xlog -Pattern '\[error\]' -AllMatches).Count }

# ==================================================================== flags ==
#
# Each flag names the symptom AND the reason, because "you have 6 GB of VRAM" is
# not advice. Ordered by how likely it is to be the actual problem.

$flags = [System.Collections.Generic.List[object]]::new()

# A flag that names a count should be able to name the things it counted -
# "60 archives are unlisted" is unactionable until you know which 60, and
# seeing the list is also how a wrong flag gets caught.
function Add-Flag {
    param([string]$Text, [string[]]$Items = @(), [ValidateSet('warn','info')][string]$Level = 'warn')
    $flags.Add([pscustomobject]@{ Text = $Text; Items = @($Items | Sort-Object); Level = $Level })
}

if ($vram -gt 0 -and $archBytes -gt 0) {
    $vramGB = $vram / 1GB
    $arcGB  = $archBytes / 1GB
    if ($vramGB -lt 8 -and $arcGB -gt 15) {
        Add-Flag "**VRAM $([math]::Round($vramGB)) GB against $([math]::Round($arcGB)) GB of archives.** High-res texture packs do not stream gracefully once VRAM is exhausted - expect stutter, muddy textures that never sharpen, or hard crashes in dense areas. This is the first thing to suspect with 4K/8K retextures."
    } elseif ($vramGB -lt 12 -and $arcGB -gt 60) {
        Add-Flag "**$([math]::Round($arcGB)) GB of archives on $([math]::Round($vramGB)) GB of VRAM.** Workable, but you are near the edge; a single 8K pack can tip it. Suspect VRAM before load order if the symptom is stutter or blurry textures."
    }
}
if ($ramBytes -gt 0 -and $ramBytes -lt 16GB) {
    Add-Flag "**System RAM $(Cap $ramBytes).** A heavily modded install regularly exceeds this; the shortfall lands on the pagefile and shows up as stutter or out-of-memory crashes."
}
if (-not $pfAuto -and $pfBytes -gt 0 -and $pfBytes -lt 8GB) {
    Add-Flag "**Fixed pagefile of $(GB $pfBytes).** Modded CP2077 commits far more than it resident-uses. A small fixed pagefile produces crashes that look random and are not - let Windows manage it, or set 16 GB+."
} elseif ($pfBytes -eq 0) {
    Add-Flag '**No pagefile detected.** Modded CP2077 will crash under commit pressure. Enable a system-managed pagefile before diagnosing anything else.'
}
if ($media -eq 'HDD') {
    Add-Flag '**Game is on a mechanical drive.** CP2077 streams assets constantly; mods add more. Expect texture pop-in and long hitches that no load-order change will fix.'
}
if ($freeBytes -gt 0 -and $freeBytes -lt 20GB) {
    Add-Flag "**Only $(GB $freeBytes) free on the game drive.** Shader cache, logs and the pagefile all need room; low space causes failures that look like mod bugs."
}
if ($hasList -and $unlisted.Count -gt 0) {
    Add-Flag "**$($unlisted.Count) archive(s) on disk but absent from modlist.txt.** Unlisted archives sort last, so they lose every file they contest - installed, enabled, and quite possibly doing nothing. See references/load-order.md." -Items $unlisted
}
if ($missing.Count -gt 0) {
    # Informational, not a fault. Two entirely normal causes: a mod disabled on
    # purpose, whose line is correctly holding its slot for when it comes back;
    # and an archive written at runtime by an ASI plugin, which simply is not on
    # disk with the game closed. Only worth pruning on a genuine uninstall.
    Add-Flag "**$($missing.Count) modlist.txt entr(ies) with no file on disk.** Normal for a mod you disabled on purpose - the line holds its slot - and for archives an ASI writes at runtime. Only prune on a real uninstall." -Items $missing -Level info
}
if ($redscriptState -like 'FAILED*') {
    Add-Flag '**redscript failed to compile.** When this happens EVERY .reds mod on the install is silently off, with no in-game sign. Fix this before investigating any individual mod.'
}
if ($payload['.xl'] -gt 0 -and -not $frameworks['ArchiveXL']) {
    Add-Flag "**$($payload['.xl']) .xl file(s) present but ArchiveXL is not installed.** Those mods cannot work at all."
}
if ($payload['tweaks'] -gt 0 -and -not $frameworks['TweakXL']) {
    Add-Flag "**$($payload['tweaks']) tweak file(s) present but TweakXL is not installed.** Those edits are being ignored."
}
if ($payload['CET mods'] -gt 0 -and -not $frameworks['CET']) {
    Add-Flag "**$($payload['CET mods']) CET mod(s) present but Cyber Engine Tweaks is not installed.** None of them are running."
}
if ($xlErrors -gt 0) {
    Add-Flag "**$xlErrors error(s) in the ArchiveXL log.** Usually a mod referencing something the current patch moved or renamed."
}
if (-not $hasList -and $archives.Count -gt 1) {
    Add-Flag "**No modlist.txt.** The game falls back to alphabetical order, so filenames alone decide every conflict across $($archives.Count) archives."
}

# =================================================================== output ==

function Redact {
    <#
        The install path is more identifying than it looks - a non-default
        library folder is a fingerprint, and it can carry an account name. What
        a helper actually needs from it is the drive (for the SSD/HDD and free
        space questions), so keep that and drop the middle.
    #>
    param([string]$s)
    if ($NoRedact) { return $s }
    $s = $s -replace [regex]::Escape($env:USERPROFILE), '~'
    if ($env:USERNAME) { $s = $s -replace "(?i)\\$([regex]::Escape($env:USERNAME))\b", '\<user>' }
    $s = $s -replace '^([A-Za-z]:)\\.*\\([^\\]+)$', '$1\...\$2'
    return $s
}

$stamp   = Get-Date -Format 'yyyy-MM-dd HH:mm'
$rootOut = Redact $GameRoot

function Pad { param([string]$k, $v, [int]$w = 12) '{0} {1}' -f $k.PadRight($w), $v }

$machineLines = @(
    Pad 'CPU'    "$($cpu.Name.Trim()) ($($cpu.NumberOfCores)c/$($cpu.NumberOfLogicalProcessors)t)"
    Pad 'RAM'    (Cap $ramBytes)
    Pad 'GPU'    "$gpuName - $(if ($vram) { Cap $vram } else { 'VRAM unknown' }) - driver $gpuDriverShown"
    Pad 'OS'     "$($os.Caption -replace 'Microsoft ','') build $($os.BuildNumber)"
    Pad 'Pagefile' $(if ($pfAuto) { "system-managed ($(GB $pfBytes))" } else { "fixed $(GB $pfBytes)" })
    Pad 'Game drive' "$letter`: $media - $(GB $freeBytes) free"
)
$gameLines = @(
    Pad 'Version' "$gameVer ($store)"
    Pad 'Managed'  $manager
    Pad 'Archives' "$($archives.Count) - $(GB $archBytes)"
    Pad 'Load order' $(if ($hasList) { "modlist.txt - $($listed.Count) entries, $($unlisted.Count) unlisted, $($missing.Count) missing" } else { 'no modlist.txt (alphabetical)' })
    Pad 'redscript'  $redscriptState
)
$fwLines      = foreach ($k in $frameworks.Keys) { Pad $k ($(if ($frameworks[$k]) { $frameworks[$k] } else { '-' })) }
$payloadLines = foreach ($k in $payload.Keys)    { Pad $k $payload[$k] }

# ---- markdown (Discord) ----
# Fenced blocks, never tables: Discord does not render markdown tables.
#
# Items are listed inline but capped - Discord allows 2000 characters per
# message and a flag naming 60 archives would eat the whole budget on its own.
# The HTML has no such limit and lists everything.
$mdCap = 8
$mdFlags = if ($flags.Count) {
    (@($flags | ForEach-Object {
        $line = "- $($_.Text)"
        if ($_.Items.Count) {
            $shown = @($_.Items | Select-Object -First $mdCap)
            $line += "`n" + (($shown | ForEach-Object { "  - ``$_``" }) -join "`n")
            if ($_.Items.Count -gt $mdCap) { $line += "`n  - *...and $($_.Items.Count - $mdCap) more (see the HTML report)*" }
        }
        $line
    }) -join "`n")
} else {
    '- Nothing obviously wrong. If something is misbehaving it is specific to a mod, not the machine.'
}

$mdText = @"
**Cyberpunk 2077 - system profile**
``$stamp``

**Flags**
$mdFlags

**Machine**
``````
$($machineLines -join "`n")
``````

**Install**
``````
$($gameLines -join "`n")
``````

**Frameworks**
``````
$($fwLines -join "`n")
``````

**Mod payload**
``````
$($payloadLines -join "`n")
``````
"@

$dir = Split-Path -Parent $Md
if ($dir -and -not (Test-Path -LiteralPath $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
Set-Content -LiteralPath $Md -Value $mdText -Encoding UTF8

$chars = $mdText.Length
Write-Host "wrote $Md ($chars chars)" -ForegroundColor Green
# Over the cap a Discord message is not truncated - it is REFUSED, so a profile
# that quietly runs long is one the user cannot send at all. Say the number, and
# say what to do instead.
if ($chars -gt 2000) {
    Write-Warning ("This is $chars characters and Discord caps a message at 2000, so it will not send. " +
                   "Paste the Flags block on its own, or attach the file.")
}

# ---- html ----
if (-not $NoHtml) {
    # NOT named H: PowerShell resolves ALIASES BEFORE FUNCTIONS, and `h` is a
    # built-in alias for Get-History. A function called H is silently shadowed,
    # and the argument lands on Get-History's -Id parameter as a failed cast to
    # Int64. Single-letter helpers are a trap in PowerShell generally.
    function HtmlEsc { param([string]$s) ($s -replace '&','&amp;' -replace '<','&lt;' -replace '>','&gt;') }
    # Markdown bold survives into the flag text; render it rather than show it.
    function HtmlBold { param([string]$s) [regex]::Replace((HtmlEsc $s), '\*\*(.+?)\*\*', '<b>$1</b>') }

    # A flag that counted things can name them, behind a <details> so the list
    # never competes with the flag itself for attention. No script needed - the
    # element is its own disclosure widget.
    $flagHtml = if ($flags.Count) {
        (@($flags | ForEach-Object {
            $cls  = if ($_.Level -eq 'info') { ' class="info"' } else { '' }
            $body = HtmlBold $_.Text
            if ($_.Items.Count) {
                $lis  = (@($_.Items | ForEach-Object { "<li>$(HtmlEsc $_)</li>" }) -join '')
                $body += "<details><summary>show the $($_.Items.Count)</summary><ul class=""items"">$lis</ul></details>"
            }
            "<li$cls>$body</li>"
        }) -join '')
    } else {
        '<li class="ok">Nothing obviously wrong. If something is misbehaving it is specific to a mod, not the machine.</li>'
    }
    function Block { param([string[]]$lines) '<pre>' + (HtmlEsc ($lines -join "`n")) + '</pre>' }

    $htmlText = @"
<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Cyberpunk 2077 System Profile</title>
<style>
/* House style, same as every other artefact: one type base so -Scale moves the
   whole thing together, flex panels rather than a centred column, and no width
   cap - this gets read on whatever window the user actually has open.
   See references/report-design.md. */
:root{--yellow:#fcee0a;--cyan:#00f0ff;--red:#ff003c;--green:#39ff88;
  --bg:#07070a;--panel:#101018;--line:#26263a;--text:#e4e4ee;--dim:#8a8aa2;
  --mono:'Consolas','SF Mono','DejaVu Sans Mono',monospace;--sans:'Segoe UI',system-ui,sans-serif;
  --fs:__FS__px}
*{box-sizing:border-box}html,body{margin:0;padding:0}
body{background:var(--bg);color:var(--text);font-family:var(--sans);font-size:var(--fs);line-height:1.45;
  background-image:linear-gradient(rgba(252,238,10,.02) 1px,transparent 1px),
    linear-gradient(90deg,rgba(252,238,10,.02) 1px,transparent 1px);background-size:46px 46px}
.wrap{margin:0 auto;padding:0 22px 30px}
header{position:relative;padding:18px 0 11px;border-bottom:1px solid var(--line);overflow:hidden}
header::after{content:'';position:absolute;inset:0;pointer-events:none;
  background:repeating-linear-gradient(0deg,rgba(0,0,0,.34) 0 1px,transparent 1px 3px)}
h1{font-family:var(--mono);font-size:calc(var(--fs)*1.7);margin:0;letter-spacing:.08em;
  text-transform:uppercase;color:var(--yellow);text-shadow:2px 0 var(--red),-2px 0 var(--cyan)}
h1 span{color:var(--text);text-shadow:none}
.sub{font-family:var(--mono);font-size:calc(var(--fs)*.56);letter-spacing:.14em;color:var(--dim);margin-top:7px}
h2{font-family:var(--mono);font-size:calc(var(--fs)*.6);letter-spacing:.2em;text-transform:uppercase;color:var(--cyan);
  margin:0 0 9px;padding-bottom:7px;border-bottom:1px solid var(--line)}
/* Flags full width - they are the answer. Evidence panels share a flex row. */
section{margin-top:16px}
.cols{display:flex;flex-wrap:wrap;align-items:flex-start;gap:14px;margin-top:16px}
/* Panels size to their own content rather than taking an equal share. These
   hold aligned monospace tables of very different widths - the machine block
   carries a full GPU name and driver string, the payload block carries
   two-digit counts - so an equal split clipped the widest one behind its own
   scrollbar while the narrowest sat half empty. flex-basis:auto uses the
   intrinsic width; min-width:0 still lets them shrink on a narrow window. */
.col{flex:1 1 auto;min-width:0}
.col pre{width:100%}
ul{list-style:none;padding:0;margin:0}
li{background:var(--panel);border:1px solid var(--line);border-left:3px solid var(--red);
  padding:11px 15px;margin-bottom:9px;font-size:calc(var(--fs)*.8);line-height:1.4}
li.ok{border-left-color:var(--green);color:var(--dim)}
li.info{border-left-color:var(--cyan)}
li b{color:var(--yellow);font-weight:600}
/* <details> is its own disclosure widget - no script, works offline. */
details{margin-top:9px}
summary{cursor:pointer;font-family:var(--mono);font-size:calc(var(--fs)*.55);letter-spacing:.1em;
  text-transform:uppercase;color:var(--cyan);width:fit-content}
summary:hover{color:var(--yellow)}
ul.items{margin-top:9px;columns:280px;column-gap:20px}
ul.items li{background:none;border:0;border-left:2px solid var(--line);margin:0 0 3px;
  padding:1px 0 1px 10px;font-family:var(--mono);font-size:calc(var(--fs)*.56);
  color:#a8a8bd;break-inside:avoid;word-break:break-all}
pre{background:var(--panel);border:1px solid var(--line);padding:13px 16px;margin:0;
  font-family:var(--mono);font-size:calc(var(--fs)*.6);color:#c8c8da;overflow-x:auto}
footer{margin-top:20px;padding-top:12px;border-top:1px solid var(--line);
  font-family:var(--mono);font-size:calc(var(--fs)*.5);color:#4c4c60;
  display:flex;flex-wrap:wrap;gap:8px 30px}
footer span:last-child{margin-left:auto}
</style></head><body><div class="wrap">
<header><h1>System <span>Profile</span></h1>
<div class="sub">CYBERPUNK 2077 $(HtmlEsc $gameVer) &nbsp;//&nbsp; $(HtmlEsc $store) &nbsp;//&nbsp; $(HtmlEsc $manager) &nbsp;//&nbsp; $stamp</div></header>
<section><h2>Flags</h2><ul>$flagHtml</ul></section>
<div class="cols">
  <div class="col"><h2>Machine</h2>$(Block $machineLines)</div>
  <div class="col"><h2>Install</h2>$(Block $gameLines)</div>
  <div class="col"><h2>Frameworks</h2>$(Block $fwLines)</div>
  <div class="col"><h2>Mod payload</h2>$(Block $payloadLines)</div>
</div>
<footer><span>$(HtmlEsc $rootOut)</span><span>Only fields that change a diagnosis are collected</span><span>Generated $stamp // CYBERWISE</span></footer>
</div></body></html>
"@
    $htmlText = $htmlText.Replace('__FS__', [string][math]::Round(22 * $Scale, 1))
    $hdir = Split-Path -Parent $Html
    if ($hdir -and -not (Test-Path -LiteralPath $hdir)) { New-Item -ItemType Directory -Path $hdir -Force | Out-Null }
    Set-Content -LiteralPath $Html -Value $htmlText -Encoding UTF8
    Write-Host "wrote $Html" -ForegroundColor Green
}

# ---- OKF wiki article ----
#
# Why this output exists at all: the numbers above answer "what is this machine"
# for the person reading the report right now. The article answers it for the
# NEXT session, which otherwise starts by guessing - and guessing about VRAM is
# exactly how a wrong figure gets into a crash diagnosis.
if ($Wiki) {

    # ---- the boundary, enforced twice ------------------------------------
    #
    # This article is a description of one machine. It is user-only by nature
    # and must never reach the bundle that ships. Location IS the boundary
    # (see cyberwise-wiki), so it is checked here rather than trusted to the
    # caller: Test-Wiki.ps1 -Base would catch a leak, but only if somebody runs
    # it before committing, and "somebody will notice" is not a boundary.
    #
    # Two checks, because either alone has a hole. The path check catches the
    # obvious mistake (-WikiPath pointed into the repo) but not a copy of the
    # base bundle living somewhere else; the marker check reads the bundle's own
    # index.md and catches that one wherever it sits.
    $wikiFull = [System.IO.Path]::GetFullPath($WikiPath)
    if ($wikiFull -match '(?i)[\\/]skills[\\/]cyberwise-wiki[\\/]') {
        throw ("Refusing to write a machine profile into the base wiki: $wikiFull`n" +
               'A machine profile describes one person''s hardware, so it is user-only and never ships. ' +
               'Point -WikiPath at the user bundle beside the game''s own records.')
    }
    $wikiDir = Split-Path -Parent $wikiFull
    foreach ($probe in @($wikiDir, (Split-Path -Parent $wikiDir))) {
        if (-not $probe) { continue }
        $idx = Join-Path $probe 'index.md'
        if ((Test-Path -LiteralPath $idx) -and
            ((Get-Content -LiteralPath $idx -Raw) -match '(?i)This bundle ships|base wiki')) {
            throw ("Refusing to write a machine profile into $wikiFull - $idx declares this the SHIPPING base bundle.`n" +
                   'A machine profile is user-only. Point -WikiPath at the user bundle beside the game''s own records.')
        }
    }

    # ISO 8601 with an explicit offset. A bare local timestamp is the single
    # most common OKF fault and it is silent - two articles written an ocean
    # apart sort into a false order and nothing complains.
    $okfStamp = (Get-Date).ToString('yyyy-MM-ddTHH:mm:sszzz')
    $today    = (Get-Date).ToString('yyyy-MM-dd')
    $bt       = [char]0x60      # backtick: PowerShell's escape char, so never typed raw

    $vramGB = if ($vram -gt 0) { $vram / 1GB } else { 0 }
    $ramGB  = $ramBytes / 1GB
    $cores  = [int]$cpu.NumberOfCores

    # Every other adapter in the machine, named so that a later reading of a
    # per-adapter number can be checked against the right one. This is not
    # trivia: index 0 of the display class key on the machine this was written
    # for is an integrated AMD adapter, and reading it produced "2 GB".
    # Compared by REFERENCE, not by name: two identical cards in one machine have
    # the same name and the same VRAM, and a value comparison would silently drop
    # the second one from the list.
    $others = @($adapters | Where-Object { -not [object]::ReferenceEquals($_, $gpu) })

    # ---- what this rules in and out --------------------------------------
    #
    # Derived from the measured numbers, never boilerplate. The point of the
    # section is that a session reading it knows which suspicions are worth
    # having ON THIS MACHINE - and the same sentence would be wrong on another.
    $verdicts  = [System.Collections.Generic.List[string]]::new()
    $suspects  = 0

    # "against 0.0 GB of archives" on a clean install reads like a measurement
    # failure rather than an empty mod folder. Say which it is.
    $arcText = if ($archives.Count -eq 0) { 'no mod archives at all' } else { "$(GB $archBytes) of archives" }

    if ($vram -le 0) {
        $verdicts.Add('- **VRAM could not be measured.** Rule nothing in or out on it until you have a real figure - see the measurement warning above. A missing number is not a small number.')
        $suspects++
    }
    elseif ($vramGB -ge 16) {
        $verdicts.Add("- **VRAM exhaustion is unlikely.** $(Cap $vram) against $arcText. Not impossible - one 8K pack can still spike an individual scene - but it is not the first thing to suspect here, and it should be measured before it is blamed.")
    }
    elseif ($vramGB -ge 10) {
        $verdicts.Add("- **VRAM is plausible but not the obvious answer.** $(Cap $vram) against $arcText. Comfortable at 1080p/1440p; check it early if the symptom is stutter in dense areas or textures that never sharpen.")
    }
    elseif ($vramGB -ge 8) {
        $verdicts.Add("- **VRAM is a live suspect.** $(Cap $vram) against $arcText leaves little headroom once retextures stack. Suspect it before load order for stutter or muddy textures.")
        $suspects++
    }
    else {
        $verdicts.Add("- **VRAM is the FIRST suspect.** $(Cap $vram) against $arcText. High-res packs do not stream gracefully once VRAM is exhausted - stutter, textures that never sharpen, hard crashes in dense areas. Test by removing texture mods, not by reordering them.")
        $suspects++
    }

    if ($ramGB -ge 32) {
        $verdicts.Add("- **System RAM is not a suspect.** $(Cap $ramBytes), which a modded install does not exhaust on its own.")
    }
    elseif ($ramGB -ge 16) {
        $verdicts.Add("- **System RAM is adequate but not generous.** $(Cap $ramBytes). A large list plus a texture pack can reach it; worth watching in Task Manager during a session that ends badly.")
    }
    else {
        $verdicts.Add("- **System RAM is a first-rank suspect.** $(Cap $ramBytes). A heavily modded install regularly exceeds this, and the shortfall lands on the pagefile as stutter or out-of-memory crashes.")
        $suspects++
    }

    if ($pfBytes -eq 0) {
        $verdicts.Add('- **There is no pagefile.** Modded CP2077 commits far more than it resident-uses; fix this before diagnosing anything else, because everything downstream of it lies.')
        $suspects++
    }
    elseif ($pfAuto) {
        $verdicts.Add("- **The pagefile is not a suspect.** System-managed, currently $(GB $pfBytes), and free to grow under commit pressure.")
    }
    elseif ($pfBytes -lt 8GB) {
        $verdicts.Add("- **The pagefile is a suspect.** Fixed at $(GB $pfBytes), which will not grow. Small fixed pagefiles produce crashes that look random and are not.")
        $suspects++
    }
    else {
        $verdicts.Add("- **The pagefile is probably fine.** Fixed at $(GB $pfBytes) - enough for now, but it cannot grow, so re-check it after adding a large texture pack.")
    }

    if ($media -eq 'HDD') {
        $verdicts.Add('- **Storage IS a suspect** for texture pop-in and long hitches. The game streams assets constantly and mods add more; no load-order change fixes a mechanical drive.')
        $suspects++
    }
    elseif ($media -eq 'unknown') {
        $verdicts.Add("- **Drive type unknown** for $letter`:. If stutter is the symptom, establish it before ruling storage out.")
    }
    else {
        $verdicts.Add("- **Storage is not a suspect** for stutter or load-time faults: $media with $(GB $freeBytes) free.")
    }
    if ($freeBytes -gt 0 -and $freeBytes -lt 20GB) {
        $verdicts.Add("- **Free space IS a suspect.** Only $(GB $freeBytes) left on $letter`:; shader cache, logs and the pagefile all need room, and starving them produces failures that read as mod bugs.")
        $suspects++
    }

    if ($cores -ge 8) {
        $verdicts.Add("- **CPU is not a suspect** for frame-time faults: $cores cores / $($cpu.NumberOfLogicalProcessors) threads, well past what the game scales to.")
    }
    elseif ($cores -ge 6) {
        $verdicts.Add("- **CPU is adequate.** $cores cores / $($cpu.NumberOfLogicalProcessors) threads - fine in most of the city, tighter in crowds with heavy NPC mods.")
    }
    else {
        $verdicts.Add("- **CPU is a suspect** in crowds and during traversal: $cores cores / $($cpu.NumberOfLogicalProcessors) threads is below what a modded install asks for.")
        $suspects++
    }

    if ($redscriptState -like 'FAILED*') {
        $verdicts.Add('- **Every `.reds` mod on this install is currently OFF.** redscript failed its last compile, and it does that silently - no in-game sign at all. Nothing about an individual script mod can be diagnosed until this is green.')
        $suspects++
    }
    if ($hasList -and $unlisted.Count -gt 0) {
        $verdicts.Add("- **$($unlisted.Count) archive(s) are losing every conflict they enter,** because an archive absent from ``modlist.txt`` sorts last. Installed, enabled, and possibly contributing nothing - that is a load-order finding, not a mod bug.")
        $suspects++
    }
    if ($missing.Count -gt 0) {
        $verdicts.Add("- **$($missing.Count) ``modlist.txt`` entr(ies) name no file on disk, and that is normal.** A mod disabled on purpose keeps its slot, and at least one known mod writes its archive at runtime. Do not prune on this evidence alone.")
    }

    $verdicts.Add('')
    if ($suspects -eq 0) {
        $verdicts.Add('**Nothing on this machine is a resource ceiling.** A crash or a hitch here is far more likely to be a mod interaction, and bisecting the load order is a better use of a launch than tuning hardware. On weaker hardware the order of suspicion reverses - do not carry a conclusion from a different machine onto this one.')
    }
    else {
        $verdicts.Add("**There are $suspects hardware or install suspect(s) above.** Clear them before bisecting a large mod list: a bisect run against a machine that is genuinely short of something will find a different mod every round and prove nothing.")
    }

    # ---- flags -----------------------------------------------------------
    # Carried verbatim from the profiler, because the article is meant to be
    # read instead of re-running the tool. Item lists are capped: a flag naming
    # 600 archives buries every other line on the page, and the profiler is
    # there for the full list.
    $wikiCap = 10
    $flagBlock = if ($flags.Count) {
        (@($flags | ForEach-Object {
            $line = "- $($_.Text)"
            if ($_.Items.Count) {
                $shown = @($_.Items | Select-Object -First $wikiCap)
                $line += "`n" + (($shown | ForEach-Object { '  - ' + $bt + $_ + $bt }) -join "`n")
                if ($_.Items.Count -gt $wikiCap) { $line += "`n  - *...and $($_.Items.Count - $wikiCap) more; re-run the profiler for the full list*" }
            }
            $line
        }) -join "`n")
    } else {
        '- None. Nothing about the machine or the install shape is obviously wrong.'
    }

    # ---- assemble --------------------------------------------------------
    $w = [System.Collections.Generic.List[string]]::new()
    $add = { param([string]$s) $w.Add($s) }

    & $add '---'
    & $add 'type: Machine Profile'
    & $add 'title: This machine and this install'
    & $add ('description: The hardware, OS, framework versions and install shape that any crash, ' +
            'performance or capability question has to be read against - measured on ' + $today + ', not remembered.')
    & $add 'distribution: user-only'
    & $add 'status: stable'
    & $add 'tags: [hardware, install, frameworks, crashes, baseline]'
    & $add ('generated: { by: "cyberwise-reports/New-SystemProfile.ps1", at: "' + $okfStamp + '" }')
    & $add '---'
    & $add ''
    # The clobber note, in the file itself. A later session that finds this
    # article and applies the no-clobber instinct from a hand-written article
    # would keep a stale profile alive, which is the one failure worse than
    # having none: a confident answer about hardware that has changed.
    & $add ('<!-- GENERATED FILE. `New-SystemProfile.ps1 -Wiki` rewrites this article whole, ' +
            'and that is correct - every line of it is measured, so there is nothing here to ' +
            'preserve by hand. Do NOT apply the no-clobber rule that protects a hand-deepened ' +
            'mod article. Edit the generator, not this file. -->')
    & $add ''
    & $add '# This machine and this install'
    & $add ''
    & $add ('**Read this before answering any question about performance, VRAM, crashes or whether')
    & $add ("a mod can run here.** Every figure below was measured on $today by")
    & $add ('`cyberwise-reports/tools/New-SystemProfile.ps1`, on this machine. Nothing in it is')
    & $add ('remembered, inferred, or carried over from another install.')
    & $add ''
    & $add '## Hardware'
    & $add ''
    & $add '| | |'
    & $add '|---|---|'
    & $add ("| CPU | $($cpu.Name.Trim()), ${cores}c/$($cpu.NumberOfLogicalProcessors)t |")
    & $add ("| RAM | $(Cap $ramBytes) ($('{0:N1}' -f $ramGB) GiB usable) |")
    & $add ("| GPU | **$gpuName - $(if ($vram) { Cap $vram } else { 'VRAM UNKNOWN' })**$(if ($vram) { " ($('{0:N1}' -f $vramGB) GiB / $('{0:N0}' -f ($vram / 1MB)) MiB)" }), driver $gpuDriverShown |")
    foreach ($o in $others) {
        & $add ("| other adapter | $($o.Name) - $(if ($o.VRam -gt 0) { Cap $o.VRam } else { 'no VRAM reported' }) - **not** the game's adapter |")
    }
    & $add ("| OS | $($os.Caption -replace 'Microsoft ','') build $($os.BuildNumber) |")
    & $add ("| Pagefile | $(if ($pfAuto) { "system-managed, $(GB $pfBytes)" } else { "fixed, $(GB $pfBytes)" }) |")
    & $add ("| Game drive | ${letter}:, $media, $(GB $freeBytes) free |")
    & $add ''
    & $add ('### Do not read VRAM from `Win32_VideoController.AdapterRAM`')
    & $add ''
    & $add (@'
`AdapterRAM` is a **uint32 and saturates at 4 GB**. Every card above that reports
roughly 4294967295 there, so a 32 GB card and an 8 GB card give the same answer
and the answer is wrong for both.

`HardwareInformation.qwMemorySize` on the display class registry key is a QWORD
and reports the truth - **but only if you enumerate every index.** Index `0` is
not necessarily the card the game runs on; on a machine with integrated
graphics it is routinely the integrated adapter, which answers with its own
small figure and looks entirely plausible.

Both wrong answers were produced on a real machine on 2026-08-24, and one of
them was briefly used in a crash diagnosis before anyone checked. Two routes
that do not lie:

```powershell
# the profiler already enumerates every adapter and pairs name with VRAM - prefer it
New-SystemProfile.ps1 -GameRoot '<path>' -Wiki

# or ask the driver directly, on NVIDIA
nvidia-smi --query-gpu=name,memory.total,driver_version --format=csv
```

Name and capacity must come from the **same** entry. Reading the name from
`Win32_VideoController` and the size from the registry pairs them wrong the
moment a machine has two adapters, and invents a GPU that does not exist.
'@)
    & $add ''
    & $add '## Install'
    & $add ''
    & $add '| | |'
    & $add '|---|---|'
    & $add ("| Game | $gameVer, $store |")
    & $add ("| Root | ``$GameRoot`` |")
    & $add ("| Manager | $manager |")
    & $add ("| Archives | $($archives.Count), $(GB $archBytes) |")
    & $add ("| Load order | $(if ($hasList) { "``modlist.txt``, $($listed.Count) entries, $($unlisted.Count) unlisted, $($missing.Count) missing" } else { 'no `modlist.txt` - alphabetical fallback' }) |")
    & $add ("| redscript | $redscriptState |")
    & $add ("| ArchiveXL log | $(if ($xlErrors -gt 0) { "$xlErrors error(s)" } else { 'no errors' }) |")
    & $add ''
    & $add '## Frameworks'
    & $add ''
    & $add '| | |'
    & $add '|---|---|'
    foreach ($k in $frameworks.Keys) {
        & $add ("| $k | $(if ($frameworks[$k]) { $frameworks[$k] } else { 'not installed' }) |")
    }
    & $add ''
    & $add (@'
These come from the plugin binaries themselves. **A staging folder name is not a
version** - manager folder names carry whatever the uploader typed, and they have
been observed disagreeing with the DLL for several frameworks at once.
'@)
    & $add ''
    & $add '## Payload'
    & $add ''
    & $add (($payload.Keys | ForEach-Object { "$($payload[$_]) $_" }) -join ', ')
    & $add ''
    & $add '## Flags raised'
    & $add ''
    & $add $flagBlock
    & $add ''
    & $add '## What this rules in and out'
    & $add ''
    & $add (($verdicts -join "`n"))
    & $add ''
    & $add '## Refresh'
    & $add ''
    & $add (@'
Re-run after a game patch, a driver update, a framework update, a GPU or RAM
change, or any large change to the load order:

```powershell
skills\cyberwise-reports\tools\New-SystemProfile.ps1 -GameRoot '<path>' -Wiki
```

That rewrites this article in place. A stale machine profile is worse than none:
it is a confident answer about hardware that has since changed, and nothing
about it looks stale.
'@)

    $wikiText = ($w -join "`n") + "`n"
    if (-not (Test-Path -LiteralPath $wikiDir)) { New-Item -ItemType Directory -Path $wikiDir -Force | Out-Null }
    # WriteAllText with an explicit no-BOM encoder, not Set-Content. `-Encoding
    # utf8NoBOM` does not exist in Windows PowerShell 5.1 and throws there, and
    # `-Encoding UTF8` means *with* a BOM on 5.1 - which is exactly the kind of
    # difference that turns "works on my machine" into a frontmatter parser
    # tripping over three invisible bytes before `---`.
    [System.IO.File]::WriteAllText($wikiFull, $wikiText, (New-Object System.Text.UTF8Encoding($false)))
    Write-Host "wrote $wikiFull (OKF article, user-only)" -ForegroundColor Green
}

Write-Host "$($flags.Count) flag(s) raised" -ForegroundColor $(if ($flags.Count) { 'Yellow' } else { 'Green' })

# Exit 0 explicitly. Falling off the end leaves $LASTEXITCODE unset rather than
# zero, so a caller that checks it - an installer, a tray app, CI - gets nothing
# and cannot tell success from "never ran". Flags are findings about the machine,
# not failures of this script, so they do not change the code.
exit 0


