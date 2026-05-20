# Prompting Guides Index

Use this index to pick the right prompt guide by model family and task.

| Model / Family | Primary use-case | Guide link | Last-updated |
|---|---|---|---|
| General (cross-family) | Reusable prompt fundamentals that apply to most models | [general-prompting-guide.md](general-prompting-guide.md) | 2026-04-12 |
| LTX 2.3 | Video generation (I2V/T2V), camera/motion/audio-aware prompting | [ltx-2-3-prompting-guide.md](ltx-2-3-prompting-guide.md) | 2026-04-12 |
| FLUX 2 | Image generation and image edit prompting patterns | [flux-2-prompting-guide.md](flux-2-prompting-guide.md) | 2026-04-12 |
| WAN 2.2 | Video prompting with temporal sequencing and motion control | [wan-2-2-prompting-guide.md](wan-2-2-prompting-guide.md) | 2026-04-12 |

## Quick selection

- If the user specifies a model family, use that family guide first.
- If model family is unknown, start with the general guide and confirm family from `/object_info`.
- For video tasks, prefer LTX/WAN guides over general guidance once family is known.
