---
type: Engine Mechanic
title: Two mods can rewrite the same quest node, and no conflict scan sees it
description: An ArchiveXL sidecar can intercept a socket on an existing quest node - a rewrite of the vanilla quest graph in place, not a file override. Two mods intercepting the same socket both load, neither errors, and which one shapes the graph depends on load order, which is why a bug like this reproduces for some people and not for its own author.
tags: [archivexl, xl, quest, questphase, intercept, load-order, conflicts, new-game]
status: draft
generated: { by: "claude", at: "2026-08-25T11:20:00-04:00" }
---

# Two mods can rewrite the same quest node, and no conflict scan sees it

An `.xl` sidecar beside an `.archive` can declare quest operations, and the
sharpest of them is an **interception**: an entry naming an existing phase, a
parent, a node, and a socket on that node, with `intercept: true`. The vanilla
graph is not overridden as a file - it is **rewritten in place**, so that the
edge leaving that socket now goes somewhere the mod chose.

```yaml
quest:
  phases:
    - path: mod\<name>\quest\<name>.questphase
      parent: base\quest\main_quests\prologue\q000\q000.questphase
      # ... an operation naming a node and socket, intercept: true
```

That is a powerful and legitimate mechanism. It is also **the only mod conflict
in this game that no scanner reports**, for two independent reasons:

- An archive conflict scan compares hashes **inside** `.archive` files. These
  declarations are in the sidecar, which is not an archive and carries no
  hashes.
- A mod manager warns when two mods deploy the **same path**. The two `.xl`
  files have different filenames, so there is no deployment conflict to see.

Both tools report a clean install, correctly, while two mods quietly disagree
about what the quest graph is.

## Why the result depends on load order

When two `.xl` files declare an interception on the **identical phase, parent,
node and socket**, both are applied, and the graph that survives is the one the
later application produced. Which is later is decided by load order.

Sidecar filenames sort by ASCII, which is why authors prefix them - `!` is 0x21
and `#` is 0x23, so a `!`-prefixed file precedes a `##`-prefixed one - but a
manager's own ordering can override that.

**This is the machinery behind a report an author cannot reproduce.** The same
two mods, the same versions, a different order, a different graph. When a mod
page carries an unanswered *"could it be a load order issue?"* against a
prologue or story bug, this is the shape to check first.

Whether the framework deduplicates two byte-identical interceptions was never
established here. Treat two declarations on one socket as *undefined*, not as
harmless.

## The packaging bug that creates it

The common cause is not two unrelated mods. It is **a mod that re-declares all
of its own dependency's interceptions**. One prologue mod requires another and
then declares the same four interceptions itself - same phase, same parent, same
node, same socket, both `intercept: true`. Installed as instructed, with the
dependency present, every one of those sockets is claimed twice.

The tell is cheap: read both `.xl` files and compare the four fields. Nothing
else has to be launched.

## The blast radius is decided by which phase is intercepted

The prologue phase `base\quest\main_quests\prologue\q000\q000.questphase`
executes **only on the new-game path**. Anything intercepting it can therefore
break only new games and can never touch a save load - which is a scoping fact
worth reaching for the moment a symptom splits along that line.

In one worked case the intercepted socket sat *after* character creation, which
is exactly why the creator completed successfully in every failing run and the
hang landed on the transition out of it.

## Weight is countable, and worth counting

Both these numbers come from parsing sidecars, not from launching anything:

- how many quest **parents** the file names
- how many operations carry `intercept: true`

In one large order the mods declaring quest interceptions ran from 4 to 8
operations each, with a single outlier at **33 parents and 30 interceptions**
across six fixer phases. That outlier was the cause of a new-game livelock that
had survived eight rounds of theory - and **its `.archive` was already disabled;
the 4 KB sidecar alone reproduced the hang**.

So when a new game hangs and a save loads clean, sort the `.xl` layer by
interception count and start at the top. It is a ranking, not a diagnosis, and
it costs one pass over some text files.

## What was not verified

The load-order dependence is derived from the declarations plus a report the
author could not reproduce, not from a controlled A/B with the order reversed.
The interception counts and the sidecar-alone reproduction were measured. If you
get the chance to swap the order of two mods that intercept one socket and watch
the graph change, that test is worth writing down.

## Related

- [Sizing a bisect to the list](/diagnosis/sizing-a-bisect-to-the-list) - why the `.xl` layer earns early suspicion for anything that is new-game only
- [ArchiveXL resource patching runs on the new-game path](/engine/archivexl-resource-patching) - the other half of what a sidecar does, with the same new-game asymmetry
- [A mod adds journal entries, phone messages and quests by declaring resources in its .xl](/authoring/mod-declared-journal-and-quest-resources) - what else is in that file
- [A scripted sequence is on rails](/gameplay/a-scripted-sequence-is-on-rails) - the vanilla behaviour of the stretch these mods edit
