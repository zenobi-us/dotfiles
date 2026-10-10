---
type: Process
title: A third-party program's menus cannot be recalled, and a wrong one costs more than the wrong answer
description: Five recorded cases of a confident menu path for somebody else's software, and five corrections. These interfaces change every release and are documented in screenshots, so a fabricated path is generated with exactly the same fluency as a real one - and the damage is to everything true you said afterwards.
tags: [method, tools, ui, credibility, evidence, corrections]
status: stable
generated: { by: "claude", at: "2026-08-25T11:20:00-04:00" }
---

# A third-party program's menus cannot be recalled, and a wrong one costs more than the wrong answer

This is the **most repeated correction in a year of this work**, across five
different programs, and it is always the same shape: a confident path through
somebody else's user interface, and a person reporting that the option does not
exist.

The recorded cases:

- a mod manager's "export mod list" command - invented twice, in two separate
  sessions
- the same manager's file-conflict defaults: *"I think you made all of those up
  with no valid sources. None of those settings exist."*
- an overlay/monitoring tool: *"that tab doesn't even exist. Can you actually
  look it up?!"*
- a mouse vendor's configuration app: *"Those first two options don't even
  exist."*
- a process-priority utility, where the real control is named something else
  entirely
- a monitor's on-screen menu, quoted with picture modes the panel does not have

Not one of these was a hard question. Every one of them was answered from
recall.

## Why recall fails here specifically

- **These interfaces move every release.** A path that was right two versions ago
  is wrong now, and nothing about remembering it feels different.
- **They are documented in screenshots and videos**, so what is available to
  recall is a general impression of how such an application is laid out - which
  is exactly the material a plausible fake is made of.
- **There is no internal signal.** A fabricated menu path arrives with the same
  fluency and the same confidence as a real one. Nothing feels uncertain, so
  nothing prompts a check.

## The cost is not the wrong answer

Somebody who has been sent hunting through a menu that does not exist discounts
**the next five things you tell them**, including the correct ones. In this
corpus that has already happened: the response to a later, entirely sound
diagnosis was to ask whether it had been made up as well.

An investigation runs on the person's willingness to go and try things. That is
the resource this spends.

## What to do instead, in order

1. **Read the tool's own data on disk.** A manager's manifest, a profile file, a
   settings JSON, a log. This is usually *more* authoritative than the UI, and it
   is checkable - the whole
   [deployment manifest](/install/the-deployment-manifest) and
   [peripheral profile](/input/a-peripheral-profile-is-a-layer) work exists
   because the answer was on disk all along.
2. **Ask for a screenshot** of the actual screen. One image ends the argument and
   is faster than two rounds of guessing.
3. **Say you do not know the current interface.** It costs nothing and it is
   believed.
4. If a UI path genuinely must be given, **name the version it was true for**, so
   a mismatch reads as drift rather than as invention.

## The neighbouring failure

Handing your own inference back as though the other person had said it - *"you
said it was mod X"* when mod X was a guess you made three messages ago. It
destroys the same resource, and it is harder to recover from, because now the
record of the conversation is wrong too.

## Related

- [A passing validator has checked structure, not truth](/process/a-passing-check-is-not-a-true-claim)
- [A mod page's own text may be unreachable to automated fetching](/install/a-mod-page-can-be-unreachable-to-tooling) - the same answer, asking for a paste
- [An empty result is the absence of evidence](/process/an-empty-result-is-not-a-finding)
- [The display is the last stage, and its "enhancements" fight the art direction](/rendering/the-display-is-the-last-stage) - a worked case of a menu whose own text describes the wrong direction
