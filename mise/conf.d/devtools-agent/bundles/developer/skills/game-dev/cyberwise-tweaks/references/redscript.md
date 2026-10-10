# Redscript authoring - where the knowledge now lives

> **Verified:** Cyberpunk 2077 patch 2.31 - August 2026
> **Re-check after a patch:** Signatures and script paths move between versions. Re-read the shipped script dump rather than trusting a remembered signature.

Writing `.reds` that changes world state, rather than authoring records
(`tweakdb-and-text.md`) or running console commands (`cet-lua.md`).

**The full account is in the base wiki** (`wiki/` in the Cyberwise repo):

| article | covers |
|---|---|
| `/authoring/reading-the-shipped-script-dump` | the vanilla dump at `<game>\tools\redmod\scripts\` as the authoritative signature reference, the nine `ActionQuestForce*` verbs nobody copies, why a class declared by another **mod** cannot be hooked at all (three ways tested, and the commented-out precedent that looks like one), and what `scc` exit 0 does and does not establish |
| `/authoring/addressing-a-world-object-from-redscript` | `EntityID.GetHash()` being a Uint32 that will eventually match the wrong thing, the PersistentID pattern that works, verb order whose failure looks like success, and undoing only your own change |
| `/authoring/detecting-a-player-action-from-an-interaction` | inferring "the player slept" from a choice hub, and the three silent ways that detection stops being true |
| `/engine/compiled-script-bundle` | a `.reds` on disk is not code the game is running |

What stays here is only what changes what you **do**.

## Establish who owns the class before designing anything

`@wrapMethod` / `@replaceMethod` work against **game** classes and fail to
compile against a class another **mod** declares. Check that first, and if it is
a mod's class, say so in the first reply - the clean hook is not on the table,
and the real options are an override or a re-appliable patch
(`/install/overriding-another-authors-mod`).

Where the thing to change is a **record** rather than behaviour, none of this
applies: use TweakXL, which overrides per record
(`/authoring/tweakxl-records-are-last-wins`).

## Copy a pattern that already runs here

If something in the load order already manipulates the thing you are about to
manipulate, its approach is proven against this game version in this
environment. That beats a tidier design you invented and have never seen run.

## Measure the identifiers, do not guess them

Class, entity ID, persistent-state class and component name are all readable in
the running game with a CET probe (`cet-lua.md`). An entity ID invented from a
plausible name addresses nothing, and the failure is silent.

## Say which of "compiles" and "works" you established

Compile-test against the **real load order** - the recipe is in the `cyberwise`
skill's `environment.md`. Then report accurately: `scc` exit 0 means it
compiles. It does not mean the hook fires or the effect is the one intended, and
those two claims get handed over in the same sentence far too often.
