# WAN 2.2 Prompting Guide

> Source basis: public WAN-family video prompting patterns and model-card style guidance (offline summary).

Use this guide for WAN 2.2 video generation workflows (especially I2V/T2V variants).

---

## Core Principles

1. **Describe motion explicitly**
   - WAN outputs improve when movement is named clearly.
   - State who moves, what moves, and how fast.

2. **Keep one primary scene event**
   - Competing actions reduce temporal consistency.
   - Focus each clip on one clear beat.

3. **Define camera behavior directly**
   - Include movement terms like: static, slow push-in, dolly left, handheld tracking.
   - Camera direction improves consistency frame-to-frame.

4. **Anchor continuity cues**
   - Re-state key identity and environment features.
   - Helps reduce subject drift across frames.

5. **Use temporal language**
   - Include progression terms: "starts", "then", "gradually", "by the end".
   - Encourages coherent beginning/middle/end behavior.

---

## Prompt Structure That Works

Recommended order:

```text
Subject -> setting -> action/motion -> camera -> mood/lighting -> temporal progression
```

Example skeleton:

```text
[A subject] in [environment] [performs motion], camera [movement/framing],
with [lighting/mood], action evolves as [timeline cue].
```

---

## Practical Prompting Patterns

### Character Motion

- Define body movement in plain verbs: walking, turning, lifting, looking, sitting.
- Add hand/face action if expression matters.

### Environment Motion

- Include independent moving elements: fog drift, leaves swaying, traffic passing.
- Use moderate complexity to avoid motion chaos.

### I2V Stability

- Preserve anchor traits from source image: clothing colors, hair shape, object placement.
- Add minimal but clear motion instructions first, then iterate.

### T2V Scene Build

- Establish scene before action.
- Keep subject count and interaction complexity manageable.

---

## Do / Don't

| Do | Don't |
|---|---|
| Use concrete motion verbs | Use vague motion phrases ("be dynamic") |
| Specify camera movement | Omit camera behavior for precision clips |
| Keep one dominant action | Overload with many simultaneous events |
| Add temporal sequence words | Describe only a static frame |

---

## Example Prompts

### I2V Portrait Motion

```text
A young chef stands in a warm kitchen, wearing a white apron and dark shirt.
She looks down at the plated dish, then slowly raises her gaze toward camera.
The camera performs a gentle push-in from medium shot to medium close-up.
Soft tungsten lighting reflects on stainless steel surfaces, with subtle steam movement in the background.
By the end of the clip, her expression shifts from focused to satisfied.
```

### T2V Atmospheric Scene

```text
A narrow rainy street in Tokyo at night with neon signs and reflective pavement.
A cyclist enters frame from the left and rides steadily toward the center while pedestrians pass in the background.
Camera tracks right at a slow, stable pace, maintaining a cinematic wide shot.
Blue-magenta neon lighting and wet-surface reflections dominate the mood.
As the clip progresses, light rain intensifies slightly and distant headlights bloom through mist.
```

---

## Quick Troubleshooting

- **Motion is weak** -> Increase explicit action verbs and temporal cues.
- **Subject drifts** -> Re-anchor identity details and reduce scene complexity.
- **Camera feels random** -> State one clear camera path and speed.
- **Clip feels static** -> Add secondary environmental motion (wind, rain, passersby).
