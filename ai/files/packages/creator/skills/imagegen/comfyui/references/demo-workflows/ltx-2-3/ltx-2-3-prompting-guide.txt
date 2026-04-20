# LTX 2.3 Prompting Guide

> Source: LTX-Video team official guide. Covers LTX 2.3 image-to-video (I2V) and text-to-video (T2V).

LTX 2.3 introduces major improvements to detail, motion, prompt understanding, audio reliability, and native portrait support. This changes how you should prompt.

---

## Core Principles

### 1. Be More Specific — The Engine Can Handle It

LTX 2.3 includes a larger, more capable text connector. It interprets complex prompts accurately, especially for multiple subjects, spatial relationships, stylistic constraints, and detailed actions.

**Simplifying no longer helps. Specificity wins.**

```
Instead of:  A woman in a café
Try:         A woman in her 30s sits by the window of a small Parisian café.
             Rain runs down the glass behind her. Warm tungsten interior lighting.
             She slowly stirs her coffee while glancing at her phone.
             Background softly out of focus.
```

### 2. Direct the Scene — Don't Just Describe It

LTX 2.3 respects spatial layout. Be explicit: left vs right, foreground vs background, facing toward vs away, distance between subjects.

```
Instead of:  Two people talking outside
Try:         Two people stand facing each other on a quiet suburban sidewalk.
             The taller man stands on the left, hands in pockets.
             The woman stands on the right, holding a bicycle.
             Houses blurred in the background.
```

Block the scene like a director.

### 3. Describe Texture and Material

With a rebuilt latent space and updated VAE, fine detail is sharper. Describe fabric types, hair texture, surface finish, environmental wear, edge detail.

```
Close-up of wind moving through fine, curly hair. Individual strands visible.
Soft afternoon backlight catching edge detail.
```

### 4. For I2V, Use Verbs

Motion still needs clarity. Avoid vague descriptions:

```
Avoid:       The scene comes alive
Try:         The camera slowly pushes forward as the subject turns their head
             and begins walking toward the street. Cars pass.
```

Specify who moves, what moves, how they move, what the camera does. Motion is driven by verbs.

### 5. Avoid Static, Photo-Like Prompts

If your prompt reads like a still image, the output may behave like one.

```
Instead of:  A dramatic portrait of a man standing
Try:         A man stands on a windy rooftop. His coat flaps in the wind.
             He adjusts his collar and steps forward as the camera tracks right.
```

### 6. Design for Native Portrait

LTX 2.3 supports native vertical video up to 1080x1920. When generating portrait content, compose for vertical intentionally.

```
Don't treat vertical as cropped landscape. Frame for it.
Influencer vlogging while on holiday — shoot for vertical.
```

### 7. Be Clear About Audio

The new vocoder improves reliability and alignment. If you want sound, describe it: environmental audio, tone and intensity, dialogue clarity.

```
A low, pulsing energy hum radiates from the glowing orb.
A sharp, intermittent alarm blares in the background, metallic and urgent,
echoing through the spacecraft interior.
```

---

## Prompt Structure

### Shot Priority

The model responds better when the prompt has **one dominant event or shot idea** instead of several competing moments. One scene, one focus.

### Named Motion Over Style Words

Strong prompts say what changes on screen. They do not rely on vague labels like `dynamic`, `cinematic`, or `epic` to carry the action.

```
Walking, pouring, turning, lifting, revealing, drifting
— more than dramatic, vivid, or engaging on their own.
```

### Camera Intent

Even a short phrase gives the output more direction:
- `slow push-in`
- `fixed frame`
- `side tracking shot`
- `handheld movement`
- `slow dolly in`

### Prompt Order That Works

```
Subject -> action -> camera -> mood
```

This keeps the prompt legible and makes refinement easier.

### Format

Write as a **single flowing paragraph**. Use present tense verbs for action and movement. Match detail level to shot scale — close-ups need more detail than wide shots. Aim for 4–8 descriptive sentences.

---

## Shot Composition Categories

### Camera Language

| Movement | Use when |
|---|---|
| Follows, Tracks | Subject is moving through space |
| Pans across | Static subject, scanning scene |
| Circles around | Revealing subject from all sides |
| Tilts upward / Pushes in | Dramatic emphasis, reveal |
| Overhead view | Establishing, god's-eye |
| Over-the-shoulder | Dialogue, interaction |
| Wide establishing shot | Setting context |
| Static frame | Tension, stillness |
| Handheld movement | Documentary, chaos, intimacy |

### Scale Indicators

- **Expansive / Epic** — wide landscapes, large crowds
- **Intimate / Claustrophobic** — close quarters, tension
- **Medium** — neutral, conversational

### Pacing & Temporal Effects

- Slow motion — dramatic emphasis
- Time-lapse — passage of time
- Rapid cuts — energy, intensity
- Lingering shot — contemplation, weight
- Continuous shot — realism, unbroken take
- Freeze-frame — dramatic pause
- Fade-in / fade-out — transition

### Film Characteristics

Film grain, lens flares, jittery stop-motion, pixelated edges — use deliberately.

---

## Visual Details

### Lighting

Flickering candles, neon glow, natural sunlight, dramatic shadows, backlit rim light, warm tungsten, cool blue ambient.

### Textures

Rough stone, smooth metal, worn fabric, glossy surfaces, weathered wood, matte finish.

### Atmosphere

Fog, rain, dust, smoke, particles, mist, golden hour, overcast.

### Color Palette

Vibrant, muted, monochromatic, high contrast, warm tones, cool tones, desaturated.

---

## Audio & Voice

### Ambient Settings

Coffeeshop noise, wind and rain, forest ambience with birds, traffic hum, ocean waves.

### Dialogue

- Place spoken dialogue in quotation marks
- Specify language and accent if needed
- Energetic announcer, resonant voice with gravitas, distorted radio-style, robotic monotone, childlike curiosity

### Volume Cues

Whisper, mutter, shout, scream — give the model volume reference.

---

## Content to Avoid

| Avoid | Why |
|---|---|
| Internal emotional states ("she feels sad") | Use visual cues instead of abstract labels |
| Text and logos | Readable text is not currently reliable |
| Complex physics | Chaotic motion introduces artifacts |
| Overloaded scenes | Too many characters or actions reduce quality |
| Conflicting lighting | Mixed light logic confuses scene interpretation |
| Overcomplicated prompts | Start simple and layer complexity gradually |

---

## Sample Prompts

### Commercial — Product Hero

```
Luxury skincare bottle on a wet stone surface, gentle push-in camera,
soft morning light, subtle water movement, premium beauty commercial mood,
minimal background distraction.
```

### Character — Portrait Motion

```
Young chef plating a dish in a quiet open kitchen, medium close-up,
calm hand movement, warm tungsten highlights, shallow depth feel,
understated cinematic realism.
```

### Environment — Atmospheric Scene

```
Fog rolling over pine trees around a mountain cabin at dawn,
slow rising drone-like camera, cool blue light, soft wind in the branches,
contemplative cinematic tone.
```

### Short Form — Social Hook

```
Fresh croissant breaking open on a marble counter, quick close-up reveal,
visible steam, crisp bakery lighting, satisfying food detail,
short-form premium ad style.
```

---

## What Works Well

- **Cinematic compositions** — wide, medium, close-up with thoughtful lighting and natural motion
- **Emotive human moments** — strong single-subject emotional expressions, subtle gestures, facial nuance
- **Atmosphere & setting** — fog, mist, golden-hour light, rain, reflections
- **Clear camera language** — explicit instructions like "slow dolly in" or "handheld tracking"
- **Stylized aesthetics** — painterly, noir, analog film, fashion editorial, pixelated animation
- **Voice capabilities** — characters can talk and sing; multiple languages supported
