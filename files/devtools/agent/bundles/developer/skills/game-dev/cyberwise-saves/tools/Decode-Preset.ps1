# Decode-Preset.ps1 -- turn AppearanceChangeUnlocker .preset files into readable
# appearance fields.
#
#     .\Decode-Preset.ps1 -Path <file.preset>
#     .\Decode-Preset.ps1 -Directory <dir>            # each preset in turn
#     .\Decode-Preset.ps1 -Directory <dir> -Compare   # side-by-side table
#
# A .preset line is "LocKey#<n>:<index>". Despite the name, <n> is NOT a
# localization key -- it is the FNV1a-64 hash of the customization GROUP name
# ("hairstyle", "makeupEyes", "piercings"). <index> is the character-creator
# slider number for that group. Confirmed by hashing group names recovered from
# a decompressed save's CharacetrCustomization node and matching them against
# the preset keys.
#
# Colour-bearing groups key themselves as "<base><index>" -- hairstyle 29 stores
# its colour under "hair_color29" -- so two presets with different hairstyles
# legitimately carry different key sets. That is expected, not corruption.
#
# Hash-to-group mappings live in preset-groups.csv beside this script. Keys with
# no known name are printed as "?<hash>" rather than dropped, so a preset is
# never silently reported as smaller than it is.
#
# Most mappings were confirmed by hashing group names recovered from a save. ONE
# was not: "pubic_hair" (13523242420079111419) is identified by OBSERVATION - the
# user changed that setting alone between two presets and this key alone moved
# with it, 5 -> 0. No preimage has been found for it; 133 candidate names hashed
# to nothing. The label is correct; the internal name behind the hash is not
# known, and if one is ever recovered it should replace this entry rather than
# sit beside it.

param(
    [string]$Path,
    [string]$Directory,
    [switch]$Compare,
    [string]$GroupCsv
)

# --- upstream guard ---------------------------------------------------------
# Advisory, and only that: silent while this copy matches what shipped, one
# short line when it does not, and it never blocks or changes an exit code.
# Rationale, and why it is deliberately not a PreToolUse hook: UpstreamGuard.ps1.
$cwGuard = Join-Path $PSScriptRoot '..\..\cyberwise\tools\UpstreamGuard.ps1'
if (Test-Path -LiteralPath $cwGuard) { try { . $cwGuard; Invoke-CwStartupGuard } catch { } }


if (-not $GroupCsv) { $GroupCsv = Join-Path $PSScriptRoot 'preset-groups.csv' }
if (-not (Test-Path $GroupCsv)) { throw "group map not found: $GroupCsv" }

$groups = @{}
foreach ($row in Import-Csv $GroupCsv) { $groups[$row.Hash] = $row.Group }

# Internal group name -> the label the character creator shows. Indexed colour
# groups are matched by prefix, since the trailing number varies with the style.
$labels = [ordered]@{
    'skin_color'        = 'Skin Tone'
    'skin_type'         = 'Skin Type'
    'hairstyle'         = 'Hairstyle'
    'hair_color'        = 'Hair Color'
    'eyes'              = 'Eyes'
    'eyes_color'        = 'Eye Color'
    'eyebrows'          = 'Eyebrows'
    'eyebrows_color'    = 'Eyebrow Color'
    'eyelash_color'     = 'Eyelash Color'
    'nose'              = 'Nose'
    'mouth'             = 'Mouth'
    'jaw'               = 'Jaw'
    'ear'               = 'Ears'
    'cyberware'         = 'Cyberware'
    'scars'             = 'Facial Scars'
    'body_scars'        = 'Body Scars'
    'piercings'         = 'Piercings'
    'teeth'             = 'Teeth'
    'makeupEyes'        = 'Eye Makeup'
    'makeupLips_type'   = 'Lip Makeup Style'
    'makeupLips'        = 'Lip Makeup'
    'makeupCheeks'      = 'Cheek Makeup'
    'makeupPimples'     = 'Blemishes'
    'nails_color_tpp'   = 'Nail Color'
    'nails_color_fpp'   = 'Nail Color (FPP)'
    'breast'            = 'Chest'
    'nipples'           = 'Nipples'
    'genitals'          = 'Genitals'
    'pubic_hair'        = 'Pubic Hair'
    'sedth_eyes_l'      = 'Eye Cyberware (L)'
    'sedth_eyes_r'      = 'Eye Cyberware (R)'
    'sedth_eyes_l_glow' = 'Eye Glow (L)'
    'sedth_eyes_r_glow' = 'Eye Glow (R)'
}

function Get-Label([string]$group) {
    if (-not $group) { return $null }
    if ($labels.Contains($group)) { return $labels[$group] }
    # indexed colour key: strip the trailing option number and label as a colour
    $base = $group -replace '[_]?[0-9]+$', ''
    if ($labels.Contains($base)) { return "$($labels[$base]) Color" }
    return $group
}

function Read-Preset([string]$file) {
    $out = [ordered]@{}
    foreach ($line in Get-Content $file) {
        $parts = $line -split ':'
        if ($parts.Count -ne 2) { continue }
        $hash = $parts[0].Replace('LocKey#', '')
        $value = $parts[1]
        $group = $groups[$hash]
        $label = if ($group) { Get-Label $group } else { "?$hash" }
        $out[$label] = $value
    }
    return $out
}

if ($Path) {
    $data = Read-Preset $Path
    Write-Host ""
    Write-Host ([System.IO.Path]::GetFileNameWithoutExtension($Path))
    Write-Host ("-" * 44)
    foreach ($k in $data.Keys) { "{0,-24} {1}" -f $k, $data[$k] }
    Write-Host ""
    return
}

if ($Directory) {
    $files = Get-ChildItem $Directory -Filter "*.preset" | Sort-Object Name
    if (-not $Compare) {
        foreach ($f in $files) { & $PSCommandPath -Path $f.FullName -GroupCsv $GroupCsv }
        return
    }

    $all = [ordered]@{}
    foreach ($f in $files) { $all[$f.BaseName] = Read-Preset $f.FullName }

    $fields = New-Object System.Collections.Generic.List[string]
    foreach ($n in $all.Keys) {
        foreach ($k in $all[$n].Keys) { if (-not $fields.Contains($k)) { $fields.Add($k) } }
    }

    $names = @($all.Keys)

    # Presets for one character are usually named "<Character> <variant>", so the
    # character name repeats in every column and wastes the width the values need.
    # Strip whatever prefix ALL the names share - derived, never hardcoded, since
    # the shared part is different for every user.
    $prefix = ''
    if ($names.Count -gt 1) {
        $first = $names[0]
        for ($i = 1; $i -le $first.Length; $i++) {
            $cand = $first.Substring(0, $i)
            if ($names | Where-Object { -not $_.StartsWith($cand) }) { break }
            $prefix = $cand
        }
        # Only cut on a word boundary - trimming "Val" off "Jackie"/"Jackson"
        # would be worse than leaving the names alone.
        if ($prefix -notmatch '[\s_-]$') { $prefix = '' }
    }

    $hdr = "{0,-24}" -f 'Field'
    foreach ($n in $names) { $hdr += "{0,-18}" -f $(if ($prefix) { $n.Substring($prefix.Length) } else { $n }) }
    Write-Host ""
    Write-Host $hdr
    Write-Host ("-" * $hdr.Length)
    foreach ($fld in $fields) {
        $line = "{0,-24}" -f $fld
        foreach ($n in $names) {
            $v = if ($all[$n].Contains($fld)) { $all[$n][$fld] } else { '.' }
            $line += "{0,-18}" -f $v
        }
        Write-Host $line
    }
    Write-Host ""
    Write-Host "'.' = group absent from that preset (usually a colour key for a style it does not use)"
    return
}

throw "supply -Path <file.preset> or -Directory <dir> [-Compare]"
