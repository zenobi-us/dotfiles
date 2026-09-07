---
type: Environment
title: The ReShade add-on build is identified by being UNSIGNED, not by its filename
description: Why a .addon64 file makes the standard ReShade build the wrong one, the Authenticode test that tells the two apart, and the sourcing traps that make a shader look missing when it is not.
tags: [reshade, addons, dll, signatures, shaders]
status: stable
tracks: ReShade releases, not Cyberpunk 2077 patches
generated: { by: "claude", at: "2026-08-24T21:40:00-04:00" }
---

# The ReShade add-on build is identified by being UNSIGNED, not by its filename

ReShade ships in two builds under **the same DLL filename**, and the difference
decides whether half a virtual-photography stack works at all.

> **The add-on build is UNSIGNED. The signed one is the restricted build that
> refuses to load add-ons.**

```powershell
Get-AuthenticodeSignature "$GameRoot\bin\x64\dxgi.dll" | Select-Object Status
# NotSigned  -> the add-on build. This is the one you want.
# Valid      -> the standard build. Add-ons will be ignored.
```

The DLL is usually `dxgi.dll`, but ReShade can be installed under another API
name - `d3d11.dll` is the other common one. Check whichever one is present;
there is no guarantee about the name.

**Version strings and filenames do not distinguish the builds.** The signature is
the reliable test, and it is a one-liner.

## The trigger is a file extension, not a mod name

**If there is a `.addon64` anywhere in the ReShade folder, the standard build
will ignore it** and the feature will simply never appear - no error, no log
line, nothing in the ReShade overlay saying a file was skipped.

Camera and connector add-ons are the common cases, and several of Marty's tools
ship one, but do not learn the rule as a list of mods. Learn it as: **`.addon64`
present, add-on build required.**

## ReShade is not a mod, and no manager knows about it

Whatever the install layout, ReShade's DLL and its `reshade-shaders\` tree live
in `bin\x64` beside the game executable. It is an injector installed outside any
mod manager, so:

- it will never appear in a mod list
- a manager purge will not remove it
- a deployment manifest will not account for its files

That is why "ReShade is not installed" is a claim that has to be made by looking
at `bin\x64`, never by looking at a mod list.

## Sourcing traps that make a shader look missing

- **A shader can ship with an add-on rather than with a shader pack.**
  `IgcsDof.fx` is the example that catches people: it is in the IgcsConnector
  *release zip* - not in OtisFX, and not in the IgcsConnector source repo. Before
  concluding a pack is broken because a `.fx` is absent, check the release
  archive of whatever add-on needs it.
- **The ReShade installer's package index lags GitHub.** It has shipped a stale
  list that both omitted current shaders and still offered ones that had been
  dropped. Pull packs from the author's GitHub directly rather than trusting the
  installer's list.
- **A paid or "ultimate" edition of a pack is usually a superset of its free
  edition, not a companion to it.** iMMERSE is the common case. Install one or
  the other, never both - installing both gives you the header collision in
  [stacked shader packs](/formats/stacked-shader-packs) with extra steps.

## One observed incompatibility, and the shape worth remembering

**ReshadeEffectShaderToggler (REST) v1.3.23 against ReShade 6.8**: the game
reaches rendering normally, then dies roughly 50 seconds in, **with no error in
any log**.

That is one observed version pair and not a permanent verdict on REST. The
*shape* is the durable part: a REST/ReShade version mismatch is worth suspecting
whenever a modded install dies shortly after gameplay starts and every game-side
log is clean. REST only provides HUD and menu masking, so pulling it is a cheap
test that rarely breaks anything else.

## Scope

This is about **stacks** - ReShade plus add-ons plus several shader packs. A
plain ReShade install with one shader pack hits almost none of it, so establish
what is actually installed before applying any of it.

None of this is bound to a Cyberpunk 2077 patch; it tracks ReShade and add-on
release cycles instead.

## Related

- [Stacked shader packs collide on their shared headers](/formats/stacked-shader-packs)
- [Two downloads from one mod page may not be alternatives](/install/two-builds-of-one-filename)
