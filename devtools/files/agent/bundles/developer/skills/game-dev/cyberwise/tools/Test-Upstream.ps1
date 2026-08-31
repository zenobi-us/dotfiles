# Test-Upstream.ps1 -- does this copy still match what shipped, and is every difference written down?
#
#     .\Test-Upstream.ps1                # the report
#     .\Test-Upstream.ps1 -All           # also list the files that match
#     .\Test-Upstream.ps1 -Quiet         # exit code only, for a script
#
# Exit codes:  0  nothing unlogged
#              1  something differs from upstream with no register entry
#              2  cannot check - no manifest, or no recognisable layout
#
# WHAT IT IS FOR
#
# Cyberwise ships tools and instructions. A fresh agent, mid-problem, will
# sometimes edit one of those tools to solve something the family already solves
# through a user-bundle affordance, an override mod, or a registered patch - and
# nobody finds out. Separately, an edited tool is how deliberately malicious
# behaviour would hide: it is invisible exactly because nobody ever compares.
#
# THE TONE IS PART OF THE DESIGN
#
# This reports "differs from upstream". It does not say corrupted, and it does
# not say tampered. Plenty of people legitimately want their copy changed, and a
# check that scolds them for it gets disabled - at which point it protects
# nobody at all.
#
# **The finding is the UNLOGGED change, not the change.** A difference with a
# register entry beside it is a known local customization and prints as one.
#
# WHERE ELSE THIS FIRES
#
# Every tool in the family runs the same check at startup, silently, because a
# check nobody runs is worth nothing and the agent most likely to edit a tool is
# the least likely to run the test suite. tests\Test-Family.ps1 runs it as a
# ship gate. Neither of those blocks anything, and this is deliberately NOT a
# PreToolUse hook - a failing PreToolUse hook fails closed and blocks every Edit
# in every session on the machine, including the one that would fix it.

[CmdletBinding()]
param(
    [string] $Root,
    [string] $RecordsRoot,
    [string] $ManifestPath,
    # Also list the files that match. Off by default: sixty lines of OK is how a
    # report stops being read.
    [switch] $All,
    [switch] $Quiet
)

. (Join-Path $PSScriptRoot 'UpstreamGuard.ps1')

$r = Test-CwUpstream -Root $Root -RecordsRoot $RecordsRoot -ManifestPath $ManifestPath

if ($r.Reason -eq 'nolayout') {
    if (-not $Quiet) {
        Write-Host 'no skills\ directory found above this script, so there is nothing to compare.' -ForegroundColor Red
        Write-Host 'Run it from a Cyberwise checkout or an installed copy, or pass -Root.' -ForegroundColor DarkGray
    }
    exit 2
}

if ($r.Reason -eq 'nomanifest') {
    if (-not $Quiet) {
        Write-Host 'no upstream manifest, so nothing can be checked.' -ForegroundColor Red
        Write-Host "  expected at: $($r.ManifestPath)" -ForegroundColor DarkGray
        Write-Host '  It ships with the repo. If it is gone, either this copy was assembled by hand,' -ForegroundColor DarkGray
        Write-Host '  or something removed it - which is worth a look, because removing the manifest' -ForegroundColor DarkGray
        Write-Host '  is the cheapest way to make every other difference invisible.' -ForegroundColor DarkGray
        Write-Host '  rebuild: .\New-UpstreamManifest.ps1 -Write' -ForegroundColor DarkGray
    }
    exit 2
}

if ($Quiet) { exit $(if ($r.Ok) { 0 } else { 1 }) }

$scopeNote = if ($r.Scope -eq 'repo') { 'repo checkout' } else { "installed copy - tests\ and install.ps1 are not part of this layout, so $($r.Skipped) manifest entr(ies) are out of scope" }
Write-Host "upstream check: $($r.Checked) guarded file(s), $scopeNote" -ForegroundColor Cyan
if ($r.Generated) { Write-Host "  manifest generated $($r.Generated)" -ForegroundColor DarkGray }
Write-Host "  register: $($r.RegisterPath)" -ForegroundColor DarkGray
Write-Host ''

$order = @{ 'UNREGISTERED' = 0; 'MISSING' = 1; 'NEW' = 2; 'REGISTERED' = 3; 'OK' = 4 }
foreach ($f in ($r.Findings | Sort-Object @{ Expression = { $order[$_.State] } }, Path)) {
    if ($f.State -eq 'OK' -and -not $All) { continue }
    $colour = switch ($f.State) {
        'OK'           { 'DarkGreen' }
        'REGISTERED'   { 'DarkCyan' }
        'UNREGISTERED' { 'Yellow' }
        'MISSING'      { 'Red' }
        'NEW'          { 'Magenta' }
    }
    Write-Host ("{0,-13} {1}" -f $f.State, $f.Path) -ForegroundColor $colour
    if ($f.Detail) { Write-Host "              $($f.Detail)" -ForegroundColor DarkGray }
    if ($f.State -eq 'REGISTERED' -and $f.Entry) {
        Write-Host "              approved by $($f.Entry.ApprovedBy), $($f.Entry.Recorded)" -ForegroundColor DarkGray
    }
}

Write-Host ''
if ($r.Registered) {
    Write-Host "$($r.Registered) known local customization(s) - recorded, wanted, and not a problem." -ForegroundColor DarkCyan
}

if ($r.Ok) {
    Write-Host 'nothing unlogged.' -ForegroundColor Green
    exit 0
}

# The remedy, spelled out, because "there is a finding" without a next step is
# how a check gets ignored - and because the RIGHT next step is usually neither
# of the two obvious ones.
Write-Host "$($r.Unregistered + $r.Missing + $r.New) difference(s) with nothing recorded about them." -ForegroundColor Yellow
Write-Host ''
Write-Host 'That is not a verdict on the change - it is a gap in the record. One of these:' -ForegroundColor DarkGray
Write-Host '  the change is wanted here     ->  . .\UpstreamGuard.ps1; Register-CwChange -File <path> -What <what> -Why <why> -ApprovedBy <who>' -ForegroundColor DarkGray
Write-Host '  the change IS the new upstream ->  .\New-UpstreamManifest.ps1 -Write' -ForegroundColor DarkGray
Write-Host '  nobody meant it                ->  restore the file, then say so' -ForegroundColor DarkGray
Write-Host ''
Write-Host 'Before keeping an edit to a shipped tool, check the family already lacks an affordance for it:' -ForegroundColor DarkGray
Write-Host '  the user bundle for anything about this install; an override mod for a fix to another' -ForegroundColor DarkGray
Write-Host '  author''s mod; ModPatchWatch.ps1 for an edit to their file. Editing a shipped tool is the' -ForegroundColor DarkGray
Write-Host '  last option, not the first.' -ForegroundColor DarkGray
exit 1
