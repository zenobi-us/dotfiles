---
name: cyberwise-recommends
description: Tell someone a mod is missing only when it actually blocks what they are doing, and never twice - the capability checks behind "you cannot do that without X", and the on-disk preference that records a no. Use when a requested task needs a tool the install does not have, and before mentioning any mod nobody asked about.
---

# Cyberwise: recommending, sparingly

> **Verified:** Cyberpunk 2077 patch 2.31 - August 2026

Load `cyberwise` alongside this for the method rules.

This skill exists to say **one useful sentence at the right moment**, and to
shut up otherwise. It is not a modlist, not a starter pack, and not a curated
collection. `cyberwise-reports/tools/Compare-Collection.ps1` already carries the
rule this skill inherits:

> It is not a shopping list and must not be presented as one.

**Hard cap: about six items.** If the capability table grows past that, this
skill has become the thing it was written to avoid. Adding a row requires a
concrete loss - something that becomes *impossible* or *invisible* without it.
"Popular", "most people use it" and "it's really good" are not criteria.

## The distinction the whole skill turns on

| | what it is | can the user mute it? |
|---|---|---|
| **Prerequisite** | they asked for something this install cannot do | **No.** It is the answer to their question |
| **Recommendation** | nobody asked; you noticed something missing | **Yes**, and permanently |

Getting this backwards in either direction is the failure mode.

Suppressing a prerequisite leaves someone staring at an empty result with no
explanation - "you have no appearance presets" is a lie of omission when the
truth is "nothing here creates them". Treating a recommendation as a
prerequisite is how a helpful tool turns into an upsell.

Concretely: asked to read appearance presets on an install with no ACU, say that
ACU is what creates them and there are none. Asked about *textures* on that same
install, say nothing about ACU at all.

## Before you mention a mod nobody asked about

```powershell
. tools\ModPreference.ps1
Test-RecommendAllowed -Item 'Appearance Change Unlocker'    # false -> silence
```

False means **silence**, not a softer mention. A user who said no and gets a
gentler version of the same suggestion has been ignored, and knows it.

Then, if they say no:

```powershell
Register-Decline -Item 'Appearance Change Unlocker' -Reason 'not interested'
Set-RecommendMode -Mode off        # "don't recommend mods to me, ever"
```

**One item per conversation. Once, ever.** A decline is permanent and dated.
Asking twice is the failure this skill exists to prevent, and "I forgot" is not
a defence the user can see.

## Where the preference lives, and why not in memory

`%USERPROFILE%\Saved Games\CD Projekt Red\Cyberpunk 2077\Cyberwise\preferences.json`

An agent's memory is good local mutable config and a bad authority for a rule
that governs behaviour:

- this family runs under **Claude Code and Codex**, and one agent's memory is
  invisible to the other;
- the skills **ship to other people**, whose agent has no memory of anyone's
  preferences and must not need one;
- a preference that governs a tool should be **readable and editable by the
  person it governs**.

An agent may also note the preference in its own memory. That is a cache. **When
the two disagree the file wins**, and the memory is what gets corrected.

The store fails **closed**: an unreadable `preferences.json` is treated as
`recommendations: off`. A corrupt file must never silently re-enable something
the user switched off.

## Tools here

| tool | what it does |
|---|---|
| `tools/Test-Capabilities.ps1` | what this install cannot do, and what is missing to do it |
| `tools/ModPreference.ps1` | read and record what the user has already said |

```powershell
tools\Test-Capabilities.ps1 -GameRoot '<path>'                # the table
tools\Test-Capabilities.ps1 -GameRoot '<path>' -For presets   # exit 1 if blocked
```

`-For` is the gate other skills call before promising something. It names the
missing dependency chain too - "install ACU" is useless advice to somebody who
has no CET.

## What is deliberately not here

**The framework layer.** `cyberwise/tools/Test-InstallReady.ps1` already checks
RED4ext, redscript, CET, ArchiveXL, TweakXL and Codeware, and answers "would
launching work". That is a readiness question. This skill answers a capability
question, and covers the **CET-mod layer** readiness does not - ACU above all,
because its absence is invisible: the appearance tools in `cyberwise-saves` find
an empty folder and report nothing wrong.

**Anything version-shaped.** "Your ArchiveXL is out of date" belongs to
readiness, not here.
