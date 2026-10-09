# Bisecting a broken load order

> **Verified:** Cyberpunk 2077 patch 2.31 - August 2026
> **Re-check after a patch:** Method rather than data - largely patch-independent. The one thing to re-check is where files are staged on the install in front of you, if anything stages them, since the parking advice assumes same-volume moves.

**The knowledge that used to live here is now in the base wiki**, which ships
with the skill. This file keeps only what changes what you *do*.

| what you need | article |
|---|---|
| when to bisect at all, the layer pass, the parking mechanics that void a round, and where to park | `/diagnosis/sizing-a-bisect-to-the-list` |
| why a failing round is not evidence about anything in it, and the standard of proof for naming a cause | `/diagnosis/a-failing-round-narrows-nothing` |
| a guard - a throwaway one-function mod that logs the value separating two hypotheses | `/diagnosis/writing-a-guard-mod` |
| why no watcher can return the verdict, and what to sample while the game is still hung | `/diagnosis/a-hang-and-a-crash-are-different-faults` |

## Before the first round

1. **Reproduce.** One crash or hang is not a deterministic fault. If it is
   intermittent, every clean round is noise that looks like information.
   "We don't know what that was, watch for it" is a legitimate outcome.
2. **Read the diff before proposing a bisect at all.** `New-InstallSnapshot.ps1`
   and `Compare-InstallSnapshot.ps1` answer "what changed" in about a second, and
   at this game's load times bisecting costs an evening to rediscover something a
   diff names immediately.
3. **Snapshot `modlist.txt`** with `cyberwise/tools/ModFileBackup.ps1`. A bisect
   rewrites the load order repeatedly, and `-Restore` below only undoes the
   parking, not an order something else rewrote underneath it.
4. **Size the method to the list** before halving anything - under about twenty
   mods, do not bisect. `/diagnosis/sizing-a-bisect-to-the-list`.

## NEVER PARK, UNLINK, DISABLE OR REMOVE A MOD WITHOUT ASKING FIRST

Not as a bisect round, not as a quick test, not "just to check". Name the mod, say
what parking it would prove, and wait for a yes. It is their install and their
playthrough, and a mod removed underneath them can cost save state, not just time.

The tooling makes parking easy, which is exactly why the rule has to be explicit.
This holds even when the suspect is obvious and the test is one round - an obvious
suspect is a reason to **ask confidently**, not a reason to skip asking.

## Arm the round AND launch the game yourself

The person testing has exactly one job that cannot be automated: looking at the
screen and saying what happened. Everything either side of that is chores, and
handing those back is what makes a twenty-round bisect feel like a punishment.
They glance over, the game is up, they try the thing.

```powershell
tools\Invoke-BisectRound.ps1 -GameRoot '<path>' -Round C -Park cut3.txt -Plan
tools\Invoke-BisectRound.ps1 -GameRoot '<path>' -Round C -Park cut3.txt -Launch
tools\Invoke-BisectRound.ps1 -GameRoot '<path>' -Round C -Restore
tools\Invoke-BisectRound.ps1 -GameRoot '<path>' -Status
```

**Launch it the way they play it**, not by running the exe. A storefront launch
applies their configured launch options; bypassing those tests a configuration
they never play. `launcher-configuration.json` in the game root names the
platform, and the tool reads it rather than guessing from the path.

The tool also writes a manifest per round, so "which configuration was that?" is
answerable three rounds later, and refuses to park a partial set - a name that
resolves to nothing parks nothing, which scores as "the fault went away".

## During the rounds

- **Never modify mod files while the game is running.** Gate every move on the
  process being closed.
- **Treat a mod-manager deployment mid-bisect as voiding the round.** Re-arm
  rather than reasoning about what it might have restored.
- **Restore from the manifest, not from memory**, and report loudly if a file is
  not where the manifest says it was parked.
- **One variable per test**, written down.
- **Do not theorise while they are launching.** They need the next instruction,
  not a hypothesis. Narrate findings afterwards.

## Naming an answer

**The verdict is theirs.** No watcher can tell a livelock from a loaded game
sitting at a menu.

**Name a cause only by adding it back alone to a proven-clean base, then
validating against the FULL load order.** Never by elimination - see
`/diagnosis/a-failing-round-narrows-nothing`, which is the correction that matters
most on a long bisect.

Say plainly which configuration was tested, what the outcome was, and what remains
untested. When an earlier answer is disproved, say it is disproved - the next
person will otherwise propose it again.
