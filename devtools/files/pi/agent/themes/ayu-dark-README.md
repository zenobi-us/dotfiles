# Ayu Dark Theme for Pi Coding Agent

A beautiful dark theme inspired by the popular Ayu color scheme, optimized for comfortable long coding sessions with warm, saturated colors.

## Installation

The theme is already installed at `~/.pi/agent/themes/ayu-dark.json`

## Activation

### Option 1: Using the `/theme` command
1. Start pi in interactive mode
2. Type `/theme`
3. Select `ayu-dark` from the list

### Option 2: Using settings
1. Type `/settings`
2. Set `"theme": "ayu-dark"`
3. Save and restart

### Option 3: Command line
```bash
pi --theme ayu-dark
```

## Color Palette

The Ayu Dark theme uses these core colors:

| Color    | Hex       | Usage                                    |
|----------|-----------|------------------------------------------|
| Orange   | `#FF8F40` | Keywords, operators, warnings, bullets   |
| Yellow   | `#FFB454` | Functions, headings, high thinking       |
| Green    | `#C2D94C` | Strings, success, code blocks, additions |
| Cyan     | `#95E6CB` | Types, inline code, accent borders       |
| Blue     | `#59C2FF` | Variables, links, borders                |
| Purple   | `#FFEE99` | Numbers, custom message labels           |
| Red      | `#F07178` | Errors, deletions                        |
| Accent   | `#E6B450` | Primary accent (golden yellow)           |

## Design Philosophy

- **Warm color temperature**: Reduces eye strain during long sessions
- **High saturation**: Makes syntax elements pop without being harsh
- **Dark backgrounds**: Deep grays and blacks for comfortable viewing
- **Distinct thinking levels**: Clear visual progression from gray → blue → cyan → yellow → orange
- **Semantic color mapping**: Colors have consistent meanings across contexts

## Features

- ✅ All 50 required color tokens defined
- ✅ Optimized for 24-bit truecolor terminals
- ✅ Graceful fallback to 256-color mode
- ✅ HTML export colors configured
- ✅ Distinct borders for different thinking levels
- ✅ High contrast for important elements (errors, warnings)
- ✅ Muted colors for secondary information

## Comparison with Built-in Dark Theme

| Aspect              | Ayu Dark                    | Built-in Dark              |
|---------------------|-----------------------------|----------------------------|
| Overall feel        | Warm, saturated             | Cool, balanced             |
| Accent color        | Golden yellow (#E6B450)     | Teal (#8abeb7)             |
| Background          | Very dark gray (#0A0E14)    | Medium dark (#343541)      |
| Syntax colors       | Warm oranges/yellows        | Cool blues/purples         |
| Best for            | Long sessions, focus        | General use                |

## Screenshot

(To capture a screenshot, run pi with `--theme ayu-dark` and use `/export` to generate HTML)

## Credits

Based on the Ayu color scheme by Ike Ku:
- Original: https://github.com/ayu-theme/ayu-colors
- Adapted for Pi Coding Agent TUI

## License

MIT License - Free to use and modify
