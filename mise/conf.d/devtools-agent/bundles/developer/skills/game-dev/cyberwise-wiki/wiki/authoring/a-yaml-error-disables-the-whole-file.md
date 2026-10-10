---
type: Engine Mechanic
title: One indentation error disables every record in a TweakXL file
description: yaml-cpp parses the document, not the record, so a single line indented three spaces where two were meant makes TweakXL reject the entire file - and the symptom is a mod that is installed, enabled, and does nothing at all.
tags: [tweakxl, yaml, authoring, silent-failure, diagnosis]
status: stable
generated: { by: "claude", at: "2026-08-24T21:15:00-04:00" }
---

# One indentation error disables every record in a TweakXL file

TweakXL *resolves* per record - [last-wins, one record at a
time](/authoring/tweakxl-records-are-last-wins). It **parses** per file. Those
are different granularities, and the gap between them is where a whole mod
disappears.

The parser is `yaml-cpp`, and YAML is a document format: a malformed line is not
a bad record, it is a bad *document*. The parse fails, and every record in that
file - the ninety that were fine as well as the one that was not - is never
applied.

## The error string

It lands in `red4ext\plugins\TweakXL\TweakXL-<date>.log`:

```
error at line N, column M: illegal map value
```

`illegal map value` is what a wrong indent looks like from inside the parser: at
that column, YAML expected a mapping and found something that cannot be one. The
line and column are accurate and are the fastest way in.

## Why it happens so easily

**Three spaces where two were meant.** Nothing about the file looks wrong. The
key is spelled correctly, the value is the right type, the surrounding records
are untouched, and a human eye reading for *content* will pass over it
repeatedly. YAML is one of the few formats where invisible whitespace is load-
bearing, and a hand-edit - especially a hand-edit made to somebody else's file,
or one assembled by pasting a block from elsewhere - is exactly where the
mismatch enters.

## The symptom is nothing at all

This is what makes it expensive. The mod:

- appears in the manager as installed and enabled
- deploys its files, which are all present on disk
- produces no in-game error, no notification, no missing-record complaint
- simply has no effect

Every hypothesis that gets tried first - load order, a conflict, a missing
requirement, a wrong record ID, the wrong game version - is a hypothesis about
something *other* than the file being unreadable. All of them come back clean,
because all of them are true. The file just never parsed.

## Check the log before anything else

For any tweak that "does nothing", the log is the first read, not the last:

1. Open `red4ext\plugins\TweakXL\TweakXL-<date>.log` from the most recent run.
2. Find the line naming your `.yaml`. If it is not there at all, the file is not
   where TweakXL looks - check it is under `r6\tweaks\` and actually deployed.
3. If it is there, look at what sits immediately beneath it. An `error at line
   N` line under your filename is the answer, and nothing else needs
   investigating.

A file that appears in the log with nothing beneath it parsed and applied; the
problem is then elsewhere, and the log has earned the next hypothesis rather
than repeating this one.

## Consequence for how you split files

The blast radius of a syntax error is one **file**, so file size is a bet. A
single `.yaml` holding forty unrelated records means one bad indent takes all
forty out. Splitting by concern costs nothing at load time and contains the
damage - and it makes the log line name the area that broke.

## Related

- [A TweakXL record is resolved last-wins, and that is the lever for everything else](/authoring/tweakxl-records-are-last-wins)
- [Never guess a TweakDB record ID - the game writes the real list](/authoring/finding-the-real-record-id) - the other way a tweak loads clean and does nothing
