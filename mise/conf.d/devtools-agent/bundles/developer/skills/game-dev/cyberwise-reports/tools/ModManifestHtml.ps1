# ModManifestHtml.ps1 -- render a mod manifest as a self-contained HTML report.
#
# Dot-sourced by New-ModManifest.ps1. Kept separate because the template is
# mostly CSS and the manifest logic is hard enough to read already.
#
# Everything is inlined - no fonts, no scripts, no images from anywhere else -
# so the file works offline, from a USB stick, or attached to a forum post.
# Mod data is embedded as JSON and rendered client-side, which is what keeps
# search instant on a large load order - a few hundred to a few thousand entries
# filter without the page having been re-generated.

# --- upstream guard ---------------------------------------------------------
# Advisory, and only that: silent while this copy matches what shipped, one
# short line when it does not, and it never blocks or changes an exit code.
# Rationale, and why it is deliberately not a PreToolUse hook: UpstreamGuard.ps1.
$cwGuard = Join-Path $PSScriptRoot '..\..\cyberwise\tools\UpstreamGuard.ps1'
if (Test-Path -LiteralPath $cwGuard) { try { . $cwGuard; Invoke-CwStartupGuard } catch { } }

function Get-RedactedStagingPath {
    <#
    .SYNOPSIS
        Strip machine identity out of a staging path.
    .DESCRIPTION
        REDACT BY DEFAULT. A manifest exists to be shared - posted to a Discord,
        attached to a bug report, screenshotted - and the staging root carries
        the Windows username in almost every layout. Nobody proof-reads a header
        before pasting, so the safe form has to be the default one.

        What a reader actually needs from it is which manager produced this, not
        where it lives.

        This lives here, and BOTH outputs call it, because the markdown shipped
        a full path in its header for a while after the HTML header was already
        redacting one. Two copies of this logic is how a field quietly stops
        being covered.
    #>
    param([string] $Path)
    if (-not $Path) { return $Path }
    $s = $Path -replace [regex]::Escape([string]$env:USERPROFILE), '~'
    if ($env:USERNAME) { $s = $s -replace "(?i)\\$([regex]::Escape([string]$env:USERNAME))\b", '\<user>' }
    return ($s -replace '^([A-Za-z]:)\\.*\\([^\\]+\\[^\\]+)$', '$1\...\$2')
}

function ConvertTo-ManifestHtml {
    param(
        [Parameter(Mandatory)] $Mods,
        [Parameter(Mandatory)] [string] $Game,
        [string] $StagingRoot,
        [int]    $HiddenCount = 0,
        [switch] $HideNSFW,
        [string] $FlagSource = 'name heuristic',
        # Show the real staging path. Off by default - see Get-RedactedStagingPath.
        [switch] $NoRedact
    )

    $payload = foreach ($m in $Mods) {
        [ordered]@{
            n = $m.Name
            i = $m.NexusId
            v = $m.Version
            d = $(if ($m.Installed) { $m.Installed.ToString('yyyy-MM-dd') } else { $null })
            f = @($m.Footprint)
            c = $m.Files
            s = $(if ($m.Summary) { ($m.Summary -replace '\s+', ' ').Trim() } else { $null })
            a = [bool]$m.Adult
            u = $m.Author
        }
    }
    $json = $payload | ConvertTo-Json -Depth 4 -Compress

    $described = @($Mods | Where-Object Summary).Count
    $subtitle  = if ($HideNSFW) {
        "$($Mods.Count) MODS &nbsp;//&nbsp; $described DESCRIBED &nbsp;//&nbsp; $HiddenCount FILTERED ($FlagSource)"
    } else {
        "$($Mods.Count) MODS &nbsp;//&nbsp; $described DESCRIBED"
    }

    $tpl = @'
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>MOD MANIFEST // CYBERPUNK 2077</title>
<style>
:root{
  --yellow:#fcee0a; --cyan:#00f0ff; --red:#ff003c; --green:#39ff88;
  --bg:#07070a; --panel:#101018; --panel2:#16161f; --line:#26263a;
  --text:#d8d8e6; --dim:#7c7c92;
  --mono:'Consolas','SF Mono','DejaVu Sans Mono',monospace;
  --sans:'Segoe UI',system-ui,-apple-system,sans-serif;
}
*{box-sizing:border-box}
html,body{margin:0;padding:0}
body{
  background:var(--bg); color:var(--text); font-family:var(--sans);
  font-size:15px; line-height:1.55;
  background-image:
    linear-gradient(rgba(252,238,10,.022) 1px,transparent 1px),
    linear-gradient(90deg,rgba(252,238,10,.022) 1px,transparent 1px);
  background-size:44px 44px;
}
.wrap{max-width:1500px;margin:0 auto;padding:0 22px 80px}

/* ---------- header ---------- */
header{
  position:relative; padding:38px 0 22px; margin-bottom:6px;
  border-bottom:1px solid var(--line); overflow:hidden;
}
/* Scanlines live ONLY here. Across a whole page of cards they are actively
   tiring to read through; confined to the masthead they still set the tone. */
header::after{
  content:''; position:absolute; inset:0; pointer-events:none;
  background:repeating-linear-gradient(0deg,rgba(0,0,0,.34) 0 1px,transparent 1px 3px);
}
h1{
  font-family:var(--mono); font-size:clamp(30px,5.5vw,60px); font-weight:700;
  letter-spacing:.1em; margin:0; color:var(--yellow); text-transform:uppercase;
  text-shadow:2px 0 var(--red), -2px 0 var(--cyan);
}
h1 span{color:var(--text); text-shadow:none}
.sub{font-family:var(--mono);font-size:12px;letter-spacing:.16em;color:var(--dim);margin-top:10px}
.src{font-family:var(--mono);font-size:11px;color:#4a4a5e;margin-top:4px;word-break:break-all}

/* ---------- controls ---------- */
.controls{
  position:sticky; top:0; z-index:8; padding:14px 0;
  background:linear-gradient(180deg,var(--bg) 72%,transparent);
  display:flex; gap:12px; flex-wrap:wrap; align-items:center;
}
#q{
  flex:1 1 300px; min-width:220px; background:var(--panel); color:var(--text);
  border:1px solid var(--line); border-left:3px solid var(--yellow);
  padding:11px 14px; font-family:var(--mono); font-size:14px; outline:none;
}
#q:focus{border-color:var(--cyan);border-left-color:var(--cyan);box-shadow:0 0 0 1px rgba(0,240,255,.25)}
#q::placeholder{color:#4a4a5e}
.pill{
  font-family:var(--mono); font-size:11px; letter-spacing:.1em; cursor:pointer;
  background:var(--panel); color:var(--dim); border:1px solid var(--line);
  padding:8px 13px; text-transform:uppercase; transition:.12s;
}
.pill:hover{color:var(--text);border-color:#3a3a54}
.pill.on{background:var(--yellow);color:#07070a;border-color:var(--yellow);font-weight:700}
.count{font-family:var(--mono);font-size:11px;color:var(--dim);margin-left:auto;white-space:nowrap}

/* ---------- sections ---------- */
h2{
  font-family:var(--mono); font-size:13px; letter-spacing:.22em; text-transform:uppercase;
  color:var(--cyan); margin:34px 0 14px; padding-bottom:8px;
  border-bottom:1px solid var(--line); display:flex; align-items:baseline; gap:10px;
}
h2 b{color:var(--dim);font-weight:400;font-size:11px}

/* ---------- cards ---------- */
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(330px,1fr));gap:12px}
.card{
  background:var(--panel); border:1px solid var(--line); padding:14px 15px;
  clip-path:polygon(0 0,calc(100% - 13px) 0,100% 13px,100% 100%,13px 100%,0 calc(100% - 13px));
  transition:.12s; contain:content;
}
.card:hover{background:var(--panel2);border-color:#3d3d5c;transform:translateY(-1px)}
.card.nsfw{border-left:3px solid var(--red)}
.name{font-weight:600;font-size:15px;line-height:1.3;margin-bottom:7px;word-break:break-word}
.name a{color:var(--yellow);text-decoration:none;border-bottom:1px solid transparent}
.name a:hover{border-bottom-color:var(--yellow)}
.name .noid{color:var(--text)}
.meta{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:9px}
.tag{
  font-family:var(--mono);font-size:10px;letter-spacing:.06em;padding:2px 7px;
  background:#1c1c2a;color:var(--dim);border:1px solid #2b2b40;text-transform:uppercase;
}
.tag.k{color:var(--cyan);border-color:#173d47}
.tag.a{color:var(--red);border-color:#4a1024}
.desc{font-size:13.5px;color:#a8a8bd;line-height:1.5}
.none{color:#4a4a5e;font-style:italic;font-size:13px}
footer{margin-top:56px;padding-top:18px;border-top:1px solid var(--line);
  font-family:var(--mono);font-size:11px;color:#4a4a5e;line-height:1.8}
.empty{padding:50px 0;text-align:center;color:var(--dim);font-family:var(--mono)}
</style>
</head>
<body>
<div class="wrap">
<header>
  <h1>Mod <span>Manifest</span></h1>
  <div class="sub">__SUBTITLE__</div>
  <div class="src">__SOURCE__</div>
</header>

<div class="controls">
  <input id="q" type="search" placeholder="filter by name, description, author, nexus id...">
  <span id="pills"></span>
  <span class="count" id="count"></span>
</div>

<div id="out"></div>

<footer>
  GENERATED __STAMP__ // CYBERWISE<br>
  Tier 1 (name, id, version, date, footprint) read from staging folder names and layout.<br>
  Tier 2 (description, author, adult flag) from the Nexus v1 API.
</footer>
</div>

<script>
const MODS = __DATA__;
const ORDER = ['archive','redscript','CET','tweak','REDmod','RED4ext','ASI','input','other'];
const GAME = '__GAME__';

function kindOf(m){ for(const k of ORDER) if(m.f && m.f.indexOf(k)>-1) return k; return 'other'; }
MODS.forEach(m => m._k = kindOf(m));

let active = null;
const counts = {};
MODS.forEach(m => counts[m._k] = (counts[m._k]||0)+1);

const pills = document.getElementById('pills');
ORDER.filter(k=>counts[k]).forEach(k=>{
  const b = document.createElement('button');
  b.className='pill'; b.textContent = k+' '+counts[k];
  b.onclick = () => { active = (active===k)?null:k; sync(); render(); };
  b.dataset.k = k; pills.appendChild(b);
});
function sync(){ [...pills.children].forEach(b=>b.classList.toggle('on', b.dataset.k===active)); }

const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

function card(m){
  const title = m.i
    ? `<a href="https://www.nexusmods.com/${GAME}/mods/${m.i}" target="_blank" rel="noopener">${esc(m.n)}</a>`
    : `<span class="noid">${esc(m.n)}</span>`;
  const tags = [];
  if(m.v) tags.push(`<span class="tag">v${esc(m.v)}</span>`);
  if(m.d) tags.push(`<span class="tag">${esc(m.d)}</span>`);
  (m.f||[]).forEach(f => tags.push(`<span class="tag k">${esc(f)}</span>`));
  tags.push(`<span class="tag">${m.c} file${m.c===1?'':'s'}</span>`);
  if(m.u) tags.push(`<span class="tag">${esc(m.u)}</span>`);
  if(m.a) tags.push(`<span class="tag a">adult</span>`);
  const body = m.s ? `<div class="desc">${esc(m.s)}</div>`
                   : `<div class="none">no description available</div>`;
  return `<div class="card${m.a?' nsfw':''}"><div class="name">${title}</div>
          <div class="meta">${tags.join('')}</div>${body}</div>`;
}

function render(){
  const q = document.getElementById('q').value.trim().toLowerCase();
  const terms = q ? q.split(/\s+/) : [];
  const hit = MODS.filter(m=>{
    if(active && m._k!==active) return false;
    if(!terms.length) return true;
    const hay = ((m.n||'')+' '+(m.s||'')+' '+(m.u||'')+' '+(m.i||'')).toLowerCase();
    return terms.every(t => hay.indexOf(t)>-1);
  });
  document.getElementById('count').textContent = hit.length+' / '+MODS.length+' shown';
  const out = document.getElementById('out');
  if(!hit.length){ out.innerHTML = '<div class="empty">no matches</div>'; return; }
  let html='';
  for(const k of ORDER){
    const set = hit.filter(m=>m._k===k);
    if(!set.length) continue;
    set.sort((a,b)=>a.n.localeCompare(b.n,undefined,{sensitivity:'base'}));
    html += `<h2>${k} <b>${set.length}</b></h2><div class="grid">${set.map(card).join('')}</div>`;
  }
  out.innerHTML = html;
}
document.getElementById('q').addEventListener('input', render);
render();
</script>
</body>
</html>
'@

    # Redacted unless the caller asks for the real thing; see the helper above
    # for why the default is the safe one.
    $shownRoot = if ($NoRedact) { $StagingRoot } else { Get-RedactedStagingPath $StagingRoot }
    $src = if ($shownRoot) { "SOURCE: $shownRoot" } else { '' }
    $tpl = $tpl.Replace('__DATA__',     $json)
    $tpl = $tpl.Replace('__SUBTITLE__', $subtitle)
    # Avoid System.Web - not loaded by default in PowerShell 7. The source path
    # is the only untrusted-ish string here and needs nothing fancier.
    $srcEsc = $src -replace '&','&amp;' -replace '<','&lt;' -replace '>','&gt;'
    $tpl = $tpl.Replace('__SOURCE__',   $srcEsc)
    $tpl = $tpl.Replace('__STAMP__',    (Get-Date -Format 'yyyy-MM-dd HH:mm'))
    $tpl = $tpl.Replace('__GAME__',     $Game)
    return $tpl
}
