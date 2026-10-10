# Diagnosis

Finding out what is actually wrong with a modded install: which log carries which
symptom, what the game records when it dies, how to search a large mod list
without wasting launches, and what evidence a hang makes available that a crash
never does.

These are facts about the game's own diagnostics and about the shape of the
search, not about any particular mod. Mods appear only as examples.

- [Which log carries which symptom, and why a missing log is not a silent log](/diagnosis/which-log-carries-which-symptom) - seven logs owned by five frameworks, none shipped with the game; the one everybody forgets; and why a log's last line is not the moment of death
- [The game writes its own crash report, and Windows Error Reporting never sees it](/diagnosis/the-games-own-crash-report) - `CrashInfo.json`, why no dump is ever produced, and how 21 captured files turned out to be 2 crashes
- [Memory is usually a red herring, and measuring it badly manufactures the leak you went looking for](/diagnosis/memory-is-usually-a-red-herring) - the startup ramp, what a leak claim actually requires, and the counters that lie
- [Sizing a bisect to the list](/diagnosis/sizing-a-bisect-to-the-list) - when not to bisect at all, the layer pass, and the parking mechanics that quietly void a round
- [A failing round narrows nothing, and a clean round proves everything](/diagnosis/a-failing-round-narrows-nothing) - halve-and-keep-the-failing-half assumes one culprit, and fails invisibly with two
- [When halving stops paying, write a guard](/diagnosis/writing-a-guard-mod) - a throwaway one-function mod that logs the value separating two hypotheses
- [A hang and a crash are different faults, and only one of them lets you interrogate the process](/diagnosis/a-hang-and-a-crash-are-different-faults) - live sampling, native spin versus script loop, and the watchdog kill that is invisible in the crash reporter
- [A data-layer log is noisy by design, and the count is not a health metric](/diagnosis/reading-a-noisy-tweak-log) - hundreds of benign record warnings, a failing set that changes between launches, and the one question that separates noise from a broken feature
- [The game swallows its own crash, so Windows never sees one](/diagnosis/the-game-swallows-its-own-crash) - why WER never fires, why LocalDumps is empty, and how a debugger names the faulting module
