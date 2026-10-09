---
type: Interaction Pattern
title: A mod can change what a vanilla key does without registering a key of its own
description: The key a player presses because of a mod may exist only in the base game's own mapping file. A tool that hides base-game bindings to cut noise therefore hides exactly the rows the user came to look up.
tags: [input, keybinds, vanilla, reporting]
status: stable
generated: { by: "claude", at: "2026-08-24T21:40:00-04:00" }
---

# A mod can change what a vanilla key does without registering a key of its own

The assumption behind every binding harvest is that a mod which gives you a new
control declares a new binding. It is wrong often enough to matter.

A mod can instead **take over an existing vanilla mapping** - reuse the action
the base game already ships, extend it into contexts it was never live in, or
change what happens when it fires. The mod registers nothing. Its key exists
only in `r6\config\inputUserMappings.xml`, the base game's own file.

## Worked example: four mappings nobody's mod declares

Free-look leaning, and cycling consumables and grenades, ride these:

| mapping | key on a default install |
|---|---|
| `LeanLeft_Button` | `IK_Q` |
| `LeanRight_Button` | `IK_E` |
| `UseConsumable_Button` | `IK_X` |
| `CombatGadget_Button` | `IK_MiddleMouse` |

All four are vanilla, and they are declared in the base-game file:

```xml
<mapping name="UseConsumable_Button" type="Button">
  <button id="IK_Pad_DigitUp" />
  <button id="IK_X" overridableUI="useConsumable" />
</mapping>
```

A mod's own `r6\input\*.xml` may reference such a mapping without owning it -
appending the vanilla action into contexts the base game never put it in:

```xml
<context name="VehicleMountedWeaponsAutodrive" append="true">
    <action name="UseConsumable"  map="UseConsumable_Button" />
</context>
```

That line adds behaviour and declares no key. Search every mod store for `IK_X`
and you find nothing. The player is pressing `X` because of the mod, and the only
file that says `X` is the one about the base game.

## The consequence for anything that reports bindings

Base-game rows are excluded by default from a report *about mods*, for a good
reason: they are ~99 identical rows on every install and they drown the ~50 that
are actually this person's.

But the exclusion is a bet that base-game rows are boilerplate, and this pattern
is where the bet loses. **The rows hidden as noise are exactly the rows the
question was about.** Somebody asking "what leans?" or "what cycles my grenades?"
gets an answer with the vanilla mapping missing, and it looks like a complete
answer.

Two rules follow:

- **Never let the exclusion reach a "who claims this key?" query.** Hiding a row
  from a rendered sheet is presentation; hiding it from the gate is a wrong
  answer. See [five separate stores](/input/five-binding-stores).
- **When a mod is known to drive a vanilla action, name the vanilla mapping
  explicitly** rather than waiting for a harvest to surface it. It will not.

## Why it is easy to get wrong twice

The mod's own artefacts are all consistent with "this mod has no keys". Its
`r6\input\*.xml` declares actions and no keys of its own; its scripts may contain
no reference to the mapping name at all, because the hook is on the action, not
on the mapping. Grepping the mod for the key and finding nothing is exactly what
this pattern looks like from the inside, and it reads as proof the mod is
keyless.
