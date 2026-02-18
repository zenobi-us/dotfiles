# UX Patterns

## Lists & Filtering

- **Always provide fuzzy search** — When showing lists, allow filtering with fzf-style matching (substring + character sequence)
- **Show result count** — Display filtered count vs total: `Items (12/45)`
- **Indicate active filter** — Make it obvious when a filter is applied
- **Escape clears filter first** — Hierarchical escape: clear filter → then close overlay

```typescript
// fzf-style matching: "abc" matches "a]xxx[b]xx[c]" 
function fuzzyMatch(query: string, text: string): boolean {
  const lq = query.toLowerCase();
  const lt = text.toLowerCase();
  if (lt.includes(lq)) return true;  // substring match
  
  let qi = 0;
  for (let i = 0; i < lt.length && qi < lq.length; i++) {
    if (lt[i] === lq[qi]) qi++;
  }
  return qi === lq.length;  // character sequence match
}
```

---

## List/Detail Views

**Ask before building:** When planning an extension that lists things, consider:

- Does each item have enough metadata to warrant a detail view?
- Can users take actions on individual items (edit, delete, configure)?
- Would preview-on-select improve the experience?

**When to use list-only:**
- Simple selection (pick one and done)
- Items are self-explanatory (shader names, model aliases)
- No per-item actions beyond select

**When to add detail view:**
- Items have rich metadata (description, timestamps, config)
- Per-item actions needed (edit, delete, duplicate)
- Preview would help decision-making

**Navigation pattern:**
```
List View                    Detail View
┌─────────────────────┐     ┌─────────────────────┐
│ ▸ Item A            │────▶│ Item A              │
│   Item B            │     │                     │
│   Item C            │     │ Description: ...    │
│                     │     │ Created: ...        │
│                     │◀────│                     │
│ [enter] view detail │     │ [esc] back to list  │
└─────────────────────┘     └─────────────────────┘
```

---

## Selection & Focus

- **Visible cursor** — Always show which item is selected: `▸` or highlight
- **Keyboard-first** — All actions available via keyboard
- **Consistent bindings** — `↑↓` navigate, `Enter` select/confirm, `Esc` cancel/back
- **Show available actions** — Footer with keybinding hints

---

## Feedback & State

- **Immediate feedback** — Notify on success/failure of actions
- **Loading states** — Show progress for async operations
- **Empty states** — Helpful message when no items exist
- **Error recovery** — Suggest next steps when things fail

```typescript
// Empty state examples
if (items.length === 0) {
  if (filterQuery) {
    lines.push(row(" No items match your search"));
    lines.push(row(" " + th.fg("dim", "Try a different term")));
  } else {
    lines.push(row(" No items yet"));
    lines.push(row(" " + th.fg("dim", "Run: /myext add <name>")));
  }
}
```

---

## Preview & Live Updates

- **Preview when safe** — Apply changes temporarily if reversible (e.g., shaders)
- **Backup before preview** — Restore original state on cancel
- **Indicate preview mode** — Make it clear changes aren't persisted yet

```typescript
// Preview pattern
handleNavigate(): void {
  if (!this.state.backupMade) {
    this.backupCurrentState();
    this.state.backupMade = true;
  }
  this.applyPreview(this.selectedItem);
}

handleCancel(): void {
  this.restoreBackup();
  this.done({ action: "cancel" });
}

handleConfirm(): void {
  this.clearBackup();  // Keep the previewed state
  this.done({ action: "apply", item: this.selectedItem });
}
```

---

## Confirmations

- **Destructive actions need confirmation** — Delete, overwrite, reset
- **Quick confirmation** — `[Y]es / [N]o` or dedicated confirm dialog
- **Show what will happen** — "Delete 'my-item'? This cannot be undone."

---

## Questions to Ask When Designing

1. What's the primary action users want to take?
2. How many items will typically be shown? (affects viewport size)
3. Do items need to be grouped or sorted?
4. What information helps users make a selection?
5. Are there destructive actions that need safeguards?
6. Would preview/live-update improve the experience?
