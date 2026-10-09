# Show-ViewportProbe.ps1 -- ask the user's actual browser window how big it is.
#
#     .\Show-ViewportProbe.ps1
#
# Opens a page that reports its own viewport, live, in very large type. The user
# drags the window to the monitor and the size they actually want, reads the
# numbers back, and those numbers go to Measure-PageFit.ps1.
#
# ---------------------------------------------------------------------------
# Why not just detect the screen
# ---------------------------------------------------------------------------
#
# Because the screen is not the question. What the layout has to fit is a
# *browser window*, and between the panel and the viewport sit: which monitor it
# is on, whether it is maximised or half-width, the tab strip, the address bar,
# an optional bookmarks bar, a sidebar, browser zoom, and OS display scaling.
# Detecting the primary display answers a question nobody asked.
#
# The cases that make this obvious:
#
#   * A small secondary or prompter panel. Auto-detection reports the primary
#     3072x1728 monitor and sizes a page that will never fit the 1024x600 the
#     user actually meant.
#   * A wall-mounted TV, where the honest answer is "scale the type up hard".
#   * "Half the width of my second monitor", which no screen enumeration can
#     express at all.
#
# Ask instead. It takes the user ten seconds and it is exactly right.

[CmdletBinding()]
param(
    [string] $Browser,
    [string] $Path = (Join-Path ([IO.Path]::GetTempPath()) 'cyberwise-viewport-probe.html')
)

# --- upstream guard ---------------------------------------------------------
# Advisory, and only that: silent while this copy matches what shipped, one
# short line when it does not, and it never blocks or changes an exit code.
# Rationale, and why it is deliberately not a PreToolUse hook: UpstreamGuard.ps1.
$cwGuard = Join-Path $PSScriptRoot '..\..\cyberwise\tools\UpstreamGuard.ps1'
if (Test-Path -LiteralPath $cwGuard) { try { . $cwGuard; Invoke-CwStartupGuard } catch { } }


$html = @'
<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Viewport probe</title>
<style>
:root{--yellow:#fcee0a;--cyan:#00f0ff;--red:#ff003c;--bg:#07070a;--panel:#101018;
  --line:#26263a;--text:#e4e4ee;--dim:#8a8aa2;
  --mono:'Consolas','SF Mono','DejaVu Sans Mono',monospace;--sans:'Segoe UI',system-ui,sans-serif}
*{box-sizing:border-box}html,body{margin:0;padding:0;height:100%}
body{background:var(--bg);color:var(--text);font-family:var(--sans);
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:clamp(10px,2vh,26px);padding:20px;text-align:center;overflow:hidden}
h1{font-family:var(--mono);font-size:clamp(13px,1.6vw,20px);letter-spacing:.22em;
  text-transform:uppercase;color:var(--cyan);margin:0;font-weight:400}
#size{font-family:var(--mono);font-weight:700;line-height:1;
  font-size:clamp(44px,13vw,190px);color:var(--yellow);
  text-shadow:3px 0 var(--red),-3px 0 var(--cyan)}
#meta{font-family:var(--mono);font-size:clamp(11px,1.3vw,16px);color:var(--dim);line-height:1.9}
#meta b{color:var(--text);font-weight:400}
.warn{color:var(--red)}
#cmd{font-family:var(--mono);font-size:clamp(10px,1.15vw,15px);color:var(--text);
  background:var(--panel);border:1px solid var(--line);border-left:3px solid var(--yellow);
  padding:12px 16px;max-width:96%;overflow-x:auto;white-space:nowrap;user-select:all}
button{font-family:var(--mono);font-size:clamp(11px,1.2vw,15px);letter-spacing:.1em;
  text-transform:uppercase;cursor:pointer;background:var(--yellow);color:#07070a;
  border:0;padding:11px 20px;font-weight:700}
button:active{transform:translateY(1px)}
#hint{font-size:clamp(12px,1.35vw,17px);color:var(--dim);max-width:60ch;line-height:1.5}
#done{color:var(--cyan);font-family:var(--mono);font-size:clamp(11px,1.2vw,15px);height:1.4em}
</style></head><body>
<h1>Size this window the way you want to read the report</h1>
<div id="size">0 &times; 0</div>
<div id="meta"></div>
<div id="cmd"></div>
<button id="copy">Copy size</button>
<div id="done">&nbsp;</div>
<p id="hint">Put this window on the monitor you will actually use, at the size you
will actually use - maximised, half-width, on the little one, wherever. The numbers
update as you drag. Then read them out, or paste the copied line.</p>
<script>
function paint(){
  // innerWidth/innerHeight are CSS pixels of the viewport - the same unit the
  // headless browser's --window-size takes, and what the layout actually gets.
  const w = window.innerWidth, h = window.innerHeight;
  const dpr = window.devicePixelRatio || 1;
  document.getElementById('size').textContent = w + ' × ' + h;
  document.getElementById('cmd').textContent = '-Width ' + w + ' -Height ' + h;

  // A zoomed-in browser reports fewer CSS pixels than the panel has. That is
  // correct and should be kept - but say so, because a user who zoomed by
  // accident will otherwise get a page sized for the zoom.
  let note = 'device pixel ratio <b>' + dpr.toFixed(2) + '</b>';
  if (Math.abs(dpr - Math.round(dpr)) > 0.01) {
    note += ' &nbsp;<span class="warn">- display scaling or browser zoom is active. '
          + 'Fine, as long as this is how you will read it.</span>';
  }
  document.getElementById('meta').innerHTML =
    'viewport <b>' + w + ' × ' + h + '</b> CSS px &nbsp;//&nbsp; ' + note;
}
addEventListener('resize', paint);
paint();
document.getElementById('copy').addEventListener('click', async () => {
  const txt = document.getElementById('cmd').textContent;
  try { await navigator.clipboard.writeText(txt); document.getElementById('done').textContent = 'copied'; }
  catch (e) { document.getElementById('done').textContent = 'select the line above and copy it'; }
  setTimeout(() => document.getElementById('done').textContent = ' ', 2500);
});
</script></body></html>
'@

Set-Content -LiteralPath $Path -Value $html -Encoding UTF8

if ($Browser -and (Test-Path -LiteralPath $Browser)) { & $Browser $Path }
else { Start-Process $Path }

Write-Host ''
Write-Host 'Viewport probe opened.' -ForegroundColor Cyan
Write-Host 'Move and size that window to however you want to read the report, then'
Write-Host 'read back the big number (or click Copy size and paste it).'
Write-Host ''
Write-Host '  Measure-PageFit.ps1 -Path page.html -Width <w> -Height <h>' -ForegroundColor DarkGray
Write-Host ''
