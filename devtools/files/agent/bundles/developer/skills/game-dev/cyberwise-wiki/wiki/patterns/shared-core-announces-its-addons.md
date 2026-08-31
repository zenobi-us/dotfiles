---
type: Interaction Pattern
title: A shared core that announces its own add-ons turns "is this installed" into a lookup
description: Some mod families route every add-on through one core dependency that reports which slots are active at boot - a self-describing manifest that answers presence questions without a load-order audit.
tags: [frameworks, dependencies, diagnosis, presence, load-order]
status: stable
generated: { by: "claude", at: "2026-08-24T12:40:00-04:00" }
---

# A shared core that announces its own add-ons turns "is this installed" into a lookup

"Is this add-on actually running?" is one of the most expensive questions to
answer on a large load order. A file on disk proves nothing: it may be staged
but not deployed, deployed but outranked, present but failing its own
dependency check.

Some mod families answer it for you, and the answer is easy to walk past.

## The shape

A family shares one core dependency, and every add-on registers with it. The
core then reports its own roster - commonly as numbered onscreen strings the
game itself renders:

```
"<Core> mod slot 1: Active"  ->  <add-on name>
"<Core> mod slot 2: Active"  ->  <add-on name>
```

In Cyberpunk 2077 this is how Deceptious Quest Core behaves, with roughly thirty
add-ons slotting into one core. The internal archive paths share an author
namespace, which is the other signature of the same arrangement.

## Why it matters more than it sounds

The registration is **the mod's own claim about itself, made at runtime**. That
outranks every proxy a diagnosis normally leans on:

- a staging folder proves a download, not a deployment
- a deployed file proves a copy, not a load
- a load proves execution, not a satisfied dependency

A slot that reports Active has cleared all four. A slot that stays silent while
the files sit on disk is a *finding* - the add-on is installed and not running,
which is exactly the state that produces "I installed it and nothing happened".

## How to document a family like this

Describe the core **once**, then record only each add-on's slot number and what
it contributes. That keeps a thirty-mod family to one real article plus thirty
one-line entries, and it means a presence question is answered by reading a
string rather than by re-auditing a load order.

## The general form

**Look for the subsystem that already knows the answer before building a way to
work it out.** Frameworks that load plugins frequently enumerate what they
loaded - in an onscreen string, a log line, or a settings menu that lists its
own registered modules. Finding that enumeration once is worth more than any
number of file-presence checks, because it reports what actually ran.
