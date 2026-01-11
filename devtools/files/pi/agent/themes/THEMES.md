# Pi Coding Agent Custom Themes

This directory contains custom themes for the Pi Coding Agent.

## Available Custom Themes

### Ayu Dark (`ayu-dark`)
A beautiful dark theme with warm, saturated colors inspired by the popular Ayu color scheme.

**Features:**
- Warm orange/yellow color temperature for reduced eye strain
- High saturation for excellent code readability
- Deep dark backgrounds (#0A0E14)
- Golden yellow accent (#E6B450)
- Distinct thinking level progression

**Best for:** Long coding sessions, focus work, developers who prefer warm color schemes

See [ayu-dark-README.md](./ayu-dark-README.md) for details.

### Rosé Pine (`rose-pine`)
An elegant dark theme with soho vibes inspired by the popular Rosé Pine color scheme.

**Features:**
- Cozy purple-toned backgrounds for a distinctive aesthetic
- Carefully balanced warm accents (foam, rose, gold, iris)
- Deep purple-black base (#191724)
- Soft cyan accent (#9ccfd8)
- Low eye strain with warm color palette

**Best for:** Purple theme enthusiasts, cozy focused coding, developers who enjoy soho vibes aesthetics

See [rose-pine-README.md](./rose-pine-README.md) for details.

## Theme Installation

Custom themes are automatically discovered from this directory (`~/.pi/agent/themes/`).

## Using a Theme

### Method 1: Interactive Selection
```bash
pi
/theme
# Select your theme from the list
```

### Method 2: Settings File
```bash
pi
/settings
# Set "theme": "ayu-dark"
# Save and restart
```

### Method 3: Command Line
```bash
pi --theme ayu-dark
```

## Creating Your Own Theme

1. Copy an existing theme as a starting point:
   ```bash
   cp ~/.pi/agent/themes/ayu-dark.json ~/.pi/agent/themes/my-theme.json
   ```

2. Edit the theme file:
   - Change the `"name"` field
   - Customize colors in the `"vars"` section
   - Adjust color assignments in the `"colors"` section

3. Validate your theme:
   ```bash
   node /tmp/test-ayu-theme.js
   ```

4. Use your theme:
   ```bash
   pi --theme my-theme
   ```

## Theme Structure

All themes must include:
- **51 required color tokens** (no optional colors)
- Valid JSON syntax
- Schema reference for editor support

### Color Formats

- Hex colors: `"#ff0000"`
- 256-color palette: `42` (number 0-255)
- Variable references: `"primary"` (defined in `vars`)
- Terminal default: `""` (empty string)

## Resources

- [Official Theme Documentation](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/theme.md)
- [Theme Schema](https://raw.githubusercontent.com/badlogic/pi-mono/main/packages/coding-agent/theme-schema.json)
- Built-in themes: 
  - `/dark.json` (default)
  - `/light.json`

## Contributing Themes

To share your theme:
1. Ensure it's properly formatted and validated
2. Create a README documenting the color choices
3. Test it in various scenarios (code editing, errors, markdown)
4. Share via GitHub or submit to pi-mono repository

---

Last updated: 2026-01-11
