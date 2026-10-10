---
name: cyberwise-reshade
description: ReShade on Cyberpunk 2077 - why some mods need the add-on build rather than the standard one, and how shader packs collide when several are stacked. Use when ReShade effects fail to load, when shaders error on compile, or when combining multiple shader packs.
---

# Cyberwise: ReShade

> **Verified:** Cyberpunk 2077 patch 2.31 - August 2026
> **Re-check after a patch:** Re-check ReShade and shader-pack versions rather than the game version; these break on their own release cycle.

Load `cyberwise` alongside this for the method rules.

**Scope:** this is about *stacks*. A plain ReShade install with one shader pack
hits almost none of it.

Two rules that decide most of it:

- **The trigger for needing the add-on build is a file extension, not a name.**
  If there is a `.addon64` in the ReShade folder, the standard build ignores it.
- **ReShade is an injector installed outside any mod manager**, so it will not
  appear in a mod list and a manager purge will not remove it.

`references/reshade.md` is the order of checks - what to look at first, and the
one-line signature test that settles which build is installed.

**How ReShade works is in the base wiki** (`cyberwise-wiki`), because a mechanism
is knowledge rather than instruction:

| article | covers |
|---|---|
| `/formats/reshade-addon-build` | add-on vs standard build, the `.addon64` trigger, the Authenticode test, sourcing traps, the REST/ReShade incompatibility |
| `/formats/stacked-shader-packs` | duplicate shared headers, recursive `EffectSearchPaths`, the folder layout that fixes it, prepass ordering, which DOF effects ignore the depth buffer |

## Reference material

| file | covers |
|---|---|
| `references/reshade.md` | the order of checks, and pointers to the format articles |
