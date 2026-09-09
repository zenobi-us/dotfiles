# Engine and runtime

How the game and its script layers actually behave, independent of any mod. Mods
appear here only as examples.

- [A .reds file on disk is not code the game is running](/engine/compiled-script-bundle) - the compiled bundle, what is in it, and the three false absences
- [Compile-testing redscript without inventing the errors yourself](/engine/compile-testing-redscript) - the two symmetric ways to manufacture thousands of errors, and how to tell a test that ran from one that did not
- [Reading a redscript failure without trusting its own explanation](/engine/reading-a-redscript-failure) - the popup's appended guess is a heuristic, and it names mods the compiler never saw
- [An archived redscript log is named for the run that replaced it](/engine/redscript-log-names-the-wrong-run) - the rotation trap, and how a compile test destroys the record of the last launch
- [Reading live game objects from CET Lua without losing the row that mattered](/engine/cet-lua-runtime) - LuaJIT limits, per-field `pcall`, and the out-param return slot that moves between builds
- [A CET mod folder without init.lua is not a mod, and a new one is not loaded until the game restarts](/engine/cet-mod-loading) - the husk left by an uninstall, whose settings a report will quote as live
- [Resource patching runs on the new-game path only, and a framework rollback can switch it off in silence](/engine/archivexl-resource-patching) - thousands of operations on a new character and zero on a save load, which makes a save load a free control experiment
- [There are two load-order systems, and a conflict scan only sees one of them](/engine/two-load-order-domains) - loose archives and REDmod are ordered by different lists, and nothing ranks across them
- [The game's own option registry outranks any mod's account of an engine setting](/engine/option-registry-is-the-authority) - what `UserSettings.json` settles that no mod file can
- [What a vendor will buy is decided by tag filters, and one record can be every vendor of a kind](/engine/vendor-buy-filters-and-shared-records) - the four tag arrays, and why one edit is inert on one record and city-wide on the next
- [Looted gear arriving broken is two TweakDB flats, and the words on screen may belong to a different mod](/engine/looted-items-can-arrive-broken) - the chance, the relabelling, and a settings toggle inert because of its own code
- [An access point answers "who is on this network" with two different functions](/engine/network-membership-has-two-functions) - GetPuppets does not route through GetImmediateSlaves, so a device-graph wrap is invisible to every NPC path, and vanilla's failed-breach response is a distraction stim
