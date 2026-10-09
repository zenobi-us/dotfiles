# New-CharacterSite.ps1 -- a website from a folder of character documents.
#
#     .\New-CharacterSite.ps1 -From <characters folder> -Out <site folder> -Open
#
# WHAT IT IS FOR
#
# Somebody has written their V. It is sitting in a Markdown file nobody will ever
# read, because "read this .md" is a thing you can only ask of other developers.
# This turns the folder into a website: plain HTML, CSS and one small script, no
# build step, no runtime, no account. Copy the output folder anywhere, or
# double-click index.html.
#
# THE ARCHITECTURE IS CSS ZEN GARDEN, AND THAT IS THE WHOLE POINT.
#
# Every character page emits the SAME semantic markup - eyebrow, h1, subhead,
# content, meta, footer - and a per-character stylesheet owns everything about
# how it looks. Not a palette swap: a different world. The Arasaka dossier is
# gold leaf on a kill order, all rigid rules and classification bands. The
# monologue is wet, green, and never quite sits straight. The nomad legend is
# dust and firelight with torn edges. The AI transcript is a terminal that
# discusses a person the same way it would discuss disk usage.
#
# A theme is one CSS file in themes\. Copy default.css, rename it after the
# character, and it is a theme. That is the extension point, and it is why this
# tool does not generate CSS: generated CSS is CSS nobody can edit.
#
# WHY A CHARACTER MUST NOT BE FLATTENED INTO A TEMPLATE
#
# These documents are not four copies of one form - the format IS the
# characterisation. A builder that extracted Name / Lifepath / Backstory into
# fields would make all four the same shape, which is the one outcome that makes
# the site worse than the files it was built from.
#
# WHAT IT READS
#
#   characters\valkyrie\Profile - Valkyrie.md    the document (required)
#   characters\valkyrie\Meta - Valkyrie.md       optional second section
#   characters\valkyrie\media\*.jpg|png|webp     optional images
#   characters\valkyrie\theme.txt                optional theme name
#
# Anything else is ignored, so presets and working notes can live beside the
# document without being published. A folder starting with _ is a draft.

[CmdletBinding()]
param(
    [string] $From = (Join-Path (Get-Location) 'characters'),
    # Beside the install's other records, not in whatever directory the caller
    # happened to be standing in - which for an agent is usually a clone, so the
    # site got written into the source tree. $From stays relative on purpose:
    # it is an INPUT, and pointing it at your own folder of documents is the
    # normal way to use this.
    [string] $Out = "$env:USERPROFILE\Saved Games\CD Projekt Red\Cyberpunk 2077\Cyberwise\reports\site",

    [string] $Title = 'V of Night City',

    [switch] $Open,
    [switch] $IncludeDrafts,

    # Where the stylesheets live. Point this somewhere else to ship your own set.
    [string] $ThemeDir
)

# $PSScriptRoot is EMPTY inside a param default on Windows PowerShell 5.1
# when the script is run with -File or dot-sourced - it is only populated
# under the call operator, and pwsh 7 populates it in every case. So the
# default below is resolved HERE, where it is correct on both engines and
# by every invocation route. See cyberwise/references/environment.md.

if (-not $ThemeDir) { $ThemeDir = (Join-Path (Split-Path -Parent $PSScriptRoot) 'themes') }

# --- upstream guard ---------------------------------------------------------
# Advisory, and only that: silent while this copy matches what shipped, one
# short line when it does not, and it never blocks or changes an exit code.
# Rationale, and why it is deliberately not a PreToolUse hook: UpstreamGuard.ps1.
$cwGuard = Join-Path $PSScriptRoot '..\..\cyberwise\tools\UpstreamGuard.ps1'
if (Test-Path -LiteralPath $cwGuard) { try { . $cwGuard; Invoke-CwStartupGuard } catch { } }


$ErrorActionPreference = 'Stop'

. (Join-Path $PSScriptRoot 'ConvertFrom-Markdown.ps1')

if (-not (Test-Path -LiteralPath $From)) { throw "No such folder: $From" }
if (-not (Test-Path -LiteralPath $ThemeDir)) { throw "No themes folder: $ThemeDir" }

function Get-Slug {
    param([string] $Text)
    $s = ($Text -replace '[^\w\s-]', '' -replace '\s+', '-').ToLower().Trim('-')
    if (-not $s) { $s = 'page' }
    return $s
}
function Get-Esc { param([string] $s) ($s -replace '&', '&amp;' -replace '<', '&lt;' -replace '>', '&gt;' -replace '"', '&quot;') }

# --- front matter ------------------------------------------------------------
#
# The excerpt used to be GUESSED - first line over 70 characters - and a guess is
# exactly wrong for the one line meant to make someone open the file. It is
# authored now, in front matter at the top of the document:
#
#   ---
#   excerpt: She has never once been asked a question she could not answer.
#   chapters:
#     - The Golden Child
#     - Termination With Prejudice
#   ---
#
# Deliberately NOT a YAML parser. Two shapes are supported - "key: value" and a
# list of "- item" under a key - because that is all this needs, and a real YAML
# implementation is a dependency for a file nobody but the author will ever
# write. Anything it does not understand is ignored rather than fatal: a
# document that will not publish because of a stray colon is a worse failure
# than one that publishes without its excerpt.
function Read-FrontMatter {
    param([string[]] $Lines)

    $result = @{ Data = @{}; Body = $Lines }
    if (-not $Lines.Count -or $Lines[0].Trim() -ne '---') { return $result }

    $end = -1
    for ($i = 1; $i -lt $Lines.Count; $i++) {
        if ($Lines[$i].Trim() -eq '---') { $end = $i; break }
    }
    # An opening fence with no closing one is a document that starts with a
    # horizontal rule, not broken front matter. Leave it alone.
    if ($end -lt 0) { return $result }

    $data = @{}
    $key = $null
    for ($i = 1; $i -lt $end; $i++) {
        $line = $Lines[$i]
        if (-not $line.Trim()) { continue }
        if ($line -match '^\s*-\s+(.+)$' -and $key) {
            $data[$key] = @($data[$key]) + $matches[1].Trim().Trim('"', "'")
        } elseif ($line -match '^\s*([A-Za-z][\w-]*)\s*:\s*(.*)$') {
            $key = $matches[1].ToLower()
            $value = $matches[2].Trim().Trim('"', "'")
            if ($value) { $data[$key] = $value } else { $data[$key] = @() }
        }
    }
    return @{ Data = $data; Body = $Lines[($end + 1)..($Lines.Count - 1)] }
}

# ------------------------------------------------------------------ gather ---

$chars = New-Object System.Collections.Generic.List[object]

foreach ($dir in (Get-ChildItem -LiteralPath $From -Directory | Sort-Object Name)) {
    if ($dir.Name.StartsWith('_') -and -not $IncludeDrafts) { continue }

    # "Profile - X.md" by convention, but a folder holding exactly one Markdown
    # file works without it. A convention nobody was told about is a trap.
    $doc = @(Get-ChildItem -LiteralPath $dir.FullName -Filter 'Profile*.md' -File) | Select-Object -First 1
    if (-not $doc) {
        $mds = @(Get-ChildItem -LiteralPath $dir.FullName -Filter '*.md' -File |
                 Where-Object { $_.Name -notlike 'Meta*' })
        if ($mds.Count -eq 1) { $doc = $mds[0] }
    }
    if (-not $doc) { Write-Warning "$($dir.Name): no profile document found, skipped"; continue }

    $meta = @(Get-ChildItem -LiteralPath $dir.FullName -Filter 'Meta*.md' -File) | Select-Object -First 1

    $media = @()
    $mediaDir = Join-Path $dir.FullName 'media'
    if (Test-Path -LiteralPath $mediaDir) {
        $media = @(Get-ChildItem -LiteralPath $mediaDir -File |
                   Where-Object { $_.Extension -match '(?i)^\.(jpe?g|png|webp|gif|avif)$' } | Sort-Object Name)
    }

    $slug = Get-Slug $dir.Name

    # Theme, in order: an explicit theme.txt, a stylesheet named after the
    # character, then default. Naming the file after the character means adding
    # a theme needs no configuration at all.
    $themeFile = Join-Path $dir.FullName 'theme.txt'
    $theme = if (Test-Path -LiteralPath $themeFile) {
        (Get-Content -LiteralPath $themeFile -Raw).Trim()
    } elseif (Test-Path -LiteralPath (Join-Path $ThemeDir "$slug.css")) {
        $slug
    } else {
        'default'
    }
    if (-not (Test-Path -LiteralPath (Join-Path $ThemeDir "$theme.css"))) {
        Write-Warning "$($dir.Name): no theme '$theme' in $ThemeDir - using default"
        $theme = 'default'
    }

    $raw = Get-Content -LiteralPath $doc.FullName -Raw
    $fm = Read-FrontMatter -Lines (($raw -replace "`r`n", "`n") -split "`n")
    $lines = $fm.Body
    $excerpt = "$($fm.Data['excerpt'])".Trim()
    $chapters = @($fm.Data['chapters'])

    # WHEN THE STORY CHANGED, not when the site was built. Nobody returning to a
    # directory of four documents wants to know about the build; they want to
    # know whether there is anything new to read.
    $changed = $doc.LastWriteTime.ToString('yyyy-MM-dd')

    # The document's own H1. It is usually NOT the character's name - "Too Bad,
    # Too Bad", "Campfire Myth", a case number - and that is the useful thing to
    # show, because it says what kind of document this is before it is opened.
    # ...and ONLY when it is the document's ONE H1. A document with several H1s
    # is using them as SECTION headings and has no title line at all. Taking the
    # first anyway got both halves wrong on a plain profile that opens
    # "# Appearance": every page was headlined "Appearance", every directory row
    # said the same word, and - because the title is stripped from the body
    # below so it is not printed twice - a real section heading was silently
    # deleted. Falling back is the honest answer; inventing a title is not.
    $h1s = @($lines | Where-Object { $_ -match '^#\s+\S' })
    $hasTitleLine = ($h1s.Count -eq 1)
    $docTitle = if ($hasTitleLine) { $h1s[0] -replace '^#\s+', '' } else { '' }
    if (-not $docTitle) { $docTitle = "$($fm.Data['title'])".Trim() }
    if (-not $docTitle) { $docTitle = (Get-Culture).TextInfo.ToTitleCase($dir.Name) }

    # The line under the title, and ONLY when the document opens with a header
    # block - a run of LABEL: lines, the way a file or a report does.
    #
    # Taking "the first two lines" unconditionally reprinted the opening
    # paragraph of a prose document immediately above that same paragraph, and
    # on the transcript it reprinted two machine states that the body renders as
    # blocks a centimetre lower. A document that opens by simply starting does
    # not get a subhead, because it does not have one.
    $head = @()
    foreach ($l in ($lines | Select-Object -First 14)) {
        if (-not $l.Trim()) { if ($head.Count) { break } else { continue } }
        if ($l -match '^#') { continue }
        if ($l -cmatch '^[A-Z][A-Z0-9 .,/&()''"-]{0,60}:') { $head += $l.Trim() } else { break }
    }
    $subhead = ''
    if ($head.Count -ge 3) {
        $subhead = ((@($head | Select-Object -First 2) -join '  //  ') -replace '\*', '').Trim()
        if ($subhead.Length -gt 210) { $subhead = $subhead.Substring(0, 207).TrimEnd() + '...' }
    }

    if (-not $excerpt) {
        Write-Warning "$($dir.Name): no 'excerpt:' in front matter - its row will have nothing to paint on hover"
    }
    if ($excerpt.Length -gt 190) { $excerpt = $excerpt.Substring(0, 187).TrimEnd() + '...' }

    # THE DOCUMENT'S OWN H1 BECOMES THE PAGE HEADLINE, so it must not also open
    # the body - every page printed its title twice, once in the theme's display
    # face and again as an ordinary heading a few centimetres below it.
    #
    # Done by index rather than by regex: the pattern has to eat the heading AND
    # the blank line under it, and a multi-line pattern here is one escaping
    # mistake away from silently matching nothing.
    $bodyLines = [System.Collections.Generic.List[string]] $lines
    for ($li = 0; ($hasTitleLine -and $li -lt $bodyLines.Count); $li++) {
        if ($bodyLines[$li] -match '^#\s+\S') {
            $bodyLines.RemoveAt($li)
            while ($li -lt $bodyLines.Count -and -not $bodyLines[$li].Trim()) { $bodyLines.RemoveAt($li) }
            break
        }
    }

    $chars.Add([pscustomobject]@{
        Name      = (Get-Culture).TextInfo.ToTitleCase($dir.Name)
        Slug      = $slug
        Theme     = $theme
        DocTitle  = $docTitle
        Subhead   = $subhead
        Excerpt   = $excerpt
        Chapters  = $chapters
        # A single chapter is not a chapter, it is just the document. Saying
        # "chapter 1 of 1" tells the reader nothing and implies a structure the
        # story does not have.
        Latest    = if ($chapters.Count -gt 1) { $chapters[-1] } else { '' }
        ChapterNo = if ($chapters.Count -gt 1) { $chapters.Count } else { 0 }
        Changed   = $changed
        # A document with no title line keeps all its own headings, so they are
        # pushed down one level to sit under the page's headline rather than
        # competing with it.
        Body      = ConvertTo-Html -Markdown ($bodyLines -join "`n") -HeadingOffset $(if ($hasTitleLine) { 0 } else { 1 })
        MetaBody  = if ($meta) { ConvertTo-Html -Markdown (Get-Content -LiteralPath $meta.FullName -Raw) } else { $null }
        MetaTitle = if ($meta) { ($meta.BaseName -replace '^Meta\s*-\s*', '') } else { $null }
        Media     = $media
        Words     = @(($raw -split '\s+') | Where-Object { $_ }).Count
    })
}

if (-not $chars.Count) { throw "No characters found under $From. Each character is a subfolder with a Profile*.md in it." }

Write-Host ''
Write-Host "$($chars.Count) character(s):" -ForegroundColor Cyan
foreach ($c in $chars) {
    $m = if ($c.Media.Count) { "$($c.Media.Count) image(s)" } else { 'no media' }
    Write-Host ("  {0,-13} theme:{1,-12} {2,6} words, {3}" -f $c.Name, $c.Theme, $c.Words, $m) -ForegroundColor DarkGray
}

# ------------------------------------------------------------------- write ---

if (-not (Test-Path -LiteralPath $Out)) { New-Item -ItemType Directory -Path $Out -Force | Out-Null }
$themeOut = Join-Path $Out 'themes'
if (-not (Test-Path -LiteralPath $themeOut)) { New-Item -ItemType Directory -Path $themeOut -Force | Out-Null }

foreach ($sheet in (@('_base', 'index') + @($chars.Theme) | Select-Object -Unique)) {
    $src = Join-Path $ThemeDir "$sheet.css"
    if (Test-Path -LiteralPath $src) { Copy-Item -LiteralPath $src -Destination (Join-Path $themeOut "$sheet.css") -Force }
}

Set-Content -LiteralPath (Join-Path $Out 'site.js') -Encoding UTF8 -Value @'
// Nothing here fetches. The site has to work opened straight off the
// filesystem, where the browser blocks fetch() from a file:// origin - and
// that is also why it carries no tracking: there is nowhere for it to phone.

var lb = document.querySelector('.lightbox');
if (lb) {
  document.querySelectorAll('.gallery img').forEach(function (img) {
    img.addEventListener('click', function () {
      lb.querySelector('img').src = img.src;
      lb.classList.add('on');
    });
  });
  lb.addEventListener('click', function () { lb.classList.remove('on'); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { lb.classList.remove('on'); }
  });
}
'@

function Write-Page {
    param(
        [string] $File, [string] $PageTitle, [string] $Theme,
        [string] $BodyClass, [string] $Crumb, [string] $Body
    )
    # The index carries NO chrome at all - no wordmark strip, no filter, no
    # breadcrumb. Four stories do not need to be searched, and a bar that names
    # the site above a title already saying it is the site apologising for
    # itself. Document pages keep one link, because a reader deep in a dossier
    # does need the way back.
    $topBar = if ($Crumb) {
        "<div class=""top""><a class=""home"" href=""index.html"">$(Get-Esc $Title)</a><span class=""crumb"">$(Get-Esc $Crumb)</span></div>"
    } else { '' }
    $doc = @"
<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>$(Get-Esc $PageTitle)</title>
<link rel="stylesheet" href="themes/_base.css">
<link rel="stylesheet" href="themes/$Theme.css">
</head><body class="$BodyClass">
<a class="skip" href="#doc">Skip to the document</a>
$topBar
$Body
<script src="site.js"></script>
</body></html>
"@
    Set-Content -LiteralPath (Join-Path $Out $File) -Value $doc -Encoding UTF8
}

# ---- one page per character, all with identical markup ----
foreach ($c in $chars) {
    $gallery = ''
    if ($c.Media.Count) {
        $mediaOut = Join-Path $Out "media\$($c.Slug)"
        New-Item -ItemType Directory -Path $mediaOut -Force | Out-Null
        $imgs = foreach ($m in $c.Media) {
            Copy-Item -LiteralPath $m.FullName -Destination (Join-Path $mediaOut $m.Name) -Force
            "<img src=""media/$($c.Slug)/$([uri]::EscapeDataString($m.Name))"" alt=""$(Get-Esc $c.Name)"" loading=""lazy"">"
        }
        $gallery = "<div class=""gallery"">$($imgs -join '')</div>"
    }

    $metaSection = ''
    if ($c.MetaBody) {
        $metaSection = "<section class=""meta""><h2><span>$(Get-Esc $c.MetaTitle)</span></h2>$($c.MetaBody)</section>"
    }

    # data-title carries the headline to the theme, which prints it a second time
    # underneath, a few pixels off - a plate out of register on a failing press.
    $body = @"
<main class="doc" id="doc">
$(if ($c.DocTitle -ne $c.Name) { "  <p class=""eyebrow"">$(Get-Esc $c.Name)</p>`n" })  <h1 data-title="$(Get-Esc $c.DocTitle)">$(Get-Esc $c.DocTitle)</h1>
  <p class="subhead">$(Get-Esc $c.Subhead)</p>
  $gallery
  <div class="content">
$($c.Body)
  </div>
  $metaSection
  <footer>Last changed $($c.Changed)</footer>
</main>
<div class="lightbox"><img alt=""></div>
"@
    Write-Page -File "$($c.Slug).html" -PageTitle $(if ($c.DocTitle -ne $c.Name) { "$($c.Name) - $($c.DocTitle)" } else { $c.Name }) -Theme $c.Theme `
               -BodyClass "page-doc is-$($c.Slug)" -Crumb $c.Name -Body $body
}

# ---- the directory ----
#
# No numbering, no file count, no build date, no rules between rows. Four
# stories do not need to be enumerated, and every one of those was the page
# describing itself instead of showing itself.
#
# The excerpt is not printed. It is PAINTED ON HOVER, per character, by the
# stylesheet - so the resting state is four names and nothing else, and the
# reader has to reach for anything more.
$rows = foreach ($c in $chars) {
    $chapter = if ($c.Latest) {
        "<span class=""chapter"">Ch. $($c.ChapterNo) &mdash; $(Get-Esc $c.Latest)</span>"
    } else { '' }
    @"
  <li class="file is-$($c.Slug)">
    <a href="$($c.Slug).html">
      <span class="name">$(Get-Esc $c.Name)$chapter$(if ($c.DocTitle -ne $c.Name) { "<span class=""doctitle"">$(Get-Esc $c.DocTitle)</span>" })</span>
      <span class="when"><time datetime="$($c.Changed)">$($c.Changed)</time></span>
      <span class="excerpt" aria-hidden="true"><i>$(Get-Esc $c.Excerpt)</i></span>
    </a>
  </li>
"@
}

$indexBody = @"
<span class="ghost" aria-hidden="true">V</span>
<main class="hub" id="doc">
  <h1 class="wordmark"><span data-t="$(Get-Esc $Title)">$(Get-Esc $Title)</span></h1>
  <ol class="files">
$($rows -join "`n")
  </ol>
</main>
"@
Write-Page -File 'index.html' -PageTitle $Title -Theme 'index' -BodyClass 'page-index' -Crumb '' `
           -Body $indexBody

Write-Host ''
Write-Host "site written to $((Resolve-Path -LiteralPath $Out).Path)" -ForegroundColor Green
Write-Host "  open index.html, or copy the whole folder to any web host" -ForegroundColor DarkGray

if ($Open) { Start-Process (Join-Path $Out 'index.html') }
exit 0
