---
name: cyberwise-feedback
description: Help someone report a problem with Cyberwise itself, or correct something it got wrong - gather the facts the author needs, write it up, and send it to the right place (Discord or a GitHub issue). Use when someone says a cyberwise skill or tool is broken, gave wrong advice, or contradicts what they see in game; when they ask how to report a bug, request a feature, or contact the author; and when you yourself have just got something wrong and they are visibly annoyed.
---

# Cyberwise: reporting a problem

> **Verified:** August 2026
> **Re-check after a patch:** Nothing here depends on a game patch. Re-check the
> Discord invite and the GitHub URL if either moves.

This is about **Cyberwise being wrong**, not about a mod being broken. If the
game is misbehaving, the topic skills are for that; come here when the notes, a
tool, or your own answer let somebody down.

## Do the work yourself

They are reporting because they are already stuck. Handing back a form to fill in
is asking them to do the diagnosis a second time, by hand.

**Run the tool, write the report, then show it to them for approval.** The only
thing they should have to supply is what they expected to happen - and often they
have already said it in the conversation you are reading.

```powershell
tools\New-ProblemReport.ps1 -Summary '<one line, reads like a title>' `
    -Detail '<what happened, their words where possible>' `
    -Expected '<what they thought would happen>' -Area '<skill or tool, or unsure>'
```

It writes two files: the full report, and a **`.discord.md` trimmed to fit one
message**. Discord refuses a message over 2000 characters rather than shortening
it, so an untrimmed paste does not arrive short - it does not arrive at all.

It collects the version, the branch, whether the checkout has uncommitted
changes, how the skills are installed in each agent, PowerShell and Windows
versions, and the game patch **only if a game root is passed**. It never guesses
a game path: a default that happens to exist on the wrong machine produces a
plausible report about a game nobody was playing.

For anything install-shaped, attach a system profile too (`cyberwise-reports`) -
that is where manager, load order and framework detection live, and duplicating
it here is how two implementations come to disagree.

## Where it goes

Both routes reach the same person. Offer both and let them pick; if they have no
preference, **Discord** - it is faster and it does not need an account they may
not have.

| route | where | best for |
|---|---|---|
| Discord | <https://discord.gg/UltraPlace> - post in the **cyberpunk** channel and tag **@GhostWorldTourist** | "is this me or the tool", anything needing back-and-forth, screenshots, quick questions |
| GitHub | <https://github.com/GhostWorldTourist/cyberwise/issues/new/choose> | something reproducible, a wrong note, a tool that errors, a feature request - anything worth a record |

**Open the link for them.** Do not print a URL and stop. Same rule as every other
tool here: if something can be launched, launch it.

You cannot post to Discord for them. What you *can* do is put a finished message
in their hands so the entire job is one paste.

## What makes a report actionable

In order of how often each is the thing that was missing:

1. **What you expected instead.** The single most useful line, and the one people
   leave out. "It said F3" is a fact; "it said F3 but I rebound that to F7" is a
   bug report.
2. **The exact text**, pasted rather than paraphrased. A paraphrased error is a
   different error.
3. **Which version.** The tool reads it from the checkout; a hand-installed copy
   reports `unknown`, which is itself worth knowing.
4. **What you were doing when it happened**, in one sentence.
5. **Whether it repeats.** Once is an anecdote. "Every time, on this file" is a
   reproduction.

## Report yourself honestly

You are frequently the thing that went wrong, and you are writing the report. That
is a conflict of interest and it has to be handled explicitly.

- **If your own answer was the failure, say so in the report**, in the same plain
  words you would use about somebody else's code. A report that quietly reframes
  "the assistant asserted something false" as "the documentation could be clearer"
  wastes the author's time and buries the actual defect.
- **Do not upgrade their complaint into something more flattering, or downgrade
  it into something smaller.** Quote them where you can.
- **Do not invent reproduction steps.** If you do not know what they did, write
  that you do not know. A confident wrong repro sends the author looking in the
  wrong file for an afternoon.
- **Do not apologise in the report.** It is not correspondence; it is evidence.

## A correction is the most valuable kind of report

The repo's stated position is that a note which turns out to be wrong is worse
than no note. So when the user's own observation contradicts something written
here, that is not a minor complaint - **it is the report the author most wants.**

Say which file and which claim, and what they saw instead. `SKILL.md` files and
`references/*.md` carry a **Verified** stamp naming the patch it was checked
against; include it, because "true on 2.2, false on 2.31" is a different bug from
"never true".

## Before you send: privacy

The report is redacted by default - profile path, account name, machine name -
and `-NoRedact` turns that off for local use only.

Three things it cannot decide for them, so ask:

- **A mod list is personal data.** It discloses interests. Never attach a manifest
  without asking, and offer `-HideNSFW` when you do.
- **Never attach a save file or a decoded save.** They are personal, large, and
  almost never the evidence anyone needs.
- **Read the report back before it goes.** It is their words going out under their
  name, to a stranger on the internet. Show them the text, not a summary of it.

## Tools

| tool | what it does |
|---|---|
| `tools/New-ProblemReport.ps1` | gathers version, install shape and environment; writes the full report and a Discord-sized paste |

The repo also ships GitHub issue forms under `.github/ISSUE_TEMPLATE/` - a bug
report and a "something here is wrong" correction - whose fields are the same
ones this skill gathers, so a report written here can be pasted straight in.
