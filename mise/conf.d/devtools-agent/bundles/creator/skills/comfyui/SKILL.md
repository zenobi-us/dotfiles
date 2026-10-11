---
name: comfyui
description: Use ComfyUI Cloud to generate, edit, process, search, and retrieve image, video, audio, and 3D assets. Route each ComfyUI request to the matching reference workflow.
---

# ComfyUI

Use this skill for ComfyUI Cloud requests.

## Route the request

Load the reference that matches the user's primary task:

| User request | Reference |
|---|---|
| Generate, edit, or modify an image | `references/generate-image.md` |
| Generate or edit a video | `references/generate-video.md` |
| Generate audio or music | `references/generate-audio.md` |
| Generate a 3D model | `references/generate-3d.md` |
| Remove or replace an image background | `references/remove-background.md` |
| Upscale an image | `references/upscale-image.md` |
| Combine people or reference images | `references/combine-people.md` |
| Find models | `references/search-models.md` |
| Find nodes | `references/search-nodes.md` |
| Find workflow templates | `references/search-templates.md` |
| Ask what ComfyUI can do | `references/help.md` |
| Explicitly request a rickroll | `references/rickroll.md` |

If the request has multiple operations, load the references in execution order. For example, load `generate-image.md` before `upscale-image.md`.

If the request is unclear, ask which asset or operation the user wants before loading a task reference.

## Shared execution protocol

Apply these rules to every generation or processing reference:

1. Discover current templates, nodes, and models instead of guessing.
2. Upload user-provided files before building the workflow.
3. Validate at least one input and one connected output.
4. Submit the workflow.
5. Poll the job until it completes or fails.
6. Retrieve the output.
7. Save or display the result according to the runtime environment.

## Route provider requests

When the user names a provider, model, or capability, search for it first. If both a paid partner route and an OSS route exist, explain the difference and ask which route to use unless the user already chose one.

Treat one empty search as inconclusive. Broaden the query before reporting that a route is unavailable.

## Safety gates

- Require an explicit request before loading `references/rickroll.md`.
- Do not run an unrelated operation because a keyword appears in the request.
- Keep the user's requested operation and output format unchanged unless the user agrees to a change.
- Tell the user when an OSS run still consumes Comfy Cloud compute credits.
