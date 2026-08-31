# Get-MouseProfile.ps1 -- read the key remaps a Corsair iCUE profile puts on a
# programmable mouse, so they can be joined to what the game does with them.
#
#     .\Get-MouseProfile.ps1                      # every action, every profile
#     .\Get-MouseProfile.ps1 -List                # just the profiles, by name
#     .\Get-MouseProfile.ps1 -ProfileName Cyberpunk
#
# ---------------------------------------------------------------------------
# A PERIPHERAL PROFILE IS A LAYER, NOT A SIXTH BINDING STORE
# ---------------------------------------------------------------------------
#
# This tool is deliberately NOT part of Get-Hotkeys.ps1's five-store harvest,
# and the reason is the whole point of it.
#
# The five stores answer "what does the game do when this key arrives". A mouse
# profile answers a different question: "which physical button SENDS that key".
# A Scimitar performs no game action at all - it emits a keystroke, and the game
# or a mod then interprets it exactly as though it had come from the keyboard.
# So the profile does not sit BESIDE the five stores as a sixth source of
# bindings; it sits ON TOP of them, and the only useful output is the join:
#
#     physical button  ->  keystroke sent  ->  what that keystroke is bound to
#
# Listing "G9 = Lean Left" on its own is the mouse vendor's label for the macro,
# which is a note the user typed into iCUE months ago. It is not evidence of
# anything. The label can be stale, the mod can have been rebound, or the
# keystroke can be bound to nothing at all - in which case that button is DEAD,
# and nothing but the join will ever say so.
#
# Hence: this tool reports what the DEVICE sends, honestly and with no game
# knowledge, and the caller joins it to Get-Hotkeys.ps1's rows. Keeping the two
# apart is what keeps Get-Hotkeys.ps1's contract intact - it still returns
# bindings, and a mouse action is not a binding.
#
# ---------------------------------------------------------------------------
# The file format, since ".cueprofiledata" says nothing about it
# ---------------------------------------------------------------------------
#
#   %APPDATA%\Corsair\CUE5\profiles\
#       tree.cueprofileorder            profile names -> GUIDs, in display order
#       {guid}.cueprofiledata           one profile
#
# Both are XML despite the extensions, serialised by the cereal C++ library, so
# the root element is <cereal> and the shape is cereal's rather than anything
# designed to be read. Repeated things are <value0>, <value1>, ... under a
# `size="dynamic"` parent, which is why nothing here can be addressed by a fixed
# path - the slot numbers mean nothing but order.
#
# An action lives under <actions> and has two halves:
#
#   <first>   the action:  <base><name> is the label the user typed, <keyName>
#             is the keystroke it emits.
#   <second>  the trigger: <key> is the PHYSICAL button (MouseG9, MouseDpiToggle,
#             ...), <event> is Click/Press/Release, <layer> the iCUE layer.
#
# <second><key> is routinely EMPTY. That is an action the user built and then
# unassigned - it exists in the profile and no button fires it. Reporting one as
# a live mouse button is how a cheatsheet invents a control that does not exist,
# so an empty trigger is carried through as empty rather than dropped: "this
# action is assigned to nothing" is a finding.
#
# Not every action emits a keystroke either. Macros, DPI changes and launchers
# have no <keyName>, and there is nothing this tool can honestly say about what
# they do - they are reported with Kind='other' and an empty Key.
#
# ---------------------------------------------------------------------------
# Degrading, which is the normal case
# ---------------------------------------------------------------------------
#
# MOST PEOPLE HAVE NO CORSAIR DEVICE. No folder, no profiles, or XML this cannot
# parse must all produce a clear "no iCUE profiles found" and NO rows - never an
# error. A hotkey sheet that fails to build because the user does not own a
# particular brand of mouse is a worse tool than one that never mentioned mice.

[CmdletBinding()]
param(
    # Where iCUE 5 keeps its profiles. Left empty, the standard per-user path.
    [string] $Root,

    # One profile by its display name (the name shown in iCUE, not the GUID
    # filename). Matched case-insensitively. Unmatched is a warning, not an
    # error - the profile may simply have been renamed.
    [string] $ProfileName,

    # Enumerate the profiles instead of their contents: name, GUID, how many
    # key remaps each holds. The filenames are opaque GUIDs, so this is the only
    # way to find out what -ProfileName will accept.
    [switch] $List
)

# ============================================================ key name table ==
#
# iCUE names a key after every glyph printed on it, so the shift pair comes
# along for the ride: the '.' key is `PeriodAndBiggerThan`. Nobody reads that as
# a key. Letters, digits and F-keys are already their own names and need no
# entry.
#
# EXTENDED ONLY FROM PROFILES ACTUALLY READ. An unrecognised name passes through
# VERBATIM rather than being guessed at from the pattern - a sheet that prints
# the wrong glyph for a key is worse than one that prints an ugly correct name,
# because the wrong glyph is believed.
$script:KeyNames = @{
    'PeriodAndBiggerThan'  = '.'
    'CommaAndLessThan'     = ','
    'BracketLeft'          = '['
    'BracketRight'         = ']'
    'MinusAndUnderscore'   = '-'
    'EqualsAndPlus'        = '='
    'GraveAccentAndTilde'  = '`'
    'SemicolonAndColon'    = ';'
    'ApostropheAndDoubleQuote' = "'"
    'KeypadPlus'           = 'Numpad +'
    'Mouse3'               = 'Middle Mouse'
}

function Format-CueKey {
    param([string] $Name)
    if (-not $Name) { return '' }
    if ($script:KeyNames.ContainsKey($Name)) { return $script:KeyNames[$Name] }
    return $Name
}

# The physical button. `MouseG9` is the profile's internal id; `G9` is what is
# printed on the side of a Scimitar and what the user will look for.
function Format-CueButton {
    param([string] $Id)
    if (-not $Id) { return '' }
    if ($Id -match '^MouseG(\d+)$') { return "G$($matches[1])" }
    switch ($Id) {
        'MouseDpiToggle' { return 'DPI' }
        'MouseSniper'    { return 'Sniper' }
        default          { return ($Id -replace '^Mouse', '' -creplace '([a-z])([A-Z])', '$1 $2') }
    }
}

# ================================================================== profiles ==

if (-not $Root) { $Root = [IO.Path]::Combine([string]$env:APPDATA, 'Corsair\CUE5\profiles') }

# Every exit below this point is the same exit: say what was looked for, say
# nothing was there, return no rows. The caller decides whether that matters.
function Out-NoProfiles {
    param([string] $Why)
    Write-Warning "no iCUE profiles found - $Why (looked in '$Root')"
}

if (-not (Test-Path -LiteralPath $Root)) {
    Out-NoProfiles 'that folder does not exist, which is normal unless iCUE 5 is installed'
    return @()
}

$files = @(Get-ChildItem -LiteralPath $Root -Filter *.cueprofiledata -File -ErrorAction SilentlyContinue |
           Sort-Object Name)
if (-not $files.Count) {
    Out-NoProfiles 'the folder holds no .cueprofiledata files'
    return @()
}

# tree.cueprofileorder maps each GUID to the name the user sees and fixes the
# display order. Without it the profiles are still readable - they carry their
# own <profile><name> - but they would be listed in filename order, which is
# GUID order, which is meaningless. Optional on purpose: a missing tree file is
# a cosmetic loss, not a reason to report nothing.
$orderOf = @{}
$treePath = [IO.Path]::Combine($Root, 'tree.cueprofileorder')
if (Test-Path -LiteralPath $treePath) {
    try {
        [xml]$tree = Get-Content -LiteralPath $treePath -Raw
        $i = 0
        foreach ($node in $tree.SelectNodes('//data[base/name][id]')) {
            $id = $node.SelectSingleNode('id')
            if ($id -and $id.InnerText -match '^\{.+\}$') { $orderOf[$id.InnerText] = $i++ }
        }
    } catch {
        Write-Verbose "tree.cueprofileorder did not parse ($($_.Exception.Message)); falling back to filename order"
    }
}

$profiles = New-Object System.Collections.Generic.List[object]
foreach ($f in $files) {
    # A profile mid-write, or one from a version this does not understand, must
    # cost only itself. Skipping one file and reading the rest is always better
    # than reporting nothing because one was unreadable.
    try {
        [xml]$doc = Get-Content -LiteralPath $f.FullName -Raw
    } catch {
        Write-Warning "skipped '$($f.Name)' - it is not readable XML ($($_.Exception.Message))"
        continue
    }

    $nameNode = $doc.SelectSingleNode('/cereal/profile/name')
    if (-not $nameNode) { $nameNode = $doc.SelectSingleNode('//profile/name') }
    $pname = if ($nameNode) { $nameNode.InnerText } else { [IO.Path]::GetFileNameWithoutExtension($f.Name) }
    $pguid = [IO.Path]::GetFileNameWithoutExtension($f.Name)

    # iCUE records which executables a profile auto-activates for. That is the
    # only NON-GUESSED answer to "which of these profiles is the Cyberpunk one" -
    # a name match is a heuristic and a remap count is a worse one, but a profile
    # linked to Cyberpunk2077.exe was pointed at the game by the user themselves.
    # Frequently empty (a profile switched by hand links nothing), so a caller
    # still needs a fallback.
    $linked = @($doc.SelectNodes('//profile/linkedProgramsPaths/*') |
                ForEach-Object { $_.InnerText } | Where-Object { $_ })

    $rows = New-Object System.Collections.Generic.List[object]
    $slot = 0
    foreach ($entry in $doc.SelectNodes('//actions/*')) {
        $data = $entry.SelectSingleNode('first/ptr_wrapper/data')
        if (-not $data) { continue }

        $label = $data.SelectSingleNode('base/name')
        $keyNm = $data.SelectSingleNode('keyName')
        $second = $entry.SelectSingleNode('second')

        # The device this action belongs to. The nearest ancestor <value> is the
        # payload of a <valueN><key>DEVICE NAME</key><value>...</value> pair, so
        # the device is that value's preceding <key> sibling. Absent on a
        # profile shape this has not seen - blank rather than wrong.
        $devNode = $entry.SelectSingleNode('ancestor::value[1]/preceding-sibling::key[1]')

        $btnId = if ($second) { $b = $second.SelectSingleNode('key'); if ($b) { $b.InnerText } else { '' } } else { '' }
        $ev    = if ($second) { $e = $second.SelectSingleNode('event'); if ($e) { $e.InnerText } else { '' } } else { '' }
        $ly    = if ($second) { $l = $second.SelectSingleNode('layer'); if ($l) { $l.InnerText } else { '' } } else { '' }

        $rows.Add([pscustomobject]@{
            Profile   = $pname
            ProfileId = $pguid
            Linked    = ($linked -join '; ')
            File      = $f.FullName
            Device    = if ($devNode) { $devNode.InnerText } else { '' }
            Slot      = $entry.Name
            Order     = $slot++
            # An action with no <keyName> sends no keystroke, so there is nothing
            # to join it to. Say which kind it is rather than pretending.
            Kind      = if ($keyNm -and $keyNm.InnerText) { 'key remap' } else { 'other' }
            Action    = if ($label) { $label.InnerText } else { '' }
            KeyName   = if ($keyNm) { $keyNm.InnerText } else { '' }
            Key       = if ($keyNm) { Format-CueKey $keyNm.InnerText } else { '' }
            ButtonId  = $btnId
            Button    = Format-CueButton $btnId
            Event     = $ev
            Layer     = $ly
        })
    }

    $profiles.Add([pscustomobject]@{
        Name    = $pname
        Id      = $pguid
        Linked  = ($linked -join '; ')
        File    = $f.FullName
        Order   = if ($orderOf.ContainsKey($pguid)) { $orderOf[$pguid] } else { 1000 + $profiles.Count }
        Rows    = $rows
        Remaps  = @($rows | Where-Object { $_.Kind -eq 'key remap' }).Count
    })
}

if (-not $profiles.Count) {
    Out-NoProfiles 'none of the files in it could be read'
    return @()
}

$profiles = @($profiles | Sort-Object Order, Name)

if ($ProfileName) {
    $want = @($profiles | Where-Object { $_.Name -ieq $ProfileName })
    if (-not $want.Count) {
        Write-Warning ("no iCUE profile named '$ProfileName' - this machine has: " +
                       (($profiles | ForEach-Object { $_.Name }) -join ', '))
        return @()
    }
    $profiles = $want
}

# ------------------------------------------------------------------ listing --
#
# The filenames are GUIDs, so without this there is no way to discover what
# -ProfileName will accept short of opening the XML by hand.
if ($List) {
    Write-Host "iCUE profiles in $Root" -ForegroundColor Cyan
    Write-Host ''
    foreach ($p in $profiles) {
        $devs = @($p.Rows | Where-Object { $_.Device } | ForEach-Object { $_.Device } | Select-Object -Unique)
        Write-Host ("  {0,-24} {1,3} key remap(s)   {2}" -f $p.Name, $p.Remaps, ($devs -join ', '))
        Write-Host ("  {0,-24} {1}" -f '', $p.Id) -ForegroundColor DarkGray
        if ($p.Linked) { Write-Host ("  {0,-24} auto-activates for: {1}" -f '', $p.Linked) -ForegroundColor DarkGray }
    }
    Write-Host ''
    return @()
}

$out = @($profiles | ForEach-Object { $_.Rows })
if (-not $out.Count) {
    Write-Warning "the iCUE profiles on this machine hold no actions at all - nothing to report"
}
return $out
