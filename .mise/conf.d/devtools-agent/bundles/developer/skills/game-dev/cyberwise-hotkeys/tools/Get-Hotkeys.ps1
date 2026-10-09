# Get-Hotkeys.ps1 -- harvest the ACTUAL key bindings from a Cyberpunk install.
#
# Emits one object per binding: Mod, Action, Key, Pad, Context, Source, System.
# Nothing here is hand-transcribed; every key comes off disk.
#
# ---------------------------------------------------------------------------
# The four systems that own bindings, none of which agree on a format
# ---------------------------------------------------------------------------
#
#   r6\input\*.xml
#       One file per mod. Declares that mod's actions, the input contexts they
#       are live in, and a default key as an IK_ name. A binding the user can
#       rebind carries an `overridableUI` id linking it to a Mod Settings entry.
#
#   r6\cache\inputUserMappings.xml
#       Input Loader's MERGED output - every mod's xml plus vanilla, resolved
#       into one file, regenerated at launch. This is the only place
#       `buttonGroup` indirections are resolved, so it is the authority for
#       ids like `DH_Keyboard_Binding` that mean nothing on their own.
#       Being regenerated at launch, it can lag a mod installed since.
#
#   red4ext\plugins\mod_settings\user.ini
#       The user's ACTUAL rebinds, keyed by that `overridableUI` id.
#       WINS over the xml default. Applied at runtime, so it is NOT reflected
#       in the cache - you have to lay it over the top yourself.
#
#   bin\x64\plugins\cyber_engine_tweaks\bindings.json
#       CET hotkeys, as packed virtual-key codes rather than names. 0 = unbound,
#       which most of them are.
#
#   bin\x64\plugins\cyber_engine_tweaks\mods\<mod>\**\*.json
#       Some CET mods ignore the central store and keep their own config, as
#       IK_ names. Nothing obliges them to use CET's binding registry, so a key
#       can be live in game and absent from every store above. Rare but not
#       negligible - and the ones that do it are toggles you press constantly.
#
# All five are optional. A load order of nothing but .archive files has none of
# them, and the correct output for that install is no rows at all - every read
# below is guarded, and the script says so rather than looking broken.
#
# ---------------------------------------------------------------------------
# The CET packing, since it is undocumented and cost some time
# ---------------------------------------------------------------------------
#
# A binding is a 64-bit int holding up to four VK codes in 16-bit slots, first
# key highest: `value >> 48` is the primary key. Verified against a
# hand-written sheet - 62205969853054976 >> 48 = 221 = VK_OEM_6 = ']'.
#
# Two other traps worth knowing:
#   * bindings.json has keys differing only in case (HideMeshes / hideMeshes),
#     so ConvertFrom-Json needs -AsHashtable or it throws.
#   * IK_F1_1 / IK_F2_2 are not real keys. Enhanced Vehicle System invents
#     composite ids for its chorded bindings; they mean "F1 then 1".

[CmdletBinding()]
param(
    # Where Cyberpunk 2077 is installed. Left empty, the install is located from
    # the storefront records on this machine - see Resolve-GameRoot below.
    [string] $GameRoot,
    [switch] $IncludeGamepad,

    # Include the keys the BASE GAME claims (r6\config\inputUserMappings.xml).
    # Off by default because 99 vanilla rows would swamp a report about mods.
    [switch] $IncludeBaseGame,

    # Answer one question: is this key safe to bind? Exits 1 if anything already
    # claims it. THIS IS THE GATE - see the comment on Get-BaseGameKeys.
    #
    # Any spelling of the key is accepted and they all agree: `.`, `Period` and
    # `IK_Period` are one key here, because the stores disagree about how to
    # write it and the user should not have to guess which one to ask about.
    [string] $CheckKey,

    # Inventory the PHYSICAL inputs instead of the bindings. Read the comment on
    # Get-InputDevices before deciding this is a curiosity.
    [switch] $Devices
)



# ======================================================== physical inputs ====
#
# WHY A HOTKEY TOOL ENUMERATES HARDWARE
#
# On 2026-08-22 a Cyberpunk install lost its CET overlay. Five hours went into
# software: five binding stores, CET config and state files, the D3D12 render
# hook, ReShade, RTSS, Discord, DisplayFusion, Game Bar, Windows accessibility
# filters, keyboard filter drivers, and 425 mods parked in a bisect round.
#
# The cause was a second keyboard - an Apple Magic Keyboard cabled to a dock,
# switched OFF, still enumerating. On power transition it emitted key-downs with
# no matching key-up. CET believed a key was permanently held, so every binding
# it captured became a chord (the stored value decoded to VK 255 + Delete) and no
# plain keypress ever matched it again.
#
# `Win32_Keyboard` reported FOUR keyboards the whole time. Nothing asked.
#
# So: for any input problem, inventory the physical inputs BEFORE the software.
# One WMI query answers in a second what a day of elimination will not, and a
# second keyboard nobody remembers owning is not an exotic case - docks, KVMs,
# laptops with a built-in board, and RGB software with virtual HID endpoints all
# produce one.
function Get-InputDevices {
    $out = New-Object System.Collections.Generic.List[object]

    foreach ($d in (Get-PnpDevice -Class Keyboard -Status OK -ErrorAction SilentlyContinue)) {
        # A VIRTUALDEVICE endpoint is created by software (RGB suites, macro
        # tools, remote-desktop agents). It injects at driver level, so its
        # events look like real hardware to every hook above it - which is
        # exactly why "nothing is injecting" can be measured and still be wrong.
        $virtual = $d.InstanceId -match 'VIRTUALDEVICE|^ROOT'
        $out.Add([pscustomobject]@{
            Kind     = 'keyboard'
            Name     = $d.FriendlyName
            Id       = $d.InstanceId
            Virtual  = [bool]$virtual
            Vendor   = if ($d.InstanceId -match 'VID_([0-9A-F]{4})') { $matches[1] } else { '' }
        })
    }
    return $out
}

# Vendor ids worth naming, because "VID_05AC" means nothing at 2am and "Apple"
# means everything. Not exhaustive - an unknown id is printed as the raw value
# rather than guessed at.
$script:KnownVendors = @{
    '05AC' = 'Apple'; '1B1C' = 'Corsair'; '046D' = 'Logitech'; '1532' = 'Razer'
    '0B05' = 'ASUS';  '045E' = 'Microsoft'; '04D9' = 'Holtek (many OEM boards)'
    '3434' = 'Keychron'; '320F' = 'Glorious'; '1E7D' = 'ROCCAT'; '0853' = 'Topre'
}

# ========================================================= base-game claims ==
#
# WHY THIS EXISTS, AND WHY IT IS NOT OPTIONAL BEFORE PROPOSING A KEY
#
# This script harvested 58 bindings on the install it was written against and
# every one of them belonged to a MOD. It knew nothing about the game's own
# keys - so asked "is F9 free?", it would have said yes, and F9 is quickload.
#
# On 2026-08-22 that is exactly what happened: a diagnostic hotkey was bound to
# F9 to test whether the CET overlay would open, and pressing it would have
# reloaded the user's save. A test key that also does something in the game
# makes the result unreadable - you cannot tell "the tool responded" from "the
# game did its own thing" - so this is a correctness problem, not a nuisance.
#
# The claims are read from the install rather than hardcoded. A table of vanilla
# defaults typed out here would be right until the next patch and wrong
# silently after it; the game ships its own answer and it is 74 KB of XML.
function Get-BaseGameKeys {
    param([string] $Root)

    $out = New-Object System.Collections.Generic.List[object]
    $path = [IO.Path]::Combine($Root, 'r6\config\inputUserMappings.xml')
    if (-not (Test-Path -LiteralPath $path)) { return $out }

    # Deliberately a regex over the raw text rather than an XML parse: the file
    # carries duplicate attribute names in places, which [xml] rejects outright,
    # and a hard failure here would take the whole hotkey report with it.
    $raw = Get-Content -LiteralPath $path -Raw
    foreach ($m in [regex]::Matches($raw, '<button\s+id="IK_([A-Za-z0-9_]+)"([^>]*)>')) {
        $key = $m.Groups[1].Value
        $rest = $m.Groups[2].Value
        $action = if ($rest -match '(?:overridableUI|action)="([^"]+)"') { $matches[1] } else { '' }
        if (-not $action) { continue }
        $out.Add([pscustomobject]@{
            Mod = 'Cyberpunk 2077'; Action = $action; Key = $key
            Pad = ''; Context = 'base game'; Source = 'game default'; System = 'base game'
        })
    }
    # One key can carry several actions across contexts; one row per key is what
    # a "who claims this?" question needs.
    $out | Group-Object Key | ForEach-Object {
        $g = $_.Group
        [pscustomobject]@{
            Mod = 'Cyberpunk 2077'
            Action = (($g.Action | Sort-Object -Unique) -join ', ')
            Key = $_.Name; Pad = ''; Context = 'base game'
            Source = 'game default'; System = 'base game'
        }
    }
}

# ============================================================= install lookup ==

# Every store this script reads is a path under the game root, and no two
# storefronts record that path the same way. Probe each one's own registry key
# or manifest, confirm the candidate really holds the game executable, and say
# so plainly when nothing is found - a wrong root reads as "this install has no
# hotkeys", which is the least useful way to be wrong.
function Resolve-GameRoot {
    $candidates = New-Object System.Collections.Generic.List[string]
    if ($env:CP2077_GAMEROOT) { $candidates.Add($env:CP2077_GAMEROOT) }

    # -- Steam: the client's install path, then every library folder it knows --
    $steamRoots = foreach ($k in 'HKCU:\Software\Valve\Steam',
                                 'HKLM:\SOFTWARE\WOW6432Node\Valve\Steam',
                                 'HKLM:\SOFTWARE\Valve\Steam') {
        (Get-ItemProperty -Path $k -Name InstallPath -ErrorAction SilentlyContinue).InstallPath
    }
    # [IO.Path]::Combine rather than Join-Path throughout: Join-Path resolves the
    # drive qualifier through the PowerShell provider and hard-errors on a path
    # whose drive does not exist, which is exactly what a stale library entry or
    # an unplugged external drive looks like.
    foreach ($s in ($steamRoots | Where-Object { $_ } | Select-Object -Unique)) {
        $candidates.Add([IO.Path]::Combine($s, 'steamapps\common\Cyberpunk 2077'))
        # libraryfolders.vdf lists the other drives games may live on. It is
        # Valve's own text format rather than json, and the paths in it have
        # their backslashes doubled - unescape or the Join-Path below is bogus.
        $vdf = [IO.Path]::Combine($s, 'steamapps\libraryfolders.vdf')
        if (Test-Path -LiteralPath $vdf) {
            $raw = Get-Content -LiteralPath $vdf -Raw -ErrorAction SilentlyContinue
            foreach ($m in [regex]::Matches([string]$raw, '"path"\s+"([^"]+)"')) {
                $lib = $m.Groups[1].Value -replace '\\\\', '\'
                $candidates.Add([IO.Path]::Combine($lib, 'steamapps\common\Cyberpunk 2077'))
            }
        }
    }

    # -- GOG Galaxy: one registry key per installed game, keyed by product id --
    foreach ($root in 'HKLM:\SOFTWARE\WOW6432Node\GOG.com\Games',
                      'HKLM:\SOFTWARE\GOG.com\Games') {
        foreach ($g in (Get-ChildItem -Path $root -ErrorAction SilentlyContinue)) {
            $p = Get-ItemProperty -Path $g.PSPath -ErrorAction SilentlyContinue
            if ($p.gameName -like '*Cyberpunk*' -and $p.path) { $candidates.Add([string]$p.path) }
        }
    }

    # -- Epic: one .item manifest per installed title, under ProgramData -------
    $epic = [IO.Path]::Combine([string]$env:ProgramData, 'Epic\EpicGamesLauncher\Data\Manifests')
    if (Test-Path -LiteralPath $epic) {
        foreach ($f in (Get-ChildItem -LiteralPath $epic -Filter *.item -File -ErrorAction SilentlyContinue)) {
            try { $j = Get-Content -LiteralPath $f.FullName -Raw | ConvertFrom-Json } catch { continue }
            if ($j.DisplayName -like '*Cyberpunk*' -and $j.InstallLocation) { $candidates.Add([string]$j.InstallLocation) }
        }
    }

    # -- last resort: each storefront's default folder on every fixed drive.
    # A handful of directory probes, not a scan.
    foreach ($d in ([IO.DriveInfo]::GetDrives() | Where-Object { $_.DriveType -eq 'Fixed' -and $_.IsReady })) {
        foreach ($rel in 'Program Files (x86)\Steam\steamapps\common\Cyberpunk 2077',
                         'Steam\steamapps\common\Cyberpunk 2077',
                         'SteamLibrary\steamapps\common\Cyberpunk 2077',
                         'Games\Steam\steamapps\common\Cyberpunk 2077',
                         'GOG Games\Cyberpunk 2077',
                         'Program Files (x86)\GOG Galaxy\Games\Cyberpunk 2077',
                         'Games\GOG Games\Cyberpunk 2077',
                         'Program Files\Epic Games\Cyberpunk2077',
                         'Epic Games\Cyberpunk2077',
                         'Games\Cyberpunk 2077') {
            $candidates.Add([IO.Path]::Combine($d.RootDirectory.FullName, $rel))
        }
    }

    foreach ($c in ($candidates | Where-Object { $_ } | Select-Object -Unique)) {
        if (Test-Path -LiteralPath ([IO.Path]::Combine($c, 'bin\x64\Cyberpunk2077.exe'))) { return $c }
    }
    return $null
}

# An explicit -GameRoot is never second-guessed by detection: it either exists
# and is used, or it is an error. Detection only runs when nothing was given.
if (-not $GameRoot) {
    $GameRoot = Resolve-GameRoot
    if (-not $GameRoot) {
        throw ("Could not find a Cyberpunk 2077 install (checked the Steam, GOG and Epic " +
               "records on this machine, plus their default folders). " +
               "Pass -GameRoot 'X:\path\to\Cyberpunk 2077', or set CP2077_GAMEROOT.")
    }
}
if (-not (Test-Path -LiteralPath $GameRoot)) {
    throw "no such folder: '$GameRoot'"
}
if (-not (Test-Path -LiteralPath ([IO.Path]::Combine($GameRoot, 'bin\x64\Cyberpunk2077.exe')))) {
    # Read it anyway - it may be a copy of the mod folders rather than a full
    # install - but say so, because the likelier explanation is a wrong path.
    Write-Warning "no bin\x64\Cyberpunk2077.exe under '$GameRoot' - reading it anyway"
}
Write-Verbose "game root: $GameRoot"

# =========================================================== key name tables ==
#
# Two different jobs, and conflating them is what broke the gate. These tables
# are for DISPLAY - they turn `IK_Period` into `.` because that is what a person
# reads. Comparison is a separate question with a separate answer, and it lives
# in KeyIdentity.ps1, shared with the sheet: this file emits `Period` for a
# base-game row and `.` for a mod row, and only a shared identity function can
# tell you those are one key.
. (Join-Path $PSScriptRoot 'KeyIdentity.ps1')

$ikPretty = @{
    'IK_SingleQuote'="'"; 'IK_Semicolon'=';'; 'IK_Comma'=','; 'IK_Period'='.'
    'IK_Slash'='/'; 'IK_Backslash'='\'; 'IK_LBracket'='['; 'IK_RBracket'=']'
    'IK_Equals'='='; 'IK_Minus'='-'; 'IK_Tilde'='`'; 'IK_CapsLock'='Caps Lock'
    'IK_MiddleMouse'='Middle Click'; 'IK_RightMouse'='Right Click'
    'IK_LeftMouse'='Left Click'; 'IK_Mouse4'='Mouse 4'; 'IK_Mouse5'='Mouse 5'
    'IK_Pause'='Pause'; 'IK_Space'='Space'; 'IK_Enter'='Enter'; 'IK_Tab'='Tab'
    'IK_Backspace'='Backspace'; 'IK_Escape'='Esc'; 'IK_Insert'='Insert'
    'IK_Delete'='Delete'; 'IK_Home'='Home'; 'IK_End'='End'
    'IK_PageUp'='Page Up'; 'IK_PageDown'='Page Down'
    'IK_LShift'='L Shift'; 'IK_RShift'='R Shift'; 'IK_LControl'='L Ctrl'
    'IK_RControl'='R Ctrl'; 'IK_LAlt'='L Alt'; 'IK_RAlt'='R Alt'
    'IK_Up'='Up'; 'IK_Down'='Down'; 'IK_Left'='Left'; 'IK_Right'='Right'
    # Enhanced Vehicle System's synthetic chord ids - not real keys.
    'IK_F1_1'='F1 + 1'; 'IK_F2_2'='F2 + 2'; 'IK_F3_3'='F3 + 3'; 'IK_F4_4'='F4 + 4'
}
$padPretty = @{
    'IK_Pad_DigitUp'='D-Pad Up'; 'IK_Pad_DigitDown'='D-Pad Down'
    'IK_Pad_DigitLeft'='D-Pad Left'; 'IK_Pad_DigitRight'='D-Pad Right'
    'IK_Pad_A_CROSS'='A'; 'IK_Pad_B_CIRCLE'='B'; 'IK_Pad_X_SQUARE'='X'
    'IK_Pad_Y_TRIANGLE'='Y'; 'IK_Pad_LeftShoulder'='LB'; 'IK_Pad_RightShoulder'='RB'
    'IK_Pad_LeftTrigger'='LT'; 'IK_Pad_RightTrigger'='RT'
    'IK_Pad_LeftThumb'='L Stick'; 'IK_Pad_RightThumb'='R Stick'
    'IK_Pad_Start'='Start'; 'IK_Pad_Back_Select'='Select'
}

function Test-IsPad { param([string]$ik) return $ik -like 'IK_Pad_*' }

function Format-IK {
    param([string]$ik)
    if (-not $ik) { return $null }
    if ($padPretty.ContainsKey($ik)) { return $padPretty[$ik] }
    if ($ikPretty.ContainsKey($ik))  { return $ikPretty[$ik] }
    $s = $ik -replace '^IK_Pad_', '' -replace '^IK_', ''
    if ($s -match '^Numpad(.+)$') { return 'Num ' + $matches[1] }
    return $s
}

# Windows VK codes, for the CET side.
$vk = @{
    8='Backspace';9='Tab';13='Enter';16='Shift';17='Ctrl';18='Alt';19='Pause'
    20='Caps Lock';27='Esc';32='Space';33='Page Up';34='Page Down';35='End'
    36='Home';37='Left';38='Up';39='Right';40='Down';45='Insert';46='Delete'
    186=';';187='=';188=',';189='-';190='.';191='/';192='`'
    219='[';220='\';221=']';222="'"
}
0..9   | ForEach-Object { $vk[48 + $_] = "$_" }
65..90 | ForEach-Object { $vk[$_] = [string][char]$_ }
0..9   | ForEach-Object { $vk[96 + $_] = "Num $_" }
1..24  | ForEach-Object { $vk[111 + $_] = "F$_" }
$vk[106]='Num *'; $vk[107]='Num +'; $vk[109]='Num -'; $vk[110]='Num .'; $vk[111]='Num /'

function Format-VK {
    param([long]$packed)
    if ($packed -eq 0) { return $null }   # 0 is CET's "unbound"
    $names = foreach ($shift in 48, 32, 16, 0) {
        $c = [int](($packed -shr $shift) -band 0xFFFF)
        if ($c -gt 0) { if ($vk.ContainsKey($c)) { $vk[$c] } else { "VK$c" } }
    }
    return ($names -join ' + ')
}

# ================================================================== metadata ==

# Input-loader filenames are terse or inconsistent; give them the names the user
# would actually recognise in their mod manager.
#
# This is a courtesy lookup for mods commonly seen in the wild, not a required
# list. Anything missing falls through Resolve-ModName, which splits the
# camelCase filename ("VehicleSecurityRework" -> "Vehicle Security Rework"), so
# an unrecognised mod still reads sensibly - add entries only where that fails.
$modNames = @{
    'AlwaysFirstEquip'='Always First Equip'; 'auto_drive_enhanced'='Auto Drive Enhanced'
    'ChipwareExpansion'='Chipware Expansion'; 'DialogueHistory'='Dialogue History'
    'DisclosedHiddenGems'='Disclosed Hidden Gems'; 'ImmersiveTimeskip'='Immersive Timeskip'
    'LimitedHUD'='Limited HUD'; 'LimitedHUDToggle'='Limited HUD'; 'LimitedHudConfig'='Limited HUD'
    'MarkToSell'='Mark To Sell'; 'QuickhackHotkeys'='Quickhack Hotkeys'; 'QHHotkeys'='Quickhack Hotkeys'
    'RevisedBackpack'='Revised Backpack'; 'StealthRunner'='Stealth Runner'
    'ToggleQuestTags'='Toggle Quest Tags'; 'TriggerModeControl'='Trigger Mode Control'
    'VehicleSecurityRework'='Vehicle Security Rework'; 'AutoDriveEnhanced'='Auto Drive Enhanced'
    'disassembleAsLootingChoice_input_loader'='Disassemble As Looting Choice'
    'DarkFuture'='Dark Future'; 'NCPDExpansion'='NCPD Expansion'
    'AppearanceMenuMod'='Appearance Menu Mod'; 'cet'='Cyber Engine Tweaks'
    'flashlight'='Flashlight'; 'freefly'='Free Fly'
    'characterCustomizationAnywhere'='Character Customization Anywhere'
    'nightVision'='Kiroshi Night Vision'; 'skip_radio_song'='Skip Radio Song'
    'InteractiveAccessories'='Interactive Accessories'
}
# What a CET mod's own primary binding actually does, when the json key is a
# generic `mkbBinding_1` that names the slot rather than the function.
$cetPrimary = @{
    'Kiroshi Night Vision'='Toggle night vision'
    'Skip Radio Song'='Skip radio song'
}
function Resolve-ModName { param([string]$n) if ($modNames.ContainsKey($n)) { $modNames[$n] } else { $n -creplace '([a-z])([A-Z])','$1 $2' } }

# Bucket by MOD, not by input context.
#
# Deriving the bucket from `<context name=...>` looked right and is wrong twice
# over. Mods that want a key to work everywhere append themselves to every
# context - Dialogue History registers under VehicleDriveBase, Locomotion,
# CameraMovement and UIMenu - so whichever pattern is tested first wins and
# a dialogue tool gets filed under Vehicle. And PowerShell's -match is
# case-insensitive, so a 'UI|Menu' pattern matches the "ui" inside
# "AlwaysFirstEq-ui-p". Which situation a key belongs to is a judgement about
# the mod, so make it one.
#
# Partial by design: a mod that is not listed lands in 'World', which is a dull
# but never wrong answer. Extend it for whatever the install actually has.
$modBucket = @{
    'Enhanced Vehicle System'='Driving'; 'Auto Drive Enhanced'='Driving'
    'Vehicle Security Rework'='Driving'
    'Quickhack Hotkeys'='Combat'; 'Trigger Mode Control'='Combat'
    'Advanced Control'='Combat'; 'Chipware Expansion'='Combat'
    'NCPD Expansion'='Combat'; 'Always First Equip'='Combat'
    'Stealth Runner'='Stealth & Loot'; 'Mark To Sell'='Stealth & Loot'
    'Disassemble As Looting Choice'='Stealth & Loot'; 'Revised Backpack'='Stealth & Loot'
    'Immersive Timeskip'='World'; 'Toggle Quest Tags'='World'; 'Limited HUD'='World'
    'Dialogue History'='World'; 'Flashlight'='World'; 'Dark Future'='World'
    'Cyber Engine Tweaks'='Tools'; 'Appearance Menu Mod'='Tools'
    'Character Customization Anywhere'='Tools'; 'Free Fly'='Tools'
    'Disclosed Hidden Gems'='Tools'
    'Kiroshi Night Vision'='Combat'; 'Skip Radio Song'='World'
    'Interactive Accessories'='World'
}
function Resolve-Bucket { param([string]$mod) if ($modBucket.ContainsKey($mod)) { $modBucket[$mod] } else { 'World' } }

# Action ids are camelCase or snake_case internals. Prefer a written label.
$actionNames = @{
    'AlwaysFirstEquip'='First-equip animation'; 'SafeWeapon'='Holster weapon'
    'VehADESwitchAI'='Toggle autodrive'; 'VehADESwitchSeats'='Switch seats'
    'crack chip'='Crack chip'; 'renew chip'='Renew chip'
    'DFAnimatedConsumableManualChoiceMapping'='Use consumable (animated)'
    'DFVehicleSleepMapping'='Sleep in vehicle'
    'OpenDialogueHistory'='Open dialogue history'
    'ChoiceDisassemble'='Disassemble instead of loot'
    'GiveHiddenGemRewardButton'='Give hidden-gem reward'
    'TeleportToHiddenGemButton'='Teleport to hidden gem'
    'ToggleGemStateButton'='Toggle gem state'
    'Vehicle CycleDome'='Cycle CrystalDome'; 'Vehicle CycleDoor'='Cycle doors'
    'Vehicle CycleEngine'='Cycle engine / power'; 'Vehicle CycleSpoiler'='Cycle spoiler'
    'Vehicle CycleWindow'='Cycle windows'; 'Vehicle HeadlightsCall'='Flash headlights'
    'Vehicle ToggleCustomLights'='Toggle individual lights'
    'immersive time skip'='Skip time'
    # Three separate toggles with near-identical names, from the same mod;
    # LHUD_Toggle ships in an optional second input file, so an install may have
    # two of these and not the third.
    'LHUD Global'='Toggle whole HUD'; 'LHUD Minimap'='Toggle minimap'
    'LHUD Toggle'='Simple HUD toggle'
    'mark to sell'='Mark item to sell'; 'mark similar to sell'='Mark all similar to sell'
    'revised nav up'='Backpack: nav up'; 'revised nav down'='Backpack: nav down'
    'revised use equip'='Backpack: use / equip'
    'PickpocketLoot'='Pickpocket: loot'; 'PickpocketUse'='Pickpocket: use'
    'toggle quest tag'='Toggle quest tag'; 'TriggerSwap'='Swap fire mode'
    'AttemptUnlockSecurity'='Attempt to unlock vehicle'
    'hack Button'='Hack (NCPD scanner)'; 'hackButton'='Hack (NCPD scanner)'
    'consumable Animation Loot Action Key KBM'='Use consumable (animated)'
    'consumables_next'='Next consumable'; 'consumables_prev'='Previous consumable'
    'gadgets_next'='Next gadget'; 'gadgets_prev'='Previous gadget'
    'lean_left'='Lean left'; 'lean_right'='Lean right'
    'freeze_time'='Freeze time'; 'overlay_key'='Open CET console'
    'openCCScreenIn'='Open character customisation'
    'flashLightToggleIn'='Toggle flashlight'; 'freeflyActivationIn'='Toggle free-fly camera'
    'ToggleKey'='Toggle accessory'
}
1..8 | ForEach-Object { $actionNames["SelectHack$_"] = "Quickhack slot $_" }
function Resolve-Action {
    param([string]$a)
    if ($actionNames.ContainsKey($a)) { return $actionNames[$a] }
    $s = $a -replace '_',' ' -creplace '([a-z])([A-Z])','$1 $2'
    return ((Get-Culture).TextInfo.ToTitleCase($s.ToLower()))
}

# =================================================================== sources ==

$rows = New-Object System.Collections.Generic.List[object]

# -- user.ini: the actual rebinds ------------------------------------------
$overrides  = @{}
$iniSection = @{}
$iniPath = Join-Path $GameRoot 'red4ext\plugins\mod_settings\user.ini'
if (Test-Path -LiteralPath $iniPath) {
    $section = ''
    foreach ($line in [IO.File]::ReadLines($iniPath)) {
        if ($line -match '^\s*\[(.+)\]\s*$') { $section = $matches[1]; continue }
        if ($line -match '^\s*([A-Za-z0-9_]+)\s*=\s*(IK_\S+)\s*$') {
            $overrides[$matches[1]]  = $matches[2]
            $iniSection[$matches[1]] = $section
        }
    }
}

# -- cache: resolve buttonGroup indirections -------------------------------
$groups = @{}
$cachePath = Join-Path $GameRoot 'r6\cache\inputUserMappings.xml'
if (Test-Path -LiteralPath $cachePath) {
    [xml]$cx = Get-Content -LiteralPath $cachePath -Raw
    foreach ($g in $cx.SelectNodes('//buttonGroup')) {
        $groups[$g.id] = @($g.SelectNodes('button') | ForEach-Object { $_.id })
    }
}

# -- per-mod input xml -----------------------------------------------------
$consumed = @{}   # overridableUI ids already surfaced, so user.ini doesn't double up
$inputDir = Join-Path $GameRoot 'r6\input'
if (Test-Path -LiteralPath $inputDir) {
  foreach ($f in (Get-ChildItem -LiteralPath $inputDir -Filter *.xml)) {
    try { [xml]$x = Get-Content -LiteralPath $f.FullName -Raw } catch { continue }
    $mod = Resolve-ModName ([IO.Path]::GetFileNameWithoutExtension($f.Name))

    # map name -> the contexts its action appears in
    $ctx = @{}
    foreach ($c in $x.SelectNodes('//context')) {
        foreach ($a in $c.SelectNodes('action')) {
            if (-not $a.map) { continue }
            if (-not $ctx.ContainsKey($a.map)) { $ctx[$a.map] = @() }
            $ctx[$a.map] += $c.name
        }
    }

    foreach ($map in $x.SelectNodes('//mapping')) {
        if ($map.type -and $map.type -ne 'Button') { continue }   # skip axes

        $kb = @(); $pad = @(); $src = 'mod default'
        foreach ($b in $map.SelectNodes('button')) {
            # An id may name a buttonGroup rather than a key; expand it.
            $ids = if ($groups.ContainsKey($b.id)) { $groups[$b.id] } else { @($b.id) }
            $ov  = $b.overridableUI
            if ($ov -and $overrides.ContainsKey($ov)) {
                $ids = @($overrides[$ov]); $src = 'your setting'; $consumed[$ov] = $true
            }
            foreach ($i in $ids) { if (Test-IsPad $i) { $pad += (Format-IK $i) } else { $kb += (Format-IK $i) } }
        }
        if (-not $kb -and -not $pad) { continue }

        $name = $map.name -replace '_Button$',''
        $rows.Add([pscustomobject]@{
            Mod     = $mod
            Action  = Resolve-Action ($name -replace '_',' ')
            Key     = ($kb  | Select-Object -Unique) -join ' / '
            Pad     = ($pad | Select-Object -Unique) -join ' / '
            Context = Resolve-Bucket $mod
            # Raw contexts kept for reference only - see the note on $modBucket
            # for why they must not decide where a binding is filed.
            Scope   = (($ctx[$map.name] | Select-Object -Unique) -join ', ')
            Source  = $src
            System  = 'input xml'
        })
    }
  }
}

# -- user.ini entries no xml claimed (mods that read the setting directly) --
foreach ($k in $overrides.Keys) {
    if ($consumed.ContainsKey($k)) { continue }
    $ik = $overrides[$k]
    $isPad = Test-IsPad $ik
    $mod = Resolve-ModName (($iniSection[$k] -split '\.')[0])
    $rows.Add([pscustomobject]@{
        Mod     = $mod
        Action  = Resolve-Action $k
        Key     = $(if ($isPad) { '' } else { Format-IK $ik })
        Pad     = $(if ($isPad) { Format-IK $ik } else { '' })
        Context = Resolve-Bucket $mod
        Scope   = ''
        Source  = 'your setting'
        System  = 'mod settings'
    })
}

# -- CET ------------------------------------------------------------------
$cetPath = Join-Path $GameRoot 'bin\x64\plugins\cyber_engine_tweaks\bindings.json'
if (Test-Path -LiteralPath $cetPath) {
    # -AsHashtable is mandatory: the file has keys differing only in case.
    $j = Get-Content -LiteralPath $cetPath -Raw | ConvertFrom-Json -AsHashtable
    foreach ($cetMod in $j.Keys) {
        $binds = $j[$cetMod]
        if ($binds -isnot [hashtable]) { continue }
        $mod = Resolve-ModName $cetMod
        foreach ($b in $binds.Keys) {
            $val = 0L
            if (-not [long]::TryParse([string]$binds[$b], [ref]$val)) { continue }
            $name = Format-VK $val
            if (-not $name) { continue }
            $rows.Add([pscustomobject]@{
                Mod     = $mod
                Action  = Resolve-Action ($b -replace '^amm_','')
                Key     = $name
                Pad     = ''
                Context = Resolve-Bucket $mod
                Scope   = ''
                Source  = 'your setting'
                System  = 'CET'
            })
        }
    }
}

# -- CET per-mod config json (the fifth store) -----------------------------
#
# Depth-limited on purpose: `mods\` also holds mods that ship megabytes of json
# data, and a blind recurse would read all of it to find three keys.
function Add-CetConfigBinding {
    param([hashtable]$h, [string]$mod, $sink)

    # A chord is spread over mkbBinding_1..N, and `mkbBinding_keys` says how many
    # are live. Ignore it and you report a two-key chord for a mod whose second
    # slot is just a stale leftover from a previous binding.
    $live  = if ($h.ContainsKey('mkbBinding_keys')) { [int]$h['mkbBinding_keys'] } else { 0 }
    $chord = for ($i = 1; $i -le $live; $i++) {
        $v = $h["mkbBinding_$i"]
        if ($v -is [string] -and $v -like 'IK_*' -and $v -ne 'IK_None') { Format-IK $v }
    }
    if ($chord) {
        $act = if ($cetPrimary.ContainsKey($mod)) { $cetPrimary[$mod] } else { "Toggle $mod" }
        $sink.Add([pscustomobject]@{
            Mod=$mod; Action=$act; Key=($chord -join ' + '); Pad=''
            Context=(Resolve-Bucket $mod); Scope=''; Source='your setting'; System='CET config'
        })
    }

    foreach ($k in $h.Keys) {
        $v = $h[$k]
        if ($v -is [hashtable]) { Add-CetConfigBinding $v $mod $sink; continue }
        if ($v -isnot [string] -or $v -notlike 'IK_*') { continue }
        if ($v -eq 'IK_None') { continue }                # explicitly unbound
        if ($k -match '^(mkb|pad)Binding') { continue }    # chord handled above
        if (Test-IsPad $v) { continue }
        $sink.Add([pscustomobject]@{
            Mod=$mod; Action=(Resolve-Action $k); Key=(Format-IK $v); Pad=''
            Context=(Resolve-Bucket $mod); Scope=''; Source='your setting'; System='CET config'
        })
    }
}

$cetModsDir = Join-Path $GameRoot 'bin\x64\plugins\cyber_engine_tweaks\mods'
if (Test-Path -LiteralPath $cetModsDir) {
    foreach ($d in (Get-ChildItem -LiteralPath $cetModsDir -Directory -ErrorAction SilentlyContinue)) {
        $jsons = @(Get-ChildItem -LiteralPath $d.FullName -Filter *.json -File -ErrorAction SilentlyContinue)
        $sub = Join-Path $d.FullName 'config'
        if (Test-Path -LiteralPath $sub) {
            $jsons += @(Get-ChildItem -LiteralPath $sub -Filter *.json -File -ErrorAction SilentlyContinue)
        }
        foreach ($file in $jsons) {
            try { $cfg = Get-Content -LiteralPath $file.FullName -Raw | ConvertFrom-Json -AsHashtable } catch { continue }
            if ($cfg -isnot [hashtable]) { continue }
            Add-CetConfigBinding $cfg (Resolve-ModName $d.Name) $rows
        }
    }
}

# ================================================================== finalise ==

if ($rows.Count -eq 0) {
    # None of the five stores existed, or none of them held a binding. That is
    # the correct answer for an archive-only load order: archives declare no
    # keys, and CET / RED4ext / Input Loader are only present if a mod needs them.
    Write-Warning "no bindings found under '$GameRoot' - normal for a load order with no CET, RED4ext or r6\input mods"
}

$final = $rows
if (-not $IncludeGamepad) { $final = $rows | Where-Object { $_.Key } }

# Collapse rows that are the same mod + action + key arriving from two systems.
$final = $final |
    Group-Object { "$($_.Mod)|$($_.Action)|$($_.Key)" } |
    ForEach-Object {
        # Prefer the input-xml row: it carries the real context.
        ($_.Group | Sort-Object { if ($_.System -eq 'input xml') { 0 } else { 1 } })[0]
    }

# --- the inventory ------------------------------------------------------------
if ($Devices) {
    $devs = @(Get-InputDevices)
    $kb   = @($devs | Where-Object { $_.Kind -eq 'keyboard' })
    $real = @($kb | Where-Object { -not $_.Virtual })

    Write-Host "keyboards present: $($kb.Count)  ($($real.Count) physical, $($kb.Count - $real.Count) virtual)" -ForegroundColor Cyan
    Write-Host ''
    foreach ($d in $kb) {
        $vendor = if ($d.Vendor -and $script:KnownVendors.ContainsKey($d.Vendor)) { $script:KnownVendors[$d.Vendor] }
                  elseif ($d.Vendor) { "VID_$($d.Vendor)" } else { '' }
        $tag = if ($d.Virtual) { 'virtual ' } else { '        ' }
        Write-Host ("  {0}{1,-26} {2}" -f $tag, $vendor, $d.Name)
        Write-Host ("            {0}" -f $d.Id) -ForegroundColor DarkGray
    }
    Write-Host ''

    # The finding, not the data. A list nobody interprets is why four keyboards
    # sat in a report all evening and changed nothing.
    if ($real.Count -gt 1) {
        Write-Host "MORE THAN ONE PHYSICAL KEYBOARD IS ATTACHED." -ForegroundColor Yellow
        Write-Host "  A second board can emit key-downs with no key-up - on plug-in, on power" -ForegroundColor DarkGray
        Write-Host "  transition, or continuously if it is faulty. Anything running at that" -ForegroundColor DarkGray
        Write-Host "  moment believes that key is held FOREVER, and every hotkey it captures" -ForegroundColor DarkGray
        Write-Host "  afterwards becomes a chord that no real keypress will match." -ForegroundColor DarkGray
        Write-Host "  A keyboard switched OFF but still cabled STILL ENUMERATES and still reports." -ForegroundColor DarkGray
        Write-Host "  Unplug the others and retest before blaming any mod." -ForegroundColor DarkGray
    } else {
        Write-Host "One physical keyboard. Nothing here explains a phantom key." -ForegroundColor Green
    }
    if ($kb.Count -ne $real.Count) {
        Write-Host ''
        Write-Host "Virtual keyboard endpoints are present (RGB suites, macro tools, remote agents)." -ForegroundColor DarkGray
        Write-Host "They inject at driver level, so their events look like real hardware to every" -ForegroundColor DarkGray
        Write-Host "hook above them - a low-level capture showing 'nothing injected' does not clear them." -ForegroundColor DarkGray
    }
    exit 0
}

if ($IncludeBaseGame -or $CheckKey) {
    $final = @($final) + @(Get-BaseGameKeys -Root $GameRoot)
}

# --- the gate -----------------------------------------------------------------
#
# One question, one answer, and a non-zero exit when the key is taken - so a
# script or an agent cannot proceed past it by not reading the output.
#
# THE MATCH IS ON IDENTITY, NOT ON THE STRING. Every store spells the same key
# differently - `Period` from the base game, `.` from a mod, `Middle Click` here
# and `MiddleMouse` there - so a string comparison answers a question about
# spelling while claiming to answer one about keys. It found half the claimants
# and reported the other half's key as free: `-CheckKey .` missed every
# base-game claim, `-CheckKey Period` missed every mod claim, and the two
# disagreed with each other. Both now resolve through Get-KeyIdentity and agree.
#
# Get-KeyIdentitySet, not Get-KeyIdentity, because one row can claim several
# keys: a mapping with two buttons is rendered `F1 / 1` and holds BOTH.
if ($CheckKey) {
    $want   = $CheckKey -replace '^(?i)IK_', ''
    $wantId = Get-KeyIdentity $CheckKey
    $claims = @($final | Where-Object { $_.Key -and (Get-KeyIdentitySet $_.Key) -contains $wantId })
    if ($claims.Count) {
        Write-Host "$want is ALREADY CLAIMED:" -ForegroundColor Red
        foreach ($c in $claims) {
            Write-Host ("  {0,-22} {1}" -f $c.Mod, $c.Action) -ForegroundColor Yellow
            # Name the spelling the store used when it differs from the one that
            # was asked about - otherwise a base-game claim on `MiddleMouse`
            # answering a question about `Middle Click` looks like a mistake.
            $how = if ($c.Key -ieq $want) { "($($c.System))" } else { "($($c.System), recorded as '$($c.Key)')" }
            Write-Host ("  {0,-22} {1}" -f '', $how) -ForegroundColor DarkGray
        }
        Write-Host 'Pick another key. A test key that also does something in game makes the result unreadable.' -ForegroundColor DarkGray
        exit 1
    }
    Write-Host "$want is free - nothing in the base game or any installed mod claims it." -ForegroundColor Green
    exit 0
}

return @($final | Sort-Object Context, Mod, Action)

