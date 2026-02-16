---
id: f1e37c82
title: Generate Commit Message Modal - Fix Analysis
created_at: 2026-02-17
updated_at: 2026-02-17
status: in-progress
epic_id: null
phase_id: null
related_task_id: null
---

# Research: Generate Commit Message Modal - Fix Analysis

## Research Questions

1. Why doesn't the Escape key close the modal properly?
2. Why doesn't the 'q' key close the modal?
3. What are the border rendering issues?

## Summary

Analysis of `devtools/files/pi/agent/extensions/generate-commit-message/index.ts` reveals two distinct issues:

1. **'q' key not handled for modal close** - The key is being captured by the filter input logic
2. **Potential border rendering issues** - Need to investigate `visibleWidth` usage and ANSI escape handling

## Findings

### Issue 1: Escape Key (Likely Working)

Looking at the code (lines 585-588):

```typescript
// Handle Escape or Ctrl+C to cancel (using matchesKey for cross-terminal compatibility)
if (matchesKey(data, "escape") || matchesKey(data, "ctrl+c")) {
  done(null);
  return;
}
```

**Analysis:** This follows the correct pattern from pi-tui examples. Uses `matchesKey(data, "escape")` which is the canonical method.

**Possible issue:** The escape key check happens AFTER the options are computed (`getFormattedOptions()` on line 583). This shouldn't affect functionality, but is slightly inefficient.

**Reference pattern** (from pi-subagents `todo.ts` example):
```typescript
if (matchesKey(data, "escape") || matchesKey(data, "ctrl+c")) {
  this.onClose();
}
```

✅ **Escape pattern appears correct** - if it's not working, the issue may be:
- Terminal-specific escape sequence differences
- Focus not being on the overlay component
- The `done()` callback not triggering overlay close properly

### Issue 2: 'q' Key NOT Implemented for Close

**Location:** Lines 610-613

```typescript
// Handle regular characters for filtering
if (data.length === 1 && /[a-zA-Z0-9\-_/.]/.test(data)) {
  filterQuery += data;
  selectedIndex = 0;
  return;
}
```

**Problem:** The regex `/[a-zA-Z0-9\-_/.]/` matches 'q', so pressing 'q' adds it to the filter instead of closing.

**Fix Required:** Add explicit 'q' handling BEFORE the filter logic:

```typescript
// Handle 'q' to close (common modal convention)
if (data === "q" || data === "Q") {
  done(null);
  return;
}

// Handle regular characters for filtering (AFTER q check)
if (data.length === 1 && /[a-zA-Z0-9\-_/.]/.test(data)) {
  filterQuery += data;
  selectedIndex = 0;
  return;
}
```

**Reference:** From `space-invaders.ts`:
```typescript
if (matchesKey(data, Key.escape) || data === "q" || data === "Q") {
  this.dispose();
  this.onClose();
  return;
}
```

### Issue 3: Border Rendering Analysis

The render method uses box-drawing characters:
- Header: `╭─...title...─╮`
- Rows: `│ content │`
- Footer: `╰─...help...─╯`

**Potential issues identified:**

#### 3.1 Width Calculation for Borders

The `row()` helper calculates `innerW = width - 2` to account for the two border characters. However, the content padding uses `visibleWidth()` which correctly handles ANSI codes.

**Observation:** Line 513-519 has complex spacing calculation:
```typescript
const modelPadded = modelPart.padEnd(maxModelIdLen);
const innerW = width - 2;
const contentWidth = visibleWidth("▶ " + modelPadded + "  " + costPart);
const spacing = " ".repeat(Math.max(0, innerW - contentWidth));
```

**Issue:** `modelPadded` uses `padEnd()` which assumes 1 byte = 1 character. If model IDs contain Unicode, this could misalign. Should use `visibleWidth()` for the padded calculation.

#### 3.2 Selected Item Row with Background

Lines 526-532:
```typescript
lines.push(
  theme.bg(
    "userMessageBg",
    theme.fg("border", "│") +
      pad(itemContent, innerW) +
      theme.fg("border", "│"),
  ),
);
```

**Issue:** The background is applied to the ENTIRE row including borders. This may cause:
- Border colors being overridden by background
- Visual inconsistency with non-selected rows

**Reference pattern** from pi-subagents: Apply background ONLY to content, not borders:
```typescript
const content = theme.bg("selection", pad(itemContent, innerW));
lines.push(theme.fg("border", "│") + content + theme.fg("border", "│"));
```

#### 3.3 Empty Line at Top

Line 471-472:
```typescript
// Top spacing
lines.push("");
```

This could cause alignment issues if the overlay system doesn't expect empty lines.

## Recommended Fixes

### Fix 1: Add 'q' Key Handler

**File:** `devtools/files/pi/agent/extensions/generate-commit-message/index.ts`
**Location:** In `handleInput()`, BEFORE the filter character check

```typescript
// Handle 'q' or 'Q' to close modal (BEFORE filter logic)
if (data === "q" || data === "Q") {
  done(null);
  return;
}
```

### Fix 2: Fix Background Application on Selected Row

**Location:** Lines 526-532

**Before:**
```typescript
lines.push(
  theme.bg(
    "userMessageBg",
    theme.fg("border", "│") +
      pad(itemContent, innerW) +
      theme.fg("border", "│"),
  ),
);
```

**After:**
```typescript
const highlightedContent = theme.bg("userMessageBg", pad(itemContent, innerW));
lines.push(
  theme.fg("border", "│") + highlightedContent + theme.fg("border", "│")
);
```

### Fix 3: Use visibleWidth for Model ID Padding

**Location:** Line 513

**Before:**
```typescript
const modelPadded = modelPart.padEnd(maxModelIdLen);
```

**After:**
```typescript
const modelVisibleLen = visibleWidth(modelPart);
const modelPadded = modelPart + " ".repeat(Math.max(0, maxModelIdLen - modelVisibleLen));
```

## References

- [learning-42c8d9e1-pi-subagents-ui-patterns-complete.md](learning-42c8d9e1-pi-subagents-ui-patterns-complete.md) - Complete UI patterns reference
- [research-pi-subagents-overlay-patterns.md](research-pi-subagents-overlay-patterns.md) - Overlay modal patterns
- Pi TUI documentation: `docs/tui.md`
- Example: `examples/extensions/todo.ts` - Escape handling
- Example: `examples/extensions/space-invaders.ts` - 'q' key handling

## Test Plan

1. Test Escape key closes modal
2. Test 'q' key closes modal  
3. Test filtering still works (type model name)
4. Verify border alignment with different terminal widths
5. Verify selected row highlighting doesn't break borders
6. Test with unicode model IDs (if any exist)
