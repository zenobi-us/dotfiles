# ConvertFrom-Markdown.ps1 -- the small Markdown subset these documents use.
#
#     . .\ConvertFrom-Markdown.ps1
#     ConvertTo-Html -Markdown (Get-Content x.md -Raw)
#
# WHY THIS EXISTS RATHER THAN A LIBRARY
#
# The whole point of this skill is that somebody with no patience can run one
# command and get a website. A Markdown library means a package manager, which
# means Python or Node, which is the barrier we are removing. PowerShell ships
# with Windows; nothing else here needs to.
#
# So this handles the subset the character documents actually contain - headings,
# bullets (nested), tables, bold, italic, code, links, rules, blockquotes,
# paragraphs - and nothing else. It is deliberately NOT a CommonMark
# implementation, and where it meets something it does not know it passes the
# text through rather than mangling it.
#
# HTML-ESCAPE FIRST, THEN MARK UP. The documents are full of `<`, `&` and quote
# characters ("L5//YOMOTSU//NO-EXT", ampersands in prose). Escaping after
# inserting tags would eat the tags; escaping before means every `<` in the
# source is inert by the time any markup is added.

# --- upstream guard ---------------------------------------------------------
# Advisory, and only that: silent while this copy matches what shipped, one
# short line when it does not, and it never blocks or changes an exit code.
# Rationale, and why it is deliberately not a PreToolUse hook: UpstreamGuard.ps1.
$cwGuard = Join-Path $PSScriptRoot '..\..\cyberwise\tools\UpstreamGuard.ps1'
if (Test-Path -LiteralPath $cwGuard) { try { . $cwGuard; Invoke-CwStartupGuard } catch { } }

function ConvertTo-HtmlText {
    <#
    .SYNOPSIS
        Escape HTML, then apply inline markup: code, bold, italic, links.
    .DESCRIPTION
        Order matters. Code spans are extracted FIRST and put back LAST, so that
        `**not bold**` inside backticks survives as literal asterisks - which is
        the only way to write them, and something these documents do.
    #>
    param([string] $Text)

    if ($null -eq $Text) { return '' }

    # Code spans out first, replaced by a placeholder no document can contain.
    $codes = New-Object System.Collections.Generic.List[string]
    $Text = [regex]::Replace($Text, '`([^`]+)`', {
        param($m)
        $codes.Add($m.Groups[1].Value)
        "`u{E000}CODE$($codes.Count - 1)`u{E000}"
    })

    $Text = $Text -replace '&', '&amp;' -replace '<', '&lt;' -replace '>', '&gt;'

    # Links before emphasis: a title containing an asterisk would otherwise be
    # split across the anchor.
    $Text = [regex]::Replace($Text, '\[([^\]]+)\]\(([^)\s]+)\)', '<a href="$2">$1</a>')

    # Bold before italic, and both non-greedy. Underscores are NOT emphasis here:
    # these documents are full of file names and IDs that contain them.
    $Text = [regex]::Replace($Text, '\*\*(.+?)\*\*', '<strong>$1</strong>')
    $Text = [regex]::Replace($Text, '(?<!\*)\*(?!\s)(.+?)(?<!\s)\*(?!\*)', '<em>$1</em>')

    # DOCUMENT MARKERS. These are not Markdown - they are the furniture of the
    # in-world documents this renders, and tagging them is what lets a theme
    # treat a classification stamp as a stamp and a redaction as an object lying
    # on the page, instead of as more prose.
    #
    # Both run AFTER links, so a [label](url) has already become an anchor and
    # cannot be mistaken for a redacted passage.
    #
    #   (L5//YOMOTSU//NO-EXT)              a classification marker
    #   [Interview ended prematurely...]   a redaction or an editor's note
    $Text = [regex]::Replace($Text, '\((L\d[^)]*)\)', '<span class="cls">$1</span>')
    $Text = [regex]::Replace($Text, '\[([^\]]{8,})\]', '<span class="redact">$1</span>')

    for ($i = 0; $i -lt $codes.Count; $i++) {
        $safe = $codes[$i] -replace '&', '&amp;' -replace '<', '&lt;' -replace '>', '&gt;'
        $Text = $Text.Replace("`u{E000}CODE$i`u{E000}", "<code>$safe</code>")
    }
    return $Text
}

function ConvertTo-Html {
    <#
    .SYNOPSIS
        A Markdown document as HTML fragment (no <html>, no <body>).
    .OUTPUTS
        [string] the fragment.
    #>
    param(
        [Parameter(Mandatory)] [AllowEmptyString()] [string] $Markdown,

        # Push every heading down N levels. The page supplies its own <h1> for
        # the headline, and the themes style a BARE h1 as display type - up to
        # 76px, uppercase, with a misregistration layer. A document whose own
        # sections are written as "# Section" would render each one in that
        # face. Offsetting keeps one h1 per page and puts the sections back at
        # the size they are meant to be.
        [ValidateRange(0, 5)] [int] $HeadingOffset = 0
    )

    $lines = ($Markdown -replace "`r`n", "`n") -split "`n"
    $out = New-Object System.Collections.Generic.List[string]

    # Open-block state. The depth and table flags are script-scoped because the
    # closers below are nested functions that mutate them; the alternative is
    # threading two counters through every branch of the loop.
    $para = New-Object System.Collections.Generic.List[string]
    $script:listDepth = 0
    $script:inTable = $false
    # Per-level: was this list opened inside an <li> that still needs closing?
    $script:liOpen = @{}

    # A FIELD BLOCK IS NOT A PARAGRAPH.
    #
    # Markdown says consecutive lines are one paragraph, and for prose that hard-
    # wraps mid-sentence that is right. But an in-world document opens with one
    # field per line:
    #
    #     SUBJECT: VALERIE AURUM CLEMENS / ID NC770416
    #     CODENAME: VALKYRIE
    #     AKAS: "V", "GOLDEN CHILD"
    #
    # Joining those with spaces turns a form into a run-on sentence and throws
    # away the thing that makes the document read as a document. So a line whose
    # label is a colon-terminated run of capitals - or which opens with the
    # document's own `//` and `\\` markers - keeps its own line.
    # (?-i) IS LOAD-BEARING. PowerShell's -match is case-INSENSITIVE by default,
    # which makes [A-Z] match lowercase and turns "all-caps label" into "any word
    # followed by a colon" - so ordinary prose beginning "Constant across every
    # look: palest skin..." was treated as a field and broken at its wrap points.
    # The opposite failure of the one this heuristic exists to fix, from the same
    # line of code.
    $labelLine = '(?-i)^\s*(?:[A-Z][A-Z0-9 .,/&()''"-]{0,60}:|//|\\\\)'

    function Close-Para {
        if ($para.Count) {
            $sb = New-Object System.Text.StringBuilder
            for ($k = 0; $k -lt $para.Count; $k++) {
                if ($k -gt 0) {
                    $joinWithBreak = ($para[$k] -match $labelLine) -or ($para[$k - 1] -match $labelLine)
                    [void]$sb.Append($(if ($joinWithBreak) { '<br>' } else { ' ' }))
                }
                [void]$sb.Append((ConvertTo-HtmlText $para[$k]))
            }
            # WHAT KIND OF PARAGRAPH IS THIS? A theme cannot ask, so the answer
            # has to be in the class list.
            #
            #   .allcaps  a single line carrying no lowercase - a reference
            #             number, a machine state, END REPORT. Restricted to one
            #             line on purpose: the dossier's opening field block is
            #             also all capitals, and it is a form, not a stamp.
            #   .brief    short enough to be a beat rather than a paragraph -
            #             the aside, the interruption, the one-line answer.
            $joined = ($para -join ' ').Trim()
            $cls = @()
            if ($para.Count -eq 1 -and $joined -cmatch '^[^a-z]+$' -and $joined -cmatch '[A-Z]{2}') {
                $cls += 'allcaps'
            } elseif ($joined.Length -lt 150) {
                $cls += 'brief'
            }
            $attr = if ($cls.Count) { " class=""$($cls -join ' ')""" } else { '' }

            [void]$out.Add("<p$attr>$($sb.ToString())</p>")
            $para.Clear()
        }
    }
    # Closing one level: shut the <ul>, and if that list was opened inside an
    # item, shut the item it interrupted.
    function Close-Level {
        [void]$out.Add('</ul>')
        $script:listDepth--
        if ($script:liOpen[$script:listDepth]) {
            [void]$out.Add('</li>')
            $script:liOpen[$script:listDepth] = $false
        }
    }
    function Close-List {
        while ($script:listDepth -gt 0) { Close-Level }
    }
    function Close-Table {
        if ($script:inTable) { [void]$out.Add('</tbody></table>'); $script:inTable = $false }
    }

    for ($i = 0; $i -lt $lines.Count; $i++) {
        $line = $lines[$i]
        $trim = $line.Trim()

        # --- blank: closes a paragraph, but not a list (a list may have blank
        # lines between items and still be one list).
        if (-not $trim) { Close-Para; continue }

        # --- table row. Detected on the pipe, and only accepted when the NEXT
        # line is a separator, so a prose line containing a pipe is not eaten.
        if ($trim.StartsWith('|') -and $trim.EndsWith('|')) {
            $cells = @($trim.Trim('|') -split '(?<!\\)\|' | ForEach-Object { $_.Trim() -replace '\\\|', '|' })
            $isSep = ($cells | Where-Object { $_ -match '^:?-{2,}:?$' }).Count -eq $cells.Count

            if ($isSep) { continue }   # the ---|--- line itself renders nothing

            if (-not $script:inTable) {
                $next = if ($i + 1 -lt $lines.Count) { $lines[$i + 1].Trim() } else { '' }
                $nextCells = @($next.Trim('|') -split '\|' | ForEach-Object { $_.Trim() })
                $nextIsSep = $next.StartsWith('|') -and
                             ($nextCells | Where-Object { $_ -match '^:?-{2,}:?$' }).Count -eq $nextCells.Count
                if ($nextIsSep) {
                    Close-Para; Close-List
                    $script:inTable = $true
                    $head = ($cells | ForEach-Object { "<th>$(ConvertTo-HtmlText $_)</th>" }) -join ''
                    [void]$out.Add("<table><thead><tr>$head</tr></thead><tbody>")
                    continue
                }
            } else {
                $row = ($cells | ForEach-Object { "<td>$(ConvertTo-HtmlText $_)</td>" }) -join ''
                [void]$out.Add("<tr>$row</tr>")
                continue
            }
        }
        Close-Table

        # --- heading
        if ($trim -match '^(#{1,6})\s+(.*)$') {
            Close-Para; Close-List
            $level = [Math]::Min(6, $matches[1].Length + $HeadingOffset)
            [void]$out.Add("<h$level>$(ConvertTo-HtmlText $matches[2])</h$level>")
            continue
        }

        # --- horizontal rule. Checked before the list, or `---` reads as nothing
        # and before emphasis, or it reads as a dash run.
        if ($trim -match '^(-{3,}|\*{3,}|_{3,})$') {
            Close-Para; Close-List
            [void]$out.Add('<hr>')
            continue
        }

        # --- blockquote
        if ($trim -match '^>\s?(.*)$') {
            Close-Para; Close-List
            [void]$out.Add("<blockquote>$(ConvertTo-HtmlText $matches[1])</blockquote>")
            continue
        }

        # --- list item, with indentation as depth. Four spaces or a tab per
        # level, which is what the profiles use.
        if ($line -match '^(\s*)[-*+]\s+(.*)$') {
            Close-Para
            $indent = $matches[1] -replace "`t", '    '
            $want = [int]([math]::Floor($indent.Length / 4)) + 1

            # A NESTED LIST BELONGS INSIDE ITS PARENT ITEM, not beside it. The
            # first version emitted </li> then <ul>, which every browser renders
            # correctly and no validator accepts - and which loses the
            # indentation entirely in a reader-mode view. So when the level goes
            # up, reopen the item just closed and put the sublist in it.
            while ($script:listDepth -lt $want) {
                if ($script:listDepth -gt 0 -and $out.Count -and $out[$out.Count - 1].EndsWith('</li>')) {
                    $out[$out.Count - 1] = $out[$out.Count - 1] -replace '</li>$', ''
                    $script:liOpen[$script:listDepth] = $true
                }
                [void]$out.Add('<ul>')
                $script:listDepth++
            }
            while ($script:listDepth -gt $want) { Close-Level }
            [void]$out.Add("<li>$(ConvertTo-HtmlText $matches[2])</li>")
            continue
        }
        Close-List

        # --- anything else is prose. Consecutive lines join into one paragraph,
        # because these documents hard-wrap mid-sentence.
        [void]$para.Add($trim)
    }

    Close-Para; Close-List; Close-Table
    return ($out -join "`n")
}
