# Quick Start - UI Simulator

## 1. Load the Extension

```bash
pi -e ~/.pi/agent/extensions/theme-palette/index-simulator.ts
```

## 2. Toggle the Simulator

In your pi session:

```bash
/theme-simulator
```

You'll see realistic UI elements using your theme colors!

## 3. Try Different Modes

```bash
# Just simulator (default)
/theme-simulator

# Palette + Simulator side-by-side
/theme-simulator both

# Switch modes on the fly
/theme-simulator-mode both
/theme-simulator-mode simulator
```

## 4. Use the Keyboard Shortcut

Press `Ctrl+Shift+U` to toggle the simulator instantly!

## What You'll See

### 🎯 Interactive Elements
Real buttons with your theme colors:
- Primary actions (accent color)
- Secondary buttons (muted borders)
- Success/error states
- Disabled states

### 💬 Message Bubbles
Chat-style messages showing:
- User messages (elevated surface)
- AI thinking state (subtle background)
- System messages (recessed surface)

### 💻 Code Blocks
Syntax-highlighted code using your theme:
- Keywords, functions, strings, comments
- Git diff view (+/-/context lines)
- Proper contrast hierarchy

### ⚡ Alerts & Status
Notification styles:
- Success ✓
- Warning ⚠
- Error ✗
- Thinking intensity levels

### 📝 Form Elements
Input fields and controls:
- Text inputs (normal/disabled)
- Checkboxes (checked/unchecked)
- Validation hints
- Focus states

## Benefits

✅ See colors in **real context**, not just swatches  
✅ Validate **readability** of text hierarchies  
✅ Test **contrast** in actual UI patterns  
✅ Understand **when** to use each color  
✅ Learn the **design system** through examples  

## Customization

Want to add your own UI examples?

Edit: `devtools/files/pi/agent/extensions/theme-palette/components/UISimulator.ts`

Add new sections like:
- Navigation menus
- Data tables
- Progress bars
- Modal dialogs
- Dropdown menus

## Tips

💡 Use "both" mode to learn which tokens map to which UI elements  
💡 Compare your theme against the simulations for consistency  
💡 Test readability by looking at code blocks and form labels  
💡 Validate hierarchy by checking button prominence  

## Switching Back

If you prefer the original palette view:

```bash
# Stop the simulator
/theme-simulator

# Load the original extension
pi -e ~/.pi/agent/extensions/theme-palette/index.ts
```

## Need Help?

Read the full documentation:
- `README-SIMULATOR.md` - Complete usage guide
- `EXAMPLE-VIEW.md` - Visual examples with ASCII art
- `SIMULATOR-SUMMARY.md` - Architecture and design philosophy

---

**Enjoy exploring your theme with realistic UI simulations!** 🎨✨
