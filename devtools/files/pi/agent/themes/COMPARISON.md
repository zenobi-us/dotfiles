# Theme Comparison Guide

Quick reference for choosing between available themes.

## At a Glance

| Theme      | Temperature | Saturation | Background | Best For                    |
|------------|-------------|------------|------------|----------------------------|
| **ayu-dark** | Warm       | High       | Very Dark  | Long sessions, focus       |
| dark       | Cool        | Medium     | Dark       | General use, balanced      |
| light      | Neutral     | Low        | Light      | Bright environments        |
| rose-pine  | Cool        | Medium     | Dark       | Aesthetic, comfort         |

## Detailed Comparison

### Ayu Dark 🔥
**Philosophy:** Warm, vibrant colors that reduce eye strain during extended coding

- **Primary Accent:** Golden yellow (#E6B450)
- **Background:** Very dark gray (#0A0E14)
- **Syntax:** Warm oranges, yellows, greens
- **Strengths:**
  - Excellent for long coding sessions (8+ hours)
  - High contrast makes code very readable
  - Warm colors reduce blue light exposure
  - Clear visual hierarchy with distinct colors
- **Use When:**
  - Working late nights
  - Extended focus sessions
  - You prefer warm color schemes
  - You want maximum code element distinction

### Built-in Dark (Default) 🌊
**Philosophy:** Balanced, cool tones for general development

- **Primary Accent:** Teal (#8abeb7)
- **Background:** Medium dark (#343541)
- **Syntax:** Cool blues, purples, balanced greens
- **Strengths:**
  - Works well in most environments
  - Cool tones are professional
  - Good balance of contrast and subtlety
- **Use When:**
  - You want a safe, balanced theme
  - Working in team settings
  - Switching between light/dark environments

### Rose Pine 🌸
**Philosophy:** Elegant, aesthetic color harmony

- Check rose-pine.json for specific color details
- **Strengths:**
  - Beautiful, carefully curated palette
  - Gentle on the eyes
  - Strong aesthetic appeal
- **Use When:**
  - You value aesthetics
  - Recording videos/screenshots
  - Comfort over maximum contrast

### Built-in Light ☀️
**Philosophy:** Minimal, clean for bright environments

- **Primary Accent:** Teal (#5f8787)
- **Background:** Light gray (#e8e8e8)
- **Syntax:** Darker, muted colors
- **Strengths:**
  - Works in bright rooms/outdoors
  - High ambient light compatibility
  - Reduces screen glare
- **Use When:**
  - Working in bright environments
  - Daytime work near windows
  - You prefer light themes

## Color Temperature Impact

### Warm Themes (Ayu Dark)
- **Pros:**
  - Reduces blue light (better for evening work)
  - Creates cozy, focused atmosphere
  - Less eye strain in dark rooms
- **Cons:**
  - May look "too warm" for some users
  - Less "professional" appearance

### Cool Themes (Dark, Rose Pine)
- **Pros:**
  - More "professional" appearance
  - Works well in office settings
  - Familiar to most developers
- **Cons:**
  - More blue light exposure
  - May cause more eye strain at night

## Syntax Color Philosophy

### Ayu Dark Approach
- **Keywords/Operators:** Orange (action, imperative)
- **Functions:** Yellow (callable, important)
- **Variables:** Blue (data, values)
- **Strings:** Green (content, data)
- **Types:** Cyan (structure, definitions)

### Traditional Dark Approach
- **Keywords:** Blue (structural)
- **Functions:** Yellow/Gold (callable)
- **Variables:** Cyan/Light Blue (data)
- **Strings:** Green/Beige (content)
- **Types:** Teal (definitions)

## Thinking Level Indicators

All themes use color progression for thinking levels, but with different palettes:

**Ayu Dark:** Gray → Gray → Blue → Cyan → Yellow → Orange (warm progression)
**Dark:** Dark Gray → Gray → Blue → Light Blue → Purple → Magenta (cool progression)

## Recommendations

### Choose Ayu Dark if you:
- ✅ Code for 4+ hours daily
- ✅ Work primarily in the evening/night
- ✅ Prefer high contrast
- ✅ Like warm color schemes
- ✅ Want maximum syntax distinction

### Choose Default Dark if you:
- ✅ Want a balanced, safe choice
- ✅ Work in varied lighting conditions
- ✅ Prefer cool, professional colors
- ✅ Switch between projects frequently

### Choose Rose Pine if you:
- ✅ Value aesthetics highly
- ✅ Create content (videos, tutorials)
- ✅ Want a unique, beautiful theme
- ✅ Prefer gentle, harmonious colors

### Choose Light if you:
- ✅ Work in bright environments
- ✅ Have bright ambient lighting
- ✅ Prefer light themes
- ✅ Work during daytime hours

## Switching Themes

You can change themes anytime:

```bash
# Interactive selection
/theme

# Or in settings
/settings
# Set "theme": "ayu-dark" (or other theme name)
```

## Customization

All themes can be copied and customized:

```bash
cp ~/.pi/agent/themes/ayu-dark.json ~/.pi/agent/themes/my-theme.json
# Edit my-theme.json
# Use with: /theme → my-theme
```

---

**Pro Tip:** Try each theme for a full day before deciding. Color perception changes based on time of day, lighting, and your monitor settings.
