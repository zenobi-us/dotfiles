# Interaction patterns

Facts about the game's data model that surface as mod conflicts. These name mods
only as examples; nothing here describes a mod's own settings or behaviour.

- [A mod that enumerates records will hand the player abstract templates](/patterns/record-enumeration-leaks-templates) - opt-out enumeration distributes abstract `$base` records as items
- [A settings file the game rewrites answers "what is set", never "what is default"](/patterns/live-state-is-not-defaults) - two disjoint settings stores, and why an empty result reads like a negative one
- [A mod's shipped defaults are not proof a human chose anything](/patterns/defaults-can-be-written-by-code) - mods seed their own settings at runtime, so "who wrote this value" is a question about code paths
- [An "allow nothing" flag short-circuits every other option, and shows no symptom](/patterns/override-flag-silences-the-filter-chain) - a whole-chain guard outranks every setting below it
- [A shared core that announces its own add-ons turns "is this installed" into a lookup](/patterns/shared-core-announces-its-addons) - a runtime self-report outranks any file-presence check
- [A mod armed by game state fails three ways, and all three read as "the mod is broken"](/patterns/a-mod-armed-by-game-state-fails-three-ways) - waiting and switched off are identical on disk, quest facts are shared, and any mod that removes the world event disarms every mod watching for it
