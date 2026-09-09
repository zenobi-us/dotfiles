# Measure-PageFit.ps1 -- does a page fit a given viewport without scrolling?
#
#     .\Measure-PageFit.ps1 -Path page.html -Width 1712 -Height 945
#     .\Measure-PageFit.ps1 -Path page.html                 # falls back to a guess
#
# Get the width and height from the user, not from the screen: run
# Show-ViewportProbe.ps1, have them size a browser window the way they actually
# intend to read the page, and use the numbers it reports. What the layout has
# to fit is a window, not a panel - which monitor, maximised or half-width, the
# bookmarks bar, zoom and display scaling all sit in between.
#
# Returns the document height, the viewport, and the overflow. Eyeballing a
# screenshot tells you a page is too tall but not by how much, which turns
# layout tuning into guesswork; a number turns it into arithmetic.
#
# READING THE RESULT: DocHeight equal to ViewHeight does NOT mean the page fills
# the window exactly. scrollHeight has the viewport as its floor, so equality
# only means "shorter than the viewport" - which Fits already said. For the true
# content height, and therefore the real headroom, run it again against a
# deliberately short window (-Height 400).
#
# Works by copying the page, appending a script that stamps the measurements
# into <title>, and reading that back out of --dump-dom. Headless Chromium has
# no other way to return a value from the page over the command line.

[CmdletBinding()]
param(
    [Parameter(Mandatory)] [string] $Path,

    # Viewport to test against, in CSS pixels. ASK THE USER FOR THESE - see
    # Show-ViewportProbe.ps1. Omitted, they fall back to this machine's primary
    # display working area, which is only right when the reader is sitting at
    # this machine and will maximise the window on the main monitor.
    [int] $Width,
    [int] $Height,

    [string] $Browser,
    [switch] $Screenshot,
    [string] $ShotPath
)

# --- upstream guard ---------------------------------------------------------
# Advisory, and only that: silent while this copy matches what shipped, one
# short line when it does not, and it never blocks or changes an exit code.
# Rationale, and why it is deliberately not a PreToolUse hook: UpstreamGuard.ps1.
$cwGuard = Join-Path $PSScriptRoot '..\..\cyberwise\tools\UpstreamGuard.ps1'
if (Test-Path -LiteralPath $cwGuard) { try { . $cwGuard; Invoke-CwStartupGuard } catch { } }


# NOTE: --window-size takes a comma-separated pair, and PowerShell parses a bare
# `--window-size=$W,$H` as an ARRAY - passing two separate arguments, so the flag
# is silently ignored and the browser reports its 800x600 default. Quote it.

function Get-PrimaryViewport {
    # A FALLBACK, not the intended path. It assumes the reader is at this
    # machine, on the primary monitor, maximised, at 100% zoom, with no
    # bookmarks bar - and it cannot represent "half-width on monitor 2" or
    # "the small panel on the left" at all. Prefer numbers from the user.
    #
    # WinForms reports the working area - the screen minus the taskbar - in the
    # process's coordinate space, which is what a maximised browser window gets
    # and therefore closer to the truth than the raw panel resolution.
    #
    # Two ways it can be unavailable: PowerShell without the Windows Desktop
    # runtime, and non-Windows. Fall back to the display mode, then to 1080p,
    # which is an arbitrary but stated default rather than a silent one.
    try {
        Add-Type -AssemblyName System.Windows.Forms -ErrorAction Stop
        $wa = [System.Windows.Forms.Screen]::PrimaryScreen.WorkingArea
        if ($wa.Width -gt 0 -and $wa.Height -gt 0) { return @([int]$wa.Width, [int]$wa.Height) }
    } catch { }
    try {
        $v = Get-CimInstance Win32_VideoController -ErrorAction Stop |
             Where-Object { $_.CurrentHorizontalResolution -gt 0 } | Select-Object -First 1
        if ($v) { return @([int]$v.CurrentHorizontalResolution, [int]$v.CurrentVerticalResolution) }
    } catch { }
    return @(1920, 1080)
}

if (-not $Width -or -not $Height) {
    $auto = Get-PrimaryViewport
    if (-not $Width)  { $Width  = $auto[0] }
    if (-not $Height) { $Height = $auto[1] }
    # --window-size is in CSS pixels. On a display running above 100% scaling the
    # browser fits proportionally fewer of them than the panel has physical
    # pixels, so on a scaled screen measure the real window and pass it.
    Write-Warning "no viewport given - guessing ${Width}x${Height} from this machine's primary display. Run Show-ViewportProbe.ps1 and pass the user's real window size."
}

if (-not $Browser) {
    $Browser = @(
        "$env:ProgramFiles\Google\Chrome\Application\chrome.exe"
        "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe"
        "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe"
        "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
    ) | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
}
if (-not $Browser) { throw 'no Chromium-based browser found' }

$html = Get-Content -LiteralPath $Path -Raw
$probe = @'
<script>
(function(){
  var d = document.documentElement;
  // widest element that overflows horizontally, if any - a single wide child
  // will produce a scrollbar and is worth naming rather than hunting for.
  var over = '';
  document.querySelectorAll('*').forEach(function(el){
    if (el.getBoundingClientRect().right > d.clientWidth + 1 && !over) {
      over = el.className || el.tagName;
    }
  });
  document.title = 'FIT|' + d.scrollHeight + '|' + d.clientHeight + '|' +
                   d.scrollWidth + '|' + d.clientWidth + '|' + over;
})();
</script>
'@
$tmp = Join-Path ([IO.Path]::GetTempPath()) ("fit_" + [guid]::NewGuid().ToString('N') + '.html')
Set-Content -LiteralPath $tmp -Value ($html -replace '(?i)</body>', "$probe</body>") -Encoding UTF8

try {
    $uri = 'file:///' + ($tmp -replace '\\','/')
    $dom = & $Browser --headless=new --disable-gpu --hide-scrollbars `
                      "--window-size=$Width,$Height" --virtual-time-budget=4000 `
                      --dump-dom $uri 2>$null | Out-String

    if ($dom -notmatch '<title>FIT\|(\d+)\|(\d+)\|(\d+)\|(\d+)\|([^<]*)</title>') {
        throw 'probe did not report - page may have failed to load'
    }
    $r = [pscustomobject]@{
        DocHeight   = [int]$matches[1]
        ViewHeight  = [int]$matches[2]
        DocWidth    = [int]$matches[3]
        ViewWidth   = [int]$matches[4]
        OverflowsX  = $matches[5]
        Fits        = ([int]$matches[1] -le [int]$matches[2])
        OverflowPx  = [Math]::Max(0, [int]$matches[1] - [int]$matches[2])
    }

    if ($Screenshot) {
        if (-not $ShotPath) { $ShotPath = [IO.Path]::ChangeExtension($tmp, '.png') }
        & $Browser --headless=new --disable-gpu --hide-scrollbars `
                   "--window-size=$Width,$Height" --virtual-time-budget=4000 `
                   "--screenshot=$ShotPath" ('file:///' + ($Path -replace '\\','/')) 2>$null | Out-Null
        $r | Add-Member -NotePropertyName Shot -NotePropertyValue $ShotPath
    }
    return $r
}
finally { Remove-Item -LiteralPath $tmp -Force -ErrorAction SilentlyContinue }
