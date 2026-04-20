# FLUX 2 Prompting Guide

> Source basis: public FLUX-family prompting practice and model-card style guidance (offline summary).

Use this guide for FLUX 2 image generation and image editing workflows.

---

## Core Principles

1. **Write direct, literal prompts**
   - FLUX 2 follows explicit instructions well.
   - Prefer concrete scene descriptions over abstract style labels.

2. **Front-load the subject and intent**
   - Start with what must appear.
   - Then add composition, lighting, materials, and mood.

3. **Use layered specificity**
   - Subject -> environment -> camera/frame -> lighting -> style/finish.
   - Add details gradually if output drifts.

4. **Keep prompts coherent**
   - Avoid conflicting instructions (e.g., "night sunlight", "minimal but crowded").
   - Choose one dominant visual goal per image.

5. **Prefer positive direction over heavy negatives**
   - Tell the model what to do first.
   - Use concise negatives only for persistent artifacts.

---

## Prompt Structure That Works

Recommended order:

```text
Subject + action/state -> scene context -> composition -> lighting -> style
```

Example skeleton:

```text
[A clear subject and action], in [location/context], framed as [shot/composition],
with [lighting/color cues], rendered in [style/material detail].
```

---

## Practical Prompting Patterns

### Product / Commercial

- Specify product material, camera distance, background cleanliness, and lighting quality.
- Use terms like: "clean studio backdrop", "softbox reflections", "high-detail label texture".

### Portrait / Character

- Include age range, expression, pose, wardrobe texture, and background depth.
- Add lens/framing cues for consistency: "waist-up", "shallow depth of field", "eye-level".

### Environment / Concept Art

- Define foreground/midground/background elements.
- Control atmosphere with weather, haze, and color temperature cues.

### Editing / Transformation (img2img-style)

- Describe what should change and what must remain unchanged.
- Example: "keep facial structure and pose, replace outfit with matte black tactical jacket, preserve natural skin texture".

---

## Do / Don't

| Do | Don't |
|---|---|
| Use concrete nouns and verbs | Rely only on vague adjectives |
| Add composition cues (close-up, wide shot, centered) | Leave framing to chance for critical outputs |
| Specify textures and materials | Assume style words imply material detail |
| Keep negatives short and targeted | Stack long contradictory negative lists |

---

## Example Prompts

### Cinematic Portrait

```text
A 35-year-old woman standing under a neon storefront awning at night, medium close-up,
rain droplets visible on her leather jacket, shallow depth of field, soft magenta and cyan rim lighting,
subtle film grain, realistic skin texture, cinematic urban mood.
```

### Product Hero

```text
Premium black smartwatch on a brushed aluminum surface, angled three-quarter view,
clean gradient studio background, softbox highlights on the glass, crisp engraved edge detail,
luxury tech advertisement style, high realism.
```

### Controlled Edit Instruction

```text
Preserve the original room layout and furniture placement, replace daytime lighting with warm sunset light
through the window, add soft shadow direction on the floor, keep image natural and photorealistic,
no stylized illustration look.
```

---

## Quick Troubleshooting

- **Output is generic** -> Add specific subject attributes, materials, and shot type.
- **Composition is off** -> Explicitly specify framing and camera angle.
- **Style is too strong/weak** -> Reduce or strengthen style phrases; keep one main style direction.
- **Edit changed too much** -> Add stronger "preserve" constraints for identity/layout.
