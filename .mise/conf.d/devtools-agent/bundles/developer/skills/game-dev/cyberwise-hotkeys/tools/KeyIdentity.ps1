# KeyIdentity.ps1 -- one key, one identity, whatever vocabulary named it.
#
#     . .\KeyIdentity.ps1
#     Get-KeyIdentity 'IK_Period'            # -> '.'
#     Get-KeyIdentity 'PeriodAndBiggerThan'  # -> '.'
#     Get-KeyIdentity 'Middle Click'         # -> 'mouse-mid'
#
# ---------------------------------------------------------------------------
# WHY THIS IS ONE FILE AND NOT THREE TABLES
# ---------------------------------------------------------------------------
#
# Four different vocabularies name the same physical key, and every one of them
# is somebody's authoritative format:
#
#   IK_Period              the engine's own id, in r6\input and r6\config
#   Period                 that id minus its prefix - what base-game rows carry
#   .                      prettified for a human - what mod rows carry
#   PeriodAndBiggerThan    iCUE, which names a key after every glyph on it
#
# Any comparison of raw strings across two of those finds NOTHING, and finding
# nothing is the dangerous answer here rather than the harmless one:
#
#   * `Get-Hotkeys -CheckKey` is THE GATE - "is this key safe to bind?" A gate
#     that misses half the claimants reports a taken key as free, and somebody
#     binds over quickload. `-CheckKey .` used to miss every base-game claim and
#     `-CheckKey Period` missed every mod claim, so the two disagreed with each
#     other and both were wrong.
#   * The hotkey sheet's mouse join asks "what is the key this button sends
#     actually bound to?" A miss there prints a working button as DEAD.
#
# So identity lives in ONE place that every store's reader folds through. The
# second copy of this table is the bug: it is right the day it is written and
# drifts silently afterwards, and the two callers then disagree about the same
# key while each looks internally consistent. If you add a store, do not compare
# its strings - fold them through here.
#
# ---------------------------------------------------------------------------
# THE CONTRACT
# ---------------------------------------------------------------------------
#
#   * The returned token is OPAQUE. It is for equality only - never print it.
#     Display names stay exactly as each store rendered them, because the pretty
#     names are what makes a sheet readable.
#   * Comparison is case-insensitive, and ignores spaces and underscores, so
#     `Caps Lock` and `CapsLock` are one key.
#   * AN UNKNOWN NAME PASSES THROUGH AS ITSELF (folded for case and spacing) and
#     is never dropped, never guessed at from its spelling. A table that swallows
#     what it does not recognise reintroduces exactly the bug it was built to
#     fix: the unrecognised key silently claims nothing and reads as free.
#   * Two genuinely different keys must never collide. Everything here is an
#     explicit synonym of a key that really exists; nothing is inferred.

# Synonyms, keyed by the folded form (lower case, no spaces or underscores, no
# IK_ prefix). The value is the identity token - a glyph where there is an
# obvious one, otherwise a short tag no vocabulary uses, so it cannot be
# mistaken for a name.
#
# EXTEND FROM NAMES ACTUALLY SEEN IN A STORE, not from what a vendor might
# plausibly call something.
$script:KeyIdentityMap = @{
    # -- punctuation: the engine name, the glyph, and iCUE's every-glyph name --
    'period'                  = '.'
    'periodandbiggerthan'     = '.'
    'comma'                   = ','
    'commaandlessthan'        = ','
    'lbracket'                = '['
    'leftbracket'             = '['
    'bracketleft'             = '['
    'rbracket'                = ']'
    'rightbracket'            = ']'
    'bracketright'            = ']'
    'minus'                   = '-'
    'minusandunderscore'      = '-'
    'hyphen'                  = '-'
    'equals'                  = '='
    'equal'                   = '='
    'equalsandplus'           = '='
    'tilde'                   = '`'
    'graveaccent'             = '`'
    'graveaccentandtilde'     = '`'
    'backquote'               = '`'
    'semicolon'               = ';'
    'semicolonandcolon'       = ';'
    'singlequote'             = "'"
    'apostrophe'              = "'"
    'apostropheanddoublequote'= "'"
    'slash'                   = '/'
    'forwardslash'            = '/'
    'slashandquestionmark'    = '/'
    'backslash'               = '\'
    'backslashandpipe'        = '\'

    # -- mouse: three vocabularies and no overlap at all between them ---------
    # `mouse-*` rather than a glyph because there is no glyph, and because a
    # token no store uses cannot be confused with one it does.
    'leftmouse'    = 'mouse-l'
    'leftclick'    = 'mouse-l'
    'mouseleft'    = 'mouse-l'
    'mouse1'       = 'mouse-l'
    'rightmouse'   = 'mouse-r'
    'rightclick'   = 'mouse-r'
    'mouseright'   = 'mouse-r'
    'mouse2'       = 'mouse-r'
    'middlemouse'  = 'mouse-mid'
    'middleclick'  = 'mouse-mid'
    'mousemiddle'  = 'mouse-mid'
    'mouse3'       = 'mouse-mid'
    'mouse4'       = 'mouse-4'
    'mouse5'       = 'mouse-5'
    'mousewheelup'   = 'wheel-up'
    'wheelup'        = 'wheel-up'
    'mousewheeldown' = 'wheel-down'
    'wheeldown'      = 'wheel-down'

    # -- named keys whose two vocabularies actually differ -------------------
    'capslock' = 'caps'
    'escape'   = 'esc'
    'return'   = 'enter'
    'pgup'     = 'pageup'
    'pgdn'     = 'pagedown'
    'pgdown'   = 'pagedown'
    'uparrow'    = 'up';    'arrowup'    = 'up'
    'downarrow'  = 'down';  'arrowdown'  = 'down'
    'leftarrow'  = 'left';  'arrowleft'  = 'left'
    'rightarrow' = 'right'; 'arrowright' = 'right'
    'leftshift'   = 'lshift';  'rightshift'   = 'rshift'
    'lcontrol'    = 'lctrl';   'rcontrol'     = 'rctrl'
    'leftcontrol' = 'lctrl';   'rightcontrol' = 'rctrl'
    'leftctrl'    = 'lctrl';   'rightctrl'    = 'rctrl'
    'leftalt'     = 'lalt';    'rightalt'     = 'ralt'
    'control'     = 'ctrl'
}

# The numeric pad is spelled three ways and none of them is a synonym list worth
# writing out: `Numpad5` (engine), `Num 5` (prettified), `Keypad5` (iCUE). Fold
# the prefix and then the tail, so `KeypadPlus`, `Numpad+` and `Num +` all land
# on `num+`.
#
# A tail this does not know is kept verbatim, which is what makes the rewrite
# safe: `NumLock` -> `num` + `lock` -> `numlock`, the same string it started as.
$script:KeyPadTails = @{
    'plus' = '+'; 'add' = '+'
    'minus' = '-'; 'subtract' = '-'
    'multiply' = '*'; 'star' = '*'; 'asterisk' = '*'
    'divide' = '/'
    'period' = '.'; 'decimal' = '.'; 'dot' = '.'
    'return' = 'enter'
}

function Get-KeyIdentity {
    <#
    .SYNOPSIS
        Fold a key name from any store into one comparable identity token.
    .DESCRIPTION
        For comparison only - never for display. Unknown names fold to
        themselves rather than being dropped or guessed at.
    #>
    param([string] $Key)

    if ($null -eq $Key) { return '' }
    $t = $Key.Trim()
    if (-not $t) { return '' }

    # A chord is folded key by key, so `Ctrl + Period` and `LCtrl + .` agree.
    # Split on ' + ' WITH the spaces, and only when every part is non-empty:
    # `Num +` is one key whose name ends in a plus, not a two-key chord.
    $parts = $t -split ' \+ '
    if ($parts.Count -gt 1 -and -not ($parts | Where-Object { -not $_.Trim() })) {
        return (($parts | ForEach-Object { Get-KeyIdentity $_ }) -join '+')
    }

    # Fold: drop the engine prefix, then case and separators. IK_Pad_* keeps its
    # `pad` in the token, so no gamepad button can ever collide with a keyboard
    # key of the same letter.
    $t = ($t -replace '^(?i)IK_', '') -replace '[\s_]', ''
    $t = $t.ToLowerInvariant()

    if ($script:KeyIdentityMap.ContainsKey($t)) { return $script:KeyIdentityMap[$t] }

    if ($t -match '^(?:numpad|keypad|num)(.+)$') {
        $tail = $matches[1]
        if ($script:KeyPadTails.ContainsKey($tail)) { $tail = $script:KeyPadTails[$tail] }
        return "num$tail"
    }

    return $t
}

# One row's Key field can name SEVERAL keys - a mapping with two <button>
# entries is rendered `F1 / 1`, and both keys are genuinely claimed by it. Any
# question of the form "who claims this key?" has to see them separately, or a
# mod that binds an action to two keys claims neither.
function Get-KeyIdentitySet {
    <#
    .SYNOPSIS
        Every key identity a single harvested Key field claims.
    #>
    param([string] $Key)

    if (-not $Key) { return @() }
    return @($Key -split ' / ' |
             ForEach-Object { Get-KeyIdentity $_ } |
             Where-Object { $_ } |
             Select-Object -Unique)
}
