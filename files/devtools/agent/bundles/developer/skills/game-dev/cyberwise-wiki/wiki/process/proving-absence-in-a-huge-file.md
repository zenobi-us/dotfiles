---
type: Process
title: Prove absence in a file too large to read
description: A 4,100-line script read from the top hit a limit partway and established nothing; two targeted searches covered the whole file and settled the question conclusively - and a partial read is the worse outcome precisely because it feels like progress.
tags: [method, search, grep, verification, negatives, large-files]
status: stable
generated: { by: "claude", at: "2026-08-24T20:38:00-04:00" }
---

# Prove absence in a file too large to read

**A partial read of a large file proves nothing, and it is worse than no read,
because it feels like progress.** Stopping 2,000 lines into a 4,100-line script
leaves the same open question you started with, having spent the budget.

Two targeted searches over the same file covered **all** of it and established
the absence conclusively. The searched-for term either appears or it does not,
and the search does not run out partway.

## Search the whole file rather than reading part of it

```
search for the declaration form   -> every definition, wherever it is
search for the reference form     -> every use, wherever it is
```

That pair covers a file end to end at a fraction of the cost, and its result is a
statement about the entire file rather than about its first half.

The same technique extracts structure without reading bodies. To list every
setting a long config declares, search for the declaration line and the
annotation line that precedes it: that returns **every name and every default**
without opening a single function body. Reading the file to do the same thing
costs orders of magnitude more and is less complete, because a definition can sit
anywhere and attention does not.

## Absence is only proved for the patterns you searched

This is the discipline that makes the technique honest, and the point where it
meets [An empty result is the absence of evidence](/process/an-empty-result-is-not-a-finding).

Before concluding "this file does not do X", **enumerate the spellings X could
take in this file** and search for each:

- the name, and any abbreviation or alias of it
- the class, method or event as well as the concept
- the string as it would appear in a call, and as it would appear in a comment
- case variants, and the name split by a separator the language uses

Two searches settled the real case because two spellings were all the language
allowed. A subsystem that can be reached by five different names needs five
searches, and reporting after one is the layer-scoped negative all over again.

**And run a positive control.** Search for something you know is in the file. If
that also returns nothing, the search is misconfigured - wrong path, wrong
encoding, wrong escaping - and every other empty result from it is meaningless.

## When reading is still the right call

Searching answers "is this here". It does not answer "what does this do", and the
two get confused under time pressure.

- **Establishing presence or absence** - search, always.
- **Extracting a list of names, defaults or paths** - search, with a pattern per
  declared form.
- **Understanding control flow, or why one branch is taken** - read, but read the
  *region* the search found rather than the file. The search is how you locate
  the hundred lines worth reading.

## Related

- [An empty result is the absence of evidence, and it looks exactly like a finding](/process/an-empty-result-is-not-a-finding) - the positive control, and the layers a negative does not cover
- [A settings file the game rewrites answers "what is set", never "what is default"](/patterns/live-state-is-not-defaults) - why the defaults a search finds in a config are not the user's values
