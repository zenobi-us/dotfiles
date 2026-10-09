---
type: Interaction Pattern
title: A mod's shipped defaults are not proof a human chose anything
description: A mod can seed its own settings at runtime and persist them, so a value in a live settings file may never have been chosen by anyone - and a key absent from the defaults file is not evidence a user set it. Worked from a CET mod that writes its defaults table during init, before the saved config is loaded.
tags: [settings, defaults, modsettings, cet, redscript, migration, diagnosis]
status: stable
generated: { by: "claude", at: "2026-08-24T19:10:00-04:00" }
---

# A mod's shipped defaults are not proof a human chose anything

There is a comfortable inference that is wrong often enough to be dangerous:

> The defaults file does not mention this key. The live settings file has it set.
> Therefore the user set it.

Every step reads like arithmetic and none of it holds. **A mod can write its own
settings at runtime**, and when it does, the value in the live file was authored
by code, not by a person - with no marker of any kind distinguishing the two.

**The rule: "who wrote this value" is a question about code paths, not about
file contents.** A settings file records what a value *is*. It records nothing
about where the value *came from*. Two entries sitting side by side, identical
in form, can have completely different provenance - one typed into a menu, one
written by an initialiser the first time the mod loaded. Reading the file harder
never separates them. Reading the code that writes the file is the only thing
that does.

## The worked case

Vendor Filters, a CET Lua mod, is used here as an example; nothing below is
specific to it beyond the shape of the code.

A setting was found active on an install. The mod's shipped defaults file
contained **no key for it at all**. The first reading - mine - concluded that
the flag must therefore have been set by the user. That was wrong, and the user
knew it was wrong immediately, because they had never heard of the option. The
attribution had to be retracted.

What actually happens, at **every** launch, inside `onInit`, and crucially
**before the saved settings are loaded**:

```lua
if tag == "ThisVendorDoesNotBuyAnything" then
    Settings.default.configuration[index.."_Nothing"] = is_active
```

A discovery pass walks data files the mod ships and writes the result into the
**defaults table in memory**. Initialisation then ends with an unconditional
save, persisting those seeded values to the settings file on disk. The value
exists, is explicit, is in the live file - and no human ever chose it.

### The three structural facts that make it work

The third is the one that generalises, and it is the reason this is a pattern
rather than one mod's bug.

1. **`settings.current = settings.default` is an alias, not a copy.** In Lua
   that assignment shares one table. So every write to "the defaults" before
   load is a write to the live configuration.
2. **The apply pass iterates the DEFAULT table.** Any key absent from that table
   is silently dropped from the user's file - not preserved, not warned about.
3. **Therefore user-set values can only survive a restart if something creates
   their keys before load.**

That third point is a *deduction*, and it is the transferable technique:

> **If user settings survive a restart, something must be creating their keys
> before load. Find that thing.**

You can reach that conclusion from the apply pass alone, before ever finding the
seeding code. It tells you a seeding pass must exist, which turns an open-ended
search into a targeted one.

### The corroboration that settled it

No single source proves provenance. Three cheap ones together did:

- **The mod's own first-run log line**, recording that no settings file existed
  and defaults were used. That line is the moment the value came into being -
  the closest thing to a birth certificate a setting ever has.
- **The mod page documenting the out-of-the-box values**, which matched what was
  on disk.
- **A compatibility note from the author** telling users they may need to
  manually toggle the setting *off* - an explicit acknowledgement that it ships
  on.

An author telling people to turn something off is strong evidence it was never
the user who turned it on.

## Three ways a mod writes its own settings

**A first-run discovery pass**, as above. The mod scans the install - which
add-ons are present, which records exist, which data files it shipped - and
persists what it found. Everything it wrote looks like configuration because it
*is* configuration; it just was not configured by anybody.

**A version-migration backfill.** On update, the mod notices its stored settings
are from an older schema, adds the keys the new version expects, and saves. Each
backfilled key now exists with an explicit value and no history. This is the one
that most often produces "the user must have set this", because the key is
present, explicit, and absent from any defaults file the reader can find - it
did not exist when those defaults were written.

**A settings framework persisting a control with no declared default.** Where
mods share a settings system, the framework serialises the current state of every
registered control. A control whose author declared no default still has a state,
and that state is written out like any other. The value is real, it is in the
file, and it belongs to the framework - not the author, not the user.

## The hazard on the other side: no migration means silent reversion

The same design produces a second failure, later in time.

A mod with **no settings-migration code** and an **all-or-nothing compatibility
check** has only one move available when a saved config declares an incompatible
version: throw the whole thing away and re-seed. There is no partial upgrade
path, because nothing maps old keys to new ones.

So on a version bump, the entire configuration reverts to seeded defaults, and a
setting the user deliberately turned off **silently comes back on**. Nothing
errors. The settings menu shows the new value as though it had always been that.

**A mod with no settings-migration code will silently restore its seeded
defaults on a version bump.** The practical consequence for anything written
down: **any setting documented as "the user changed this" must be re-checked
after that mod updates.** A settings note has a shelf life bounded by the mod's
next release.

## The method

**Read the init, discovery, apply and migrate paths before attributing a setting
to anyone.** Concretely, before writing "the user set X":

1. Find where the mod *writes* its settings, not only where it reads them. A
   save routine called from anywhere other than the settings menu is the tell.
2. Look for an initialisation or first-run branch - guarded on "no config yet",
   "version differs", or a stored schema number - and check whether it runs
   before or after the saved file is loaded.
3. Check whether the current-settings table is an **alias** of the defaults
   table. If it is, every write to defaults is a write to live config.
4. Check what the apply pass iterates. If it walks the default table, keys
   missing from it are being dropped, and user values can only persist because
   something seeded them.
5. Look for a migration path keyed on a version string. If there is none, treat
   every recorded value as provisional across updates.
6. Look for the mod's own first-run log line, its documented out-of-the-box
   values, and any author note about toggling the setting.

If a seeding or migration path can reach the key, the honest statement is
**"this value is set to X; I could not establish whether a person chose it"** -
which is a perfectly good thing to write down, and far better than the
alternative.

## Why it is worth a pattern

Getting it wrong **misassigns responsibility**, in one direction or the other,
and both directions cost something real.

- Blaming the user for a mod's shipped behaviour sends them to change a setting
  they never touched - which the mod may rewrite on the next load anyway. They
  now believe the setting is broken. This is what happened in the case above, to
  a real person, and it had to be retracted.
- Blaming a mod for a user's choice sends somebody to report a bug against an
  author whose mod is behaving exactly as designed.

Neither produces an error message. Both produce a confident, wrong sentence in a
report - and the file on disk agrees with it.

## Related

- [A settings file the game rewrites answers "what is set", never "what is default"](/patterns/live-state-is-not-defaults) - which store to read, before this question of who wrote it
- [Documenting a large mod list without producing a report nobody can trust](/process/running-a-documentation-pass) - saying what you did not verify
