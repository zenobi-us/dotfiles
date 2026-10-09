---
type: Process
title: A passing validator has checked structure, not truth
description: Every semantic bug in one large documentation pass - a wrong identifier, a settings claim about the wrong file, an article asserting a mod ships no payload when it ships one - passed conformance cleanly, because structure and truth are different questions and only one of them is automatable.
tags: [validation, tooling, verification, method, reports, documentation]
status: stable
generated: { by: "claude", at: "2026-08-24T20:20:00-04:00" }
---

# A passing validator has checked structure, not truth

A conformance check answers "is this the right shape". It cannot answer "is this
correct", and a green result is routinely read as though it had.

A bundle can pass every structural check while carrying:

- a **wrong identifier** that resolves to somebody else's work
- a **settings claim about the wrong data file**, describing a store the thing
  never reads
- an **article stating a mod has no payload** when it ships one

All three parse. All three carry a `type`, a valid `status` and a well-formed
timestamp. None of them is true.

In one large documentation pass, **every** semantic bug found was caught by a
manual spot-check or by a checker written for that specific question. The
conformance validator caught none of them, and was not defective - it was
answering the question it was built for.

## Say what a green result licenses

Write the boundary into the tool's own output and into anything that quotes it.
The useful phrasing is two sentences:

> Conformance: every article parses, declares a type, and stays on the right side
> of the distribution boundary. **This says nothing about whether any claim in
> them is correct.**

Keep quality reporting separate from conformance, and let it never affect the
exit code. A bundle mid-documentation is *supposed* to be full of drafts and
links to unwritten articles, so failing it for that makes the check useless
exactly when work is happening. The split - structural pass/fail, plus advisory
lint - is what keeps both answers readable.

**The lint finding worth acting on first is index drift**, where a listing has
stopped matching the files beside it. Every other quality gap is one you can see;
that one is a gap that lies about itself.

## What actually catches semantic bugs

- **A purpose-written checker for one question.** "Does every declared
  identifier resolve to the thing it claims" is a small script and it finds real
  errors. Structure validators cannot be extended into this - the checks are
  per-claim, not per-shape.
- **A spot-check with the artefact open.** Pick three articles at random and
  verify them against the file or the page they describe. Three is enough to
  find a systematic error, which is the kind worth finding.
- **Cross-checking against a second source.** The independent read is what
  catches a value that is plausible and wrong -
  [a-capacity-read-from-the-wrong-api](/process/a-capacity-read-from-the-wrong-api).

## Sort findings by whether action is required

The other way a tool misleads is by reporting everything at one level. A
pre-launch check over a modded install produces a wall of warnings unless it
splits its findings in two:

| bucket | example | what the reader should do |
|---|---|---|
| **fixed by launching** | script mods newer than the compiled bundle | nothing at all - the next launch recompiles them |
| **launching will not fix this** | an archive with no load-order entry | act, or it sorts last and silently loses every file it contests |

Reported together, those are noise and the reader learns to skim them. Reported
apart, the second list is the answer to the question they asked.

**The general rule: a finding without a required action is not a warning, it is
context.** Any report that mixes the two teaches its reader to ignore it, and a
report people ignore is worse than no report, because it still gets cited as
having been run.

The two examples are not interchangeable, either: the stale-bundle case is
covered by [A .reds file on disk is not code the game is
running](/engine/compiled-script-bundle), and the unlisted-archive case by [A
modlist entry with no archive is usually not a fault; an archive with no entry
always is](/conflicts/an-entry-and-a-file-can-disagree).

## The check that no tool will ever run for you

One class of error is invisible to every validator by construction: **an override
you placed over another author's file keeps winning after they fix the bug
themselves.** Nothing errors, nothing logs, and the symptom is old behaviour on
new code.

The only defence is a register: record the hash of their file as it was when you
patched it, and re-check after every update, reporting *changed*, *gone*, or *no
longer overriding*. That is the single failure mode that makes overriding a whole
file risky at all, and it is entirely closed by writing the hash down. The full
treatment, including when to override versus patch, is [Fixing a bug in someone
else's mod](/install/overriding-another-authors-mod).

## Related

- [Documenting a large mod list without producing a report nobody can trust](/process/running-a-documentation-pass) - verifying derived identifiers, and why coverage claims must match reality
- [An empty result is the absence of evidence, and it looks exactly like a finding](/process/an-empty-result-is-not-a-finding) - a tool's own filter manufacturing findings
