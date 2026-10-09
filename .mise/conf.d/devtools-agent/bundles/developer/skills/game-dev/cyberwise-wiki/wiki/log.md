# Log

## 2026-08-25

**Two corrections, one of them load-bearing.**

`authoring/tweakxl-records-are-last-wins` said resolution is per record and the
later declaration simply wins. It is **per field within a record** - two mods
declaring the same record with disjoint field sets both take effect. The old
wording licensed exactly the wrong conclusion, "these two write the same record,
they are duplicates, uninstall one", against a modular suite where all of them
are needed. Corrected with the worked case: four handling mods, five shared
vehicle records, disjoint fields, every one of them doing its job.

`diagnosis/reading-a-noisy-tweak-log` carried a link labelled "a doubled prefix
and other record-declaration faults" pointing at an article that does not cover
doubled prefixes. Repointed at the new error-signatures article.

**A mining pass over a year of sessions returned 755 findings; about 500 of the
585 in scope were already written.** That is the number worth keeping: the
reference migration had already covered load order, archive internals, crash
forensics, input bindings, save formats and canon almost completely, and 9 of
the 21 findings in the hardest-won recovered slice were already here in full.
Thirty were genuinely absent and are now written; fifteen existing articles
gained a dimension they lacked.

**Four real duplications were found and collapsed** - unlisted archives,
disjoint fields on a shared record, accumulation DOF, and a log artefact from
parked archives. In each case the fuller treatment stayed and the other became a
pointer. One of the four had been introduced by the same agent that found it.

**What was deliberately not written** is as much of the shape as what was. About
120 findings the report tagged BASE are mod-behaviour by this bundle's own
boundary - one author's humanity tables, another's rent ladder, per-shader
parameter guides - and belong to a user bundle rather than a shipping one; where
one carried a transferable pattern, only the pattern was taken. About 25 more
are image-editing and streaming knowledge: real, but not about this game.
Single-search game trivia was declined against the area's standard, which is
that an article should answer something expensive.


## 2026-08-24 (overnight — the archive sweep)

**The bundle went from 21 articles to about 130, and the second half did not
come from the reference files at all.** It came from mining a year of archived
sessions for findings that existed only in transcripts. That produced four areas
nothing had ever covered: how the render and capture pipeline composes, what the
game establishes as canon versus what fans assert, gameplay mechanics read out of
the shipped scripts, and method — how work *about* an install goes wrong.

**The pattern across every one of them is that somebody was wrong first.** A
defaults file that turned out not to hold the defaults, because the mod writes
its own defaults table at boot. An empty binding store that looked exactly like
a wrong store, so the search went looking for the file instead of the data. A
capacity read from an API that saturates, returning a plausible number nothing
about which looked wrong. A wiki date traced to a single developer tweet saying
the studio deliberately never specified it. Each of those is written with the
failed theory intact and a note on why it was believable, because a reader who
takes only the conclusion walks the wrong road again.

**Several arrived as corrections from the person who plays the game**, and those
are the expensive ones: clothing has carried no meaningful stats since 2.0; a
character-lighting shader's axes are not the conventional ones, which invalidated
an entire prior session of placement advice; a corpo V really does start rich.

Two things were deliberately kept OUT despite being hard-won. The family's own
shell and scripting traps — facts about tooling, not about the work. And a large
body of one user's invented setting material that reads exactly like canon:
named AIs, a project, directors, a first name attached to a character the game
only ever surnames. The canon area carries a "what is deliberately not here"
section saying so.

Also this session: a bootstrap tool so a fresh install can build its own user
bundle, and `-Lint` on the validator — kept strictly apart from conformance,
because the spec forbids failing a bundle for drafts or unwritten links, and a
bundle mid-documentation is supposed to look unfinished.


## 2026-08-24

*(late - the reference migration, and what it turned up)*

**The bundle roughly tripled today, and almost none of it was new research.** It
came out of skill reference files that had quietly stopped being instructions.
Something like 2,600 lines were sitting in files a skill re-reads *every session*
in order to answer a question somebody asks about once a year - the cost paid
constantly, the value collected almost never. That is the whole argument for
this bundle, stated as a bill.

The rule applied throughout is the one the skill states: **a skill file is read
to decide what to do; a reference explaining how something is laid out is read to
understand it.** Knowledge moved here, procedure stayed there, and the reference
files that were mostly explanation collapsed - `bisecting.md` 286 → 88 lines,
`crashes.md` 162 → 70, `input-bindings.md` 222 → 77. What is left in them is the
part that really is instruction: an invocation, a path, an order of operations.
Nothing was deleted before its new home existed.

Five areas are new - `/authoring`, `/conflicts`, `/diagnosis`, `/formats` and
`/input` - and between them they now carry most of the bundle. The count is the
least interesting thing about the day.

**What matters is the shape of what turned out to be worth writing down.** The
articles that earn their place are the ones recording a *wrong inference* beside
the right answer. An empty binding store looks exactly like the wrong binding
store, so "almost everything here is zero, this must not be where bindings live"
is a conclusion a careful person reaches and it is false. A capacity read
through an API that saturates comes back as a believable number in the right
units. A mod's shipped defaults read exactly like a choice a human made, and
attributing one to a real person had to be retracted. In all three the
conclusion on its own is nearly useless: a reader given only the answer walks
the wrong road again from the top, because the wrong road is the one that looks
sensible. So the articles carry both, and say what was ruled out.

**Several of these arrived as corrections from the user**, which is exactly why
they are worth the most. A finding that contradicts what a session already
believed is the one kind that could not have been reached by thinking harder -
and it is the kind most likely to be lost, because it lands mid-conversation,
gets acted on, and then disappears with the transcript unless somebody writes it
down here.

**Conformance and quality were separated deliberately, and the separation is
load-bearing.** `Test-Wiki.ps1 -Lint` now reports stubs still outstanding,
articles marked `stable` whose bodies are too short to have read anything, links
to articles nobody has written, and indexes that have drifted from the files
beside them - and **none of it touches the exit code**. Two reasons, both
mattering. The spec forbids rejecting a bundle for a missing optional field, an
unknown type, an extra key or a broken link, so failing on any of that would
make the validator itself non-conforming. And a bundle in the middle of a
documentation pass is *supposed* to be full of drafts and unwritten links; a
check that fails for that is useless exactly when the work is happening. Lint
makes the shape of the gap visible without turning "unfinished" into "broken".
Among its warnings `index-drift` is the one to act on first: every other gap is
one you can see, and that one is a gap that lies.

*(evening)*

**[a-capacity-read-from-the-wrong-api](/process/a-capacity-read-from-the-wrong-api),
written because the same machine produced two different wrong VRAM figures
within an hour and neither looked wrong.** `AdapterRAM` is a uint32 and
saturates at 4 GB, so every card above that answers "4 GB"; the registry QWORD
that fixes it is an enumeration, and index 0 was the integrated adapter, so the
careful second attempt answered "2 GB". One of those reached a crash diagnosis
before anyone cross-checked.

The article is in `/process` rather than `/engine` on purpose. The mechanism is
a Windows API detail and would date; the lesson is about how work goes wrong,
and it does not. A capacity read through an interface that cannot represent the
answer returns a **believable** number - right units, right order of magnitude,
no error and no null - and that is the whole problem: every other bad input
announces itself, and this one propagates into a report, then a diagnosis, then
advice about a machine nobody measured. The two tells are written down because
both are cheap: a value sitting on a power-of-two ceiling is saturation, and a
value matching a *different* device in the machine is a wrong index.

**The machine profile is now a generated artefact rather than a one-off.**
`New-SystemProfile.ps1 -Wiki` writes a `Machine Profile` article into the USER
bundle, so a fresh session reads what this hardware is instead of rediscovering
it - or worse, assuming it. It carries the VRAM warning above and a "what this
rules in and out" section derived from the actual numbers, because the useful
output is not "32 GB of VRAM", it is "VRAM exhaustion is not the first thing to
suspect here, and on weaker hardware that reverses". The tool refuses to write
it into this bundle: a machine profile is one person's hardware and never ships.

*(later the same day)*

**Process knowledge now lives here too, because a lesson that exists only in a
conversation is a lesson the next session has to learn again.** A documentation
pass over ~80 mods produced real method - how to partition writers, what to do
when two of them collide, how to tell a derived identifier from a fact - and
none of it was written anywhere a fresh start would look.
[running-a-documentation-pass](/process/running-a-documentation-pass) is that,
in a new `/process` area. The area exists because these are not facts about the
game; they are the ways work *about* the game goes wrong, and mixing them into
the engine notes would have hidden both.

The expensive one is the partition rule. Splitting agents by theme rather than
by explicit filename ownership put one mod into two briefs, and the writer that
finished second overwrote the first with no error and no record. Research was
lost and it was found by accident. That is why the rule is filename ownership
and why the repair is stated as additive - restoring the first version over the
second repeats the bug with the roles swapped.

**[defaults-can-be-written-by-code](/patterns/defaults-can-be-written-by-code)
is the one worth reading even if nothing else here is.** A mod seeds its own
settings during init, before the saved config loads, and persists them - so a
value in a live settings file can have been chosen by nobody. The first reading
of that case attributed the setting to the user, in a report, to a real person
who had never heard of the option, and it had to be retracted. The general rule
is stated plainly because getting it backwards misassigns responsibility in
whichever direction you got it wrong: *"who wrote this value" is a question
about code paths, not about file contents.* The article carries the mechanism -
the defaults table aliased to the live config, the apply pass that drops keys
absent from defaults, and the deduction that follows from those two (if user
settings survive a restart, something must be creating their keys before load).
It also carries the hazard on the other side: a mod with no settings-migration
code silently restores its seeded defaults on a version bump, so anything
recorded as "the user changed this" needs re-checking after that mod updates.

**And the reference migration.** `environment.md`, `script-cache.md` and
`cetmonkey.md` had grown into three of the largest files in the family, and
almost none of what made them large was instruction. A skill file is read to
decide what to do; a reference that explains how the compiled bundle is laid out
is being read to understand something. Those rot at different rates and belong
in different places, which is the whole argument for this bundle existing.

Eight articles came out of them, in two new areas. `/engine` holds what is true
of the game regardless of manager: the compiled script bundle and the three ways
to get a false absence from it, the log-rotation trap where every archived
redscript log is named for the run that *replaced* it, the CET Lua runtime
including the out-param return slot that moves between builds and the
`firstArray` idiom that survives the move, the two load-order domains that no
single list ranks, and the option registry that outranks any mod's label.
`/install` holds what is only true of a particular assembly - Vortex hardlinks,
MO2's virtual filesystem, Wabbajack deleting anything not tagged `[NoDelete]`,
and the override-versus-patch decision whose real danger is silence rather than
breakage.

The skill files keep pointers and the parts that genuinely are instructions -
the compile-test invocation, where this family stores its records, the
PowerShell traps in its own tooling. Nothing was deleted before its new home
existed.

Two judgements worth recording. The CET material is here as *engine* knowledge -
LuaJIT limits, how redscript out-params surface, what `uiData` and `resolves`
mean - while the specific helper contract of the script runner that hosts it
stayed in the skill, because that is one mod's interface and this bundle ships.
And the PowerShell traps stayed in the skill deliberately: they are true and
hard-won, but they are facts about this family's own tooling, not about
Cyberpunk, and a shipping game wiki is the wrong home for them.

**Three patterns added, all earned from a live diagnosis rather than from
reading.** A drop point that would buy nothing turned out to be a single
`ALLOW NOTHING` flag that bypasses a mod's entire filter chain - no error, no
log line, and the settings that looked like the fix were the exact ones the flag
ignores. Two other mods hooked the same sell path and looked guilty; both were
purely additive. That produced
[override-flag-silences-the-filter-chain](/patterns/override-flag-silences-the-filter-chain),
including the habit of naming what was ruled out.

Establishing whether the flag was a shipped default or a user choice exposed a
wider hole: `user.ini` is only half the settings picture, because CET Lua mods
persist to their own JSON. An absent value there reads exactly like a default.
Written up as
[live-state-is-not-defaults](/patterns/live-state-is-not-defaults) - the rule is
to ask which store a mod writes to before asking what the value is.

The third came from a documentation pass over ~80 mods:
[shared-core-announces-its-addons](/patterns/shared-core-announces-its-addons).
A core dependency that reports its active slots at runtime beats every
file-presence proxy, because it reports what actually ran rather than what was
copied.

All three name mods only as examples. The per-mod detail - which flags this
install has set, what each add-on does - stayed in the user bundle, which does
not ship.


## 2026-08-23

**Creation** - bundle started. OKF 0.2.

Scope set deliberately narrow: this bundle ships, so it carries only game,
engine and format knowledge, plus cross-mod interaction *patterns* that are
really facts about the game's data model. Anything about a specific mod's
settings or behaviour belongs to the per-user bundle and never ships.

First articles are migrations of findings that were sitting in skill reference
files, where they were reference material wearing instructions' clothing.
