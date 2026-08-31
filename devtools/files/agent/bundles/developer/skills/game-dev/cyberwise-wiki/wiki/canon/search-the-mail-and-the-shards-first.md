---
type: Process
title: Before calling something non-canonical, search the mail and the shards - they are primary text and they have settled disputes
description: A name or a programme absent from the main narrative is not absent from the game. In-game email and shards are citable, on-screen sources, and "I have never seen it" is a claim about the layer you searched rather than about canon.
tags: [canon, sources, shards, email, method, negative-claims]
status: stable
generated: { by: "claude", at: "2026-08-25T00:16:00-04:00" }
---

# Before calling something non-canonical, search the mail and the shards

The positive case is already covered:
[where lifepath canon actually lives](/canon/where-lifepath-canon-lives) lists
shards and V's own correspondence among the four primary sources, and
[trace the footnote](/canon/trace-the-footnote-before-repeating-the-wiki) sorts a
claim into documented, derived or authorial.

This article is about the **negative** claim, which is a different and more
dangerous move: saying that a name, a project, an organisation or a programme is
*not* canon.

## Why the negative is the risky direction

"X is canon" invites a request for the source, and the conversation self-corrects.
"X is not canon" sounds like the careful, sceptical answer - the one that protects
the player from invented lore - and it invites nothing. It closes the question.

But it is a claim about the whole corpus, and the corpus is large. This game has
**hundreds of readable shards and a substantial volume of in-game email**, written
by the studio, appearing on screen, and therefore documented by every definition
this area uses. A great deal of specific naming - corporate programmes, internal
projects, minor personnel, hardware - exists **only** there and nowhere in the
spoken narrative.

So "I have never encountered that in the game" is almost always true, and almost
never evidence. It is the canon-shaped version of the standing rule that
[a negative is only as wide as the layer you searched](/process/an-empty-result-is-not-a-finding).

## The rule

> **Shards and in-game email are citable primary text, of the same authority as a
> spoken line. Search that corpus before declaring anything non-canonical - and if
> you have not searched it, say "not that I can source" rather than "not canon".**

This has settled real disputes in both directions. A name dismissed as community
invention turned out to be on a shard; and lore-only naming is a documented,
legitimate category in this game - see
[a weapon can exist only in a shard](/canon/a-weapon-can-exist-only-in-a-shard),
where the shard names a rifle that no loot table contains. The shard is still
canon. The item is still absent. Both at once.

## How to actually search it

The text is extractable rather than only readable in game - one per-locale JSON,
pulled from that language's archive, containing every string the player can see
except spoken dialogue. The procedure is in
[finding a piece of text the player saw in game](/authoring/finding-in-game-text).

That turns "have I ever seen this" into a grep, which takes a minute and replaces
a memory-based negative with a real one. When the grep comes back empty, **that**
is a defensible "no in-game source" - and it should be reported as exactly that
phrase, because it is still a statement about one corpus and not about the
franchise.

## What it does not license

Finding a name on a shard establishes that the name exists. It does not establish
anything else attached to it - the programme's purpose, its history, who ran it. The
shard says what the shard says. Everything past that is
[derived, and must be labelled derived](/canon/trace-the-footnote-before-repeating-the-wiki).

## Scope

Method. No patch dependency, though the shard and mail corpus grows with content
releases - Phantom Liberty added a substantial amount of it, and a search run
against a base-game text dump is a search of the wrong corpus.
