# TweakDB edits and finding game text - where the knowledge now lives

> **Verified:** Cyberpunk 2077 patch 2.31 - August 2026
> **Re-check after a patch:** HIGH DRIFT. Record IDs, vendor stock structure and price component names all move between patches. Re-verify every ID against the current string table; never carry one forward on faith.

**The full account is in the base wiki** (`wiki/` in the Cyberwise repo):

| article | covers |
|---|---|
| `/authoring/tweakxl-records-are-last-wins` | resolution is per **record**, not per file - the `zzz_` override that beats another author's record without a conflict rule and survives their updates, the retire condition that stops two mods silently fighting over one value, and `$base` over a hand-written `$type` |
| `/authoring/a-yaml-error-disables-the-whole-file` | `yaml-cpp` rejects the document, so one 3-space line kills **every** record in the file; the `error at line N, column M: illegal map value` string, and why the symptom is a mod that appears installed and does nothing |
| `/authoring/finding-the-real-record-id` | the string table TweakXL writes under `r6\cache\modded\` (and its `_ep1` suffix), why CDPR's inconsistent naming defeats every guess, and how to confirm a record resolved |
| `/authoring/vendor-stock-and-pricing` | inline versus shared stock records and the 61-against-166 undercount, `generationPrereqs` tier gates, `quantity` being `array:TweakDBID`, inventories persisting in the save, `.buyPrice` as an array of components, and the `Price.*` records nothing reads |
| `/authoring/finding-in-game-text` | the per-locale `onscreens_final.json`, what it does **not** contain, entries with no `secondaryKey`, and what a `LocKey` actually is |
| `/authoring/detecting-a-player-action-from-an-interaction` | why behaviour keyed to a LocKey breaks silently when another mod owns the text |
| `/authoring/archivexl-node-deletions` | the neighbouring `.xl` layer - node types, whole-file blast radius, and editing another mod's sector without repacking it |

What stays here is only what changes what you **do**.

## Extract the ID list before writing a line of YAML

The string table under `r6\cache\modded\` is the authority, it exists only once
TweakXL has run, and its filename carries an expansion suffix on a Phantom
Liberty install. Verify **every** ID against it before shipping. A guessed ID
produces a mod that loads clean, logs nothing, and does nothing - which is
indistinguishable from a dozen other failures, so it is the last thing anyone
suspects.

## Prefer a `zzz_` record override to editing their file

TweakXL is the only mod layer with partial-override granularity. When the fix is
a record, ship a folder that sorts last and redeclares just that record: their
files stay untouched, no conflict rule is needed, and the fix survives their
updates. Write the **retire condition** into the file, and register the upstream
hash so a sweep tells you when they change it.

## Read the TweakXL log after every change

`red4ext\plugins\TweakXL\TweakXL-<date>.log`. Your file named, with nothing
beneath it, is the check. An `error at line N` under it kills the whole file, and
that is the first hypothesis for any tweak that "does nothing" - before load
order, before conflicts, before the record ID.

Then confirm positively from the CET console:

```lua
print(TweakDB:GetFlat("<YourRecord>.<field>"))
```

## Search the right language's text archive

If the user quoted game text, search the archive for the locale **they** were
playing in. And do not conclude "that text is not in the game" from `onscreens`
alone - spoken dialogue and news broadcasts are not in there.
