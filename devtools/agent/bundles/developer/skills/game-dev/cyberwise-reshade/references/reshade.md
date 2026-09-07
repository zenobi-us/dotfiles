# ReShade and virtual photography stacks

> **Verified:** Cyberpunk 2077 patch 2.31 - August 2026
> **Re-check after a patch:** Not bound to the game patch - this tracks ReShade and add-on releases instead. Re-check the add-on build signature test and the REST incompatibility against current versions.

**How ReShade works is documented in the base wiki, not here.** This file keeps
the order of checks; the mechanisms, the signature test, the include-resolution
rules and the known version pairs live in `cyberwise-wiki`'s bundle:

| what you need | where |
|---|---|
| add-on build vs standard build, the `.addon64` trigger, sourcing traps, the REST/ReShade incompatibility | `/formats/reshade-addon-build` |
| shader packs colliding on shared headers, `EffectSearchPaths` recursion, folder layout, prepass ordering | `/formats/stacked-shader-packs` |

## Establish the stack before applying any of it

**This is about stacks** - ReShade plus add-ons plus several shader packs, the
kind of setup virtual photographers build. A plain ReShade install with one
shader pack hits almost none of it. Ask what is actually installed first.

ReShade's DLL and its `reshade-shaders\` tree live in `bin\x64` beside the game
executable, whatever the install layout. It is an injector installed **outside
any mod manager**, so it never appears in a mod list and a manager purge never
removes it. "ReShade is not installed" is a claim that has to be made by looking
at `bin\x64`.

## Order of checks

**1. Is there a `.addon64` in the ReShade folder?** If so the add-on build is
mandatory. Confirm which build is installed by signature, not by filename:

```powershell
Get-AuthenticodeSignature "$GameRoot\bin\x64\dxgi.dll" | Select-Object Status
# NotSigned = the add-on build (correct). Valid = the restricted build.
```

The DLL may be installed under another API name - `d3d11.dll` is the other
common one. Full reasoning: `/formats/reshade-addon-build`.

**2. Shader compile errors that move around between launches are a folder
layout problem, not a shader bug.** One folder per pack, each pack's shared
headers inside it. `/formats/stacked-shader-packs`.

**3. A missing `.fx` is often in an add-on's release zip rather than in a shader
pack.** Check there before reporting a pack broken.
`/formats/reshade-addon-build`.

**4. If a modded install dies roughly a minute into gameplay with every
game-side log clean, suspect a REST/ReShade version mismatch.** REST only does
HUD and menu masking, so pulling it is a cheap test.
`/formats/reshade-addon-build`.
