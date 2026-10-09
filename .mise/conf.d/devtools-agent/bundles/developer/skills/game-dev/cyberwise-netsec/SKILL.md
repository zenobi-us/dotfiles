---
name: cyberwise-netsec
description: Turn NetSec's diagnostic log into places you can stand - parse the GAP lines it writes for networks with no way in, cluster them into candidate access-point sites, and write them as CETMonkey teleport waypoints. Use when asked where NetSec found holes in the world, to plan where to place access points, or to generate teleport waypoints from a NetSec log.
---

# Cyberwise: NetSec coverage gaps

> **Verified:** Cyberpunk 2077 patch 2.31 - August 2026
> **Re-check after a patch:** the log format is NetSec's own, so it drifts with
> NetSec rather than with the game. Re-read `Devices.reds` / `People.reds` if the
> parse comes back empty against a log you can see GAP lines in.

Load `cyberwise` alongside this for the method rules.

**This skill is invoked on request. Do not run it proactively.**

## What a GAP is, and why it only exists in a log

NetSec gates a device or a person behind breaching their network's access point.
Where a network has **no access point at all**, there is nothing to breach, so
NetSec leaves the target open rather than making it permanently unhackable -
"a device that exists only to refuse you is a bug, not a difficulty setting".

That decision is invisible in play. Nothing happens; the thing just works. So
the only trace is a line in the log:

```
[NetSec] GAP device no-access-point at=-1156.625732,1300.835083,76.677292
[NetSec] GAP people no-network      at=-1148.201172,1571.900024,73.400002
```

Those coordinates are the holes in the world - the places that *should* have an
access point and do not. This skill turns them into somewhere you can teleport.

**It requires NetSec's `Diagnostics -> Log decisions to the game log` to be on.**
With it off there are no GAP lines and the tool correctly reports nothing.

## Generate the waypoints

```powershell
skills\cyberwise-netsec\tools\New-GapWaypoints.ps1              # report only
skills\cyberwise-netsec\tools\New-GapWaypoints.ps1 -Write       # merge into CETMonkey
```

It reads `scripting.log` **and its rotations** - `scripting.1.log` and friends -
because the interesting sessions are frequently not the current one. Then it
clusters, because raw GAP lines are enormously repetitive: one evening produced
**1,534 lines that resolved to 68 sites**. A single unlocked terminal logs every
time the player looks at it.

| switch | default | |
|---|---|---|
| `-ClusterRadius` | 25 | metres. Two hits closer than this are the same place. Sector-scale on purpose - the answer is "an access point belongs around here", not "at this doorway" |
| `-MinHits` | 2 | drop singletons; one open device is usually somebody's toaster |
| `-Prefix` | `NETSEC-GAP` | what to type in CETMonkey's filter box |
| `-Write` | off | without it, nothing is written |

Output is ordered by hit count, so the top of the list is the largest cluster of
ungated things - which is the best argument for an access point, not proof of
one. **Whether a spot deserves one is a judgement about the scene**, and the tool
does not pretend to make it.

## Why CETMonkey and not AMM

CETMonkey reads exactly one file - `mods\cetmonkey\locations.lua` - and that is
the list its Teleport panel filters (`init.lua:248`). Its own **Record here**
button writes an *AMM-format* `.json` into the CETMonkey folder for you to move
by hand, so producing AMM files would add a manual step to something generated.

`locations.lua` carries a header saying it is generated from AMM's
`User\Locations` and should not be hand-edited. The tool respects that: rows that
did not come from it are parsed, kept, and written back untouched, and only rows
whose name starts with the prefix are replaced. So it is **idempotent**, and
regenerating from AMM costs nothing but a re-run.

After writing: **Reload all mods** in CET, then filter the Teleport list for
`NETSEC-GAP`.

## Traps

**`-like` treats `[NetSec]` as a character class.** The first version of this
tool used `-notlike '*[NetSec] GAP*'` as a cheap pre-filter and reported **zero
hits against a log holding 1,534 of them** - because in a wildcard pattern
`[...]` means "any one of these characters". Use `.Contains()` for a literal.
This is the single easiest way to write a PowerShell log parser that silently
finds nothing.

**An empty result is not evidence the world is fine.** Check the setting is on,
and check the log actually contains `[NetSec] GAP` before concluding anything -
the front-door rule about proving a command ran applies exactly here.

**The waypoint is where the GAP was logged, not where the access point goes.**
It is the position of the *ungated thing*. An access point wants to be somewhere
a person could plausibly reach and jack into - which is why the output is a place
to stand and look around, not a placement.

## The other lines NetSec logs

Not parsed by this tool, but worth knowing when reading a log by hand:

| line | means |
|---|---|
| `GAP device no-access-point` | on a network, but the network has no access point anywhere |
| `GAP people no-network` | not wired to any network at all |
| `LOCKED device reason=UNBREACHED` | the mechanic working - this is not a gap |
| `LOCKED device reason=INTELLIGENCE` | breached, but INT too low - also not a gap |
| `STRANDED granted jack-in port` | had an access point on paper that could not be resolved in the world, so NetSec gave it a port |
| `TIERED board - N of M ring daemon(s) offered` | which rings the network was judged to have |
| `ALARM - ...` | who answered a failed breach |

`STRANDED` lines are the interesting neighbours of `GAP`: those networks have an
entrance in the data that does not exist in the world. If someone asks for
placement candidates and the GAP list is thin, those are the next thing to read.

## Related

- The mod: `~/repos/cp2077-netsec`
- `cyberwise-tweaks` for authoring the TweakXL records and redscript behind it
- `cyberwise-conflicts` if a device is gated and should not be
