# Conflicts, load order and archive internals

Why one archive beats another, how to tell a mod that is losing from a mod that
was never in the fight, and what is actually inside an `.archive`. Mods appear
here only as examples.

## How order resolves

- [Earlier in modlist.txt wins, and nothing in the game writes that file](/conflicts/earlier-wins-and-nothing-in-the-game-writes-the-list) - the two models, and a test that can actually fail
- [Every newly installed archive starts at the bottom of the priority stack](/conflicts/every-new-archive-starts-last) - the append trap, and why a hand-settled order undoes itself
- [modlist.txt has no comment syntax, and treating "#" as one fabricates faults](/conflicts/modlist-has-no-comment-syntax) - 60 invented unlisted archives on one 727-archive install
- [A modlist entry with no archive is usually not a fault; an archive with no entry always is](/conflicts/an-entry-and-a-file-can-disagree)

## What a conflict report means

- [An archive can be installed, enabled, and contributing nothing](/conflicts/an-archive-that-contributes-nothing) - detecting inert archives, and why an inert archive is not an inert mod
- [Three conflicts look identical in a report and only one is fixable by order](/conflicts/what-reordering-can-and-cannot-fix) - lost fight, coverage gap, and the request that is not satisfiable
- [Making one mod win can kill a third mod nobody mentioned](/conflicts/a-precedence-change-creates-casualties)
- [Not every visual mismatch is a conflict, and the scanner agreeing with you is not evidence](/conflicts/visual-bugs-that-are-not-conflicts)
- [A missing character-creation option is usually a stale list, not a lost conflict](/conflicts/a-missing-creator-option-is-a-stale-list) - rebuild the list before touching precedence, and test appearance mods on a new character *(draft: one install, one mod family)*

## The conflicts nothing scans for

- [Two mods can rewrite the same quest node, and no conflict scan sees it](/conflicts/quest-graph-interceptions) - an interception is a rewrite of the vanilla quest graph rather than a file override, so neither a hash scan nor a manager can see two mods claiming one socket *(draft: the order dependence is derived, not A/B tested)*

## Inside an .archive

- [An .archive index is plain structured data - only the file bodies are compressed](/conflicts/rdar-index-is-plain-data) - RDAR layout, FNV1a-64, and two numeric traps
- [A hash you cannot name is still a conflict, and a miss is information](/conflicts/resolving-a-hash-to-a-path) - dictionary coverage and what a negative result is worth
- [A serialized RED4 file survives a targeted regex, not a JSON round-trip](/conflicts/editing-serialized-red4-json)
- [Scaling a placed prop is four separate edits, and the anchors do not follow the mesh](/conflicts/scaling-a-placed-prop)

## Elsewhere

- [There are two load-order systems, and a conflict scan only sees one of them](/engine/two-load-order-domains) - REDmod archives are outside everything above
- [What the game directory shows you depends on how the mods got there](/install/how-the-install-is-assembled)
