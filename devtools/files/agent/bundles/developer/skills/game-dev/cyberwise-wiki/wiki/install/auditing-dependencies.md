---
type: Environment
title: A missing-requirement report is wrong in both directions
description: Managers match requirements by mod id, so a fork or a bundled copy reads as absent whatever is on disk; mod pages state compatibility in prose that looks exactly like a requirements list; and an orphaned optional file installs cleanly and looks like a working mod.
tags: [dependencies, requirements, frameworks, audit, nexus, verification]
status: stable
generated: { by: "claude", at: "2026-08-24T20:20:00-04:00" }
---

# A missing-requirement report is wrong in both directions

Dependency audits feel like the safe kind of check - a list of what is required,
a list of what is installed, subtract. In practice both lists are unreliable in
opposite ways, and the errors are silent: a phantom missing requirement sends
somebody installing a framework they already have, and a genuinely orphaned mod
sits there looking fine.

## False positives: the requirement is satisfied by something the check cannot see

**Requirements are matched by mod id.** That is the only identifier a manager
has, and it is an identifier of a *page*, not of a capability. So the capability
can be fully present and still read as absent:

- **a fork** - same capability, different page, different id
- **a repack** - the framework's files inside somebody else's download
- **a bundled copy** - a mod shipping its dependency so it works standalone

None of those change the id the requirement names, so no amount of the right
files on disk satisfies the check.

**Framework aliasing** is the same failure with a wider blast radius. It has
three recurring shapes:

| shape | what it looks like |
|---|---|
| a capability shipped under a different page id | the requirement names one page; the thing is installed from another |
| a fork with a different name | both are real, both work, only one matches |
| two different pages whose mods deploy into one identically-named folder | one folder on disk, two possible owners, and the folder name settles nothing |

The check that beats all three is on disk, not in the list: **look for the
capability itself** - the module namespace, the DLL, the framework's own log
line reporting its version - rather than for the id. A framework that loaded
usually says so somewhere, and its own statement outranks a matcher's.

## False positives, again: prose that is not a requirements list

A mod's description commonly contains a **"compatible with"** list, and it looks
exactly like a requirements list: a heading, a column of mod names, links.

One audit derived requirements from that shape and flagged **seven** clothing
mods as needing a body mod. **Six of the seven said in their own titles** that
they auto-refit for the vanilla body - the list was recording what they were
compatible *with*, not what they needed.

> Any requirement derived from prose needs the surrounding list read to the end,
> and the mod's own title read as well.

The generalisation is unglamorous: the structured fields on a mod page are the
requirements; free text is the author talking. Treat a requirement read from
prose as a lead to confirm, not a finding to report.

## False negatives: the optional file that installs cleanly on its own

The opposite failure is quieter. Many pages carry **optional "assets" or
"compatibility" files** that are add-ons to a main file. Downloaded and
installed alone, one of these:

- installs without error
- produces a normal-looking mod folder
- appears in every list as a working mod

and does nothing, because the resources it patches are not there. **The failure
surfaces somewhere else entirely** - a resource-patch error naming paths the
missing main file would have provided, attributed to whichever framework
reported it.

The trap when investigating: **a page whose files are all MAIN looks identical,
from folder names alone, to a page whose add-ons are orphaned.** Both are "some
folders from one page". So:

> **Never claim a missing main file without reading the host's files endpoint
> and checking each file's category.**

The category field is the thing that distinguishes the two cases, and nothing on
disk carries it. Without that check the claim is a guess about somebody's
install, and the remedy it implies - "download the main file" - is wrong half
the time.

## What to report

State which of the three you did: matched an id, read a page's prose, or found
the capability on disk. They are not equally strong, and a reader who knows
which one produced the finding can judge it. An unqualified "requires X, not
installed" hides the difference between a fact and a string comparison.

## Related

- [A staging folder name is a record of the download](/install/staging-folder-names) - why an id mismatch is usually not a bad id
- [Reading a redscript failure without trusting its own explanation](/engine/reading-a-redscript-failure) - what an unsatisfied dependency looks like when it is real
- [A shared core that announces its own add-ons](/patterns/shared-core-announces-its-addons) - when the framework will simply tell you
