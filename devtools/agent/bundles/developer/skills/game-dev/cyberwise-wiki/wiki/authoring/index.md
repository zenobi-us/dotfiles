# Authoring

How the game's scripting and data layers behave when you are the one writing
into them - TweakXL records, CET Lua, redscript, and the localized text all
three of them collide with.

These are facts about the layers themselves, not instructions for a task. The
procedure - snapshot before an in-place write, get agreement on the diff,
compile-test against the real load order - stays in `cyberwise-tweaks`. What is
here is the behaviour that makes those procedures necessary, and the long list of
ways each layer fails **without saying anything at all**.

## TweakXL and TweakDB

- [A TweakXL record is resolved last-wins, and that is the lever for everything else](/authoring/tweakxl-records-are-last-wins) - per-record granularity, the `zzz_` override, and the retire condition that stops two mods fighting over one value
- [One indentation error disables every record in a TweakXL file](/authoring/a-yaml-error-disables-the-whole-file) - `yaml-cpp` rejects the document, so the blast radius is the file
- [Never guess a TweakDB record ID - the game writes the real list](/authoring/finding-the-real-record-id) - the string table TweakXL emits, and why CDPR's naming defeats every guess
- [Vendor stock and item pricing are both arrays of records, not values](/authoring/vendor-stock-and-pricing) - tier gates, inline slots, and price components that nothing reads
- [Two TweakXL errors that are not "unknown record", and what each one is telling you](/authoring/tweakxl-error-signatures) - "Ambiguous definition" is a typo in the ID; "cannot clone" means you named a class rather than a record

## ArchiveXL

- [Deleting a world node with ArchiveXL - the type must come from the sector, and one bad entry voids the whole file](/authoring/archivexl-node-deletions) - `debugName` lies about `$type`, and a companion `.xl` edits another mod's sector without repacking it
- [A mod adds journal entries, phone messages and quests by declaring resources in its `.xl`](/authoring/mod-declared-journal-and-quest-resources) - `journal:`, `quest: phases:` and the per-locale text, and how to name the mod behind a phone thread
- [Resource patching runs on the new-game path only](/engine/archivexl-resource-patching) - in `/engine`: what `resource: patch:` does, the dependency it hides, and the framework rollback that silenced it
- [Two mods can rewrite the same quest node, and no conflict scan sees it](/conflicts/quest-graph-interceptions) - in `/conflicts`: what an `intercept: true` operation does to the vanilla quest graph

## CET and Lua

- [What the CET console can and cannot do](/authoring/the-cet-console-is-a-sandbox) - LuaJIT limits, cheats that are not globals, the ripperdoc gate, and quest facts that die at the next load
- [Reading live game objects from CET Lua without losing the row that mattered](/engine/cet-lua-runtime) - in `/engine`, for the reading half of the job

## Redscript

- [The game ships its own API reference, and guessing a signature is slower than reading it](/authoring/reading-the-shipped-script-dump) - the vanilla script dump, and why a mod-declared class cannot be hooked
- [Addressing one specific world object from redscript](/authoring/addressing-a-world-object-from-redscript) - PersistentID over a 32-bit hash, verb order, and undoing only your own change

## Text and detection

- [Finding a piece of text the player saw in game](/authoring/finding-in-game-text) - the per-locale `onscreens` file, what it does not contain, and what a LocKey actually is
- [A player-visible string cannot be found by grepping the archives that contain it](/authoring/localization-strings-live-inside-archives) - contents are compressed and structure is not: extract with the CLI, then read printable runs out of a CR2W resource
- [Detecting a player action by matching its interaction text is matching on something another mod owns](/authoring/detecting-a-player-action-from-an-interaction) - three silent failure modes of choice-hub detection
- [A mod can delete vanilla behaviour by wrapping and not calling through](/authoring/a-mod-can-remove-vanilla-behaviour-silently) - a feature that looked missing was being suppressed, and nothing anywhere reports that
- [Giving a mod its own LocKeys, without authoring a CR2W from a guess](/authoring/shipping-your-own-lockeys) - a caption is a key and not text, and the way to get the resource right is to copy a mod already working on the install
