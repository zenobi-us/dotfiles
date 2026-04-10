---
name: klein9b-prompting
description: Use when prompting FLUX.2 [klein] 9B for image generation or editing, when keyword lists, vague lighting, or unclear reference-image roles are producing weak results, resulting in scene-first prompts with explicit visual priorities.
---

# klein9b-prompting

## Overview
FLUX.2 [klein] 9B responds best to scene-first prose, not keyword soup. It does not upsample prompts, so the wording you give it is the wording it gets.

Reference guide: `references/flux2-klein-prompting-guide.md`.

## Quick Reference

| Task | Prompt shape |
|---|---|
| Text-to-image | Subject → setting → details → lighting → atmosphere |
| Lighting control | Name source, quality, direction, temperature, and surface interaction |
| Style control | Add a short style or mood tag at the end |
| Single-image edit | State the transformation, not a generic improvement |
| Multi-reference edit | Assign roles: image 1 = identity, image 2 = style or environment |

## Prompt Rules
- Write as flowing prose.
- Put the main subject first.
- Make lighting explicit; “good lighting” is too vague.
- Keep every sentence visually useful.
- Use style or mood tags only when they help consistency.
- For edits, describe the target change clearly and let the input image provide the base.

## Good Prompt Shape
```text
An elderly fisherman in a salt-stained wool sweater stands at the bow of a small wooden boat, calm water around him, morning mist on the horizon. Soft, diffused dawn light comes from camera-left, catching on wet rope and the boat’s chipped paint. Quiet, cinematic, photoreal.
```

## Editing Patterns
- **Style transfer:** “Turn this portrait into a moody winter editorial.”
- **Object swap:** “Replace the bicycle with a black horse.”
- **Environmental change:** “Change the scene to winter with falling snow.”
- **Multi-reference:** “Keep image 1’s person and pose; use image 2 for neon city mood and reflective lighting.”

## Common Mistakes
- Keyword lists instead of prose
- Buried subject or buried action
- Vague lighting like “nice light”
- “Make it better” / “fix the image” style edits
- Mixing up what each reference image should control
- Stuffing prompts with filler like “ultra-detailed” when it adds no visual meaning
