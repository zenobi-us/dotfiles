# TUI: Forms & Input

## Text Input Field

```typescript
interface InputState {
  value: string;
  cursorPos: number;
}

class TextInputComponent {
  private state: InputState = { value: "", cursorPos: 0 };

  handleInput(data: string): void {
    // Submit
    if (matchesKey(data, "return")) {
      this.done({ action: "submit", value: this.state.value });
      return;
    }

    // Cancel
    if (matchesKey(data, "escape")) {
      this.done({ action: "cancel" });
      return;
    }

    // Cursor movement
    if (matchesKey(data, "left")) {
      this.state.cursorPos = Math.max(0, this.state.cursorPos - 1);
      return;
    }

    if (matchesKey(data, "right")) {
      this.state.cursorPos = Math.min(this.state.value.length, this.state.cursorPos + 1);
      return;
    }

    if (matchesKey(data, "home") || matchesKey(data, "ctrl+a")) {
      this.state.cursorPos = 0;
      return;
    }

    if (matchesKey(data, "end") || matchesKey(data, "ctrl+e")) {
      this.state.cursorPos = this.state.value.length;
      return;
    }

    // Delete
    if (matchesKey(data, "backspace")) {
      if (this.state.cursorPos > 0) {
        this.state.value = 
          this.state.value.slice(0, this.state.cursorPos - 1) + 
          this.state.value.slice(this.state.cursorPos);
        this.state.cursorPos--;
      }
      return;
    }

    if (matchesKey(data, "delete")) {
      if (this.state.cursorPos < this.state.value.length) {
        this.state.value = 
          this.state.value.slice(0, this.state.cursorPos) + 
          this.state.value.slice(this.state.cursorPos + 1);
      }
      return;
    }

    // Clear line
    if (matchesKey(data, "ctrl+u")) {
      this.state.value = "";
      this.state.cursorPos = 0;
      return;
    }

    // Character input
    if (data.length === 1 && data.charCodeAt(0) >= 32) {
      this.state.value = 
        this.state.value.slice(0, this.state.cursorPos) + 
        data + 
        this.state.value.slice(this.state.cursorPos);
      this.state.cursorPos++;
      return;
    }
  }

  renderInput(width: number): string {
    const th = this.theme;
    const cursor = th.fg("accent", "│");
    
    const before = this.state.value.slice(0, this.state.cursorPos);
    const after = this.state.value.slice(this.state.cursorPos);
    
    return before + cursor + after;
  }
}
```

## Form with Multiple Fields

```typescript
interface FormState {
  fields: {
    name: string;
    description: string;
    enabled: boolean;
  };
  focusedField: "name" | "description" | "enabled";
  cursorPos: number;
}

class FormComponent {
  private state: FormState;
  private fieldOrder = ["name", "description", "enabled"] as const;

  handleInput(data: string): void {
    // Tab to next field
    if (matchesKey(data, "tab")) {
      const idx = this.fieldOrder.indexOf(this.state.focusedField);
      const nextIdx = (idx + 1) % this.fieldOrder.length;
      this.state.focusedField = this.fieldOrder[nextIdx];
      this.state.cursorPos = 0;
      return;
    }

    // Shift+Tab to previous field
    if (matchesKey(data, "shift+tab")) {
      const idx = this.fieldOrder.indexOf(this.state.focusedField);
      const prevIdx = (idx - 1 + this.fieldOrder.length) % this.fieldOrder.length;
      this.state.focusedField = this.fieldOrder[prevIdx];
      this.state.cursorPos = 0;
      return;
    }

    // Handle boolean field
    if (this.state.focusedField === "enabled") {
      if (data === " " || matchesKey(data, "return")) {
        this.state.fields.enabled = !this.state.fields.enabled;
      }
      return;
    }

    // Handle text field input
    this.handleTextInput(data);
  }

  render(width: number): string[] {
    const th = this.theme;
    const lines: string[] = [];

    // Name field
    const nameLabel = this.state.focusedField === "name" 
      ? th.fg("accent", "Name: ") 
      : "Name: ";
    const nameValue = this.renderField("name");
    lines.push(row(" " + nameLabel + nameValue));

    // Description field
    const descLabel = this.state.focusedField === "description" 
      ? th.fg("accent", "Description: ") 
      : "Description: ";
    const descValue = this.renderField("description");
    lines.push(row(" " + descLabel + descValue));

    // Boolean field
    const enabledLabel = this.state.focusedField === "enabled" 
      ? th.fg("accent", "Enabled: ") 
      : "Enabled: ";
    const checkbox = this.state.fields.enabled 
      ? th.fg("accent", "[✓]") 
      : "[ ]";
    lines.push(row(" " + enabledLabel + checkbox));

    return lines;
  }
}
```

## Confirmation Dialog

```typescript
type ConfirmResult = { action: "confirm" } | { action: "cancel" };

class ConfirmDialog {
  constructor(
    private message: string,
    private theme: Theme,
    private done: (result: ConfirmResult) => void
  ) {}

  handleInput(data: string): void {
    if (matchesKey(data, "return") || data === "y" || data === "Y") {
      this.done({ action: "confirm" });
      return;
    }
    if (matchesKey(data, "escape") || data === "n" || data === "N") {
      this.done({ action: "cancel" });
      return;
    }
  }

  render(width: number): string[] {
    const th = this.theme;
    const w = Math.min(width - 4, 50);
    const innerW = w - 2;
    const lines: string[] = [];

    const row = (content: string) =>
      th.fg("border", "│") + pad(content, innerW) + th.fg("border", "│");

    lines.push(th.fg("border", "╭" + "─".repeat(innerW) + "╮"));
    lines.push(row(""));
    lines.push(row(" " + th.fg("warning", "⚠ Confirm")));
    lines.push(row(""));
    lines.push(row(" " + this.message));
    lines.push(row(""));
    lines.push(row(" " + th.fg("dim", "[Y]es  [N]o")));
    lines.push(row(""));
    lines.push(th.fg("border", "╰" + "─".repeat(innerW) + "╯"));

    return lines;
  }
}
```

## Input Validation

```typescript
interface ValidationResult {
  valid: boolean;
  error?: string;
}

function validateName(value: string): ValidationResult {
  if (!value.trim()) {
    return { valid: false, error: "Name is required" };
  }
  if (value.length > 50) {
    return { valid: false, error: "Name too long (max 50 chars)" };
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
    return { valid: false, error: "Only letters, numbers, _ and - allowed" };
  }
  return { valid: true };
}

// In render:
const validation = validateName(this.state.fields.name);
if (!validation.valid) {
  lines.push(row(" " + th.fg("error", "⚠ " + validation.error)));
}
```

## Password/Hidden Input

```typescript
renderPassword(): string {
  const th = this.theme;
  const masked = "•".repeat(this.state.value.length);
  const cursor = th.fg("accent", "│");
  
  const before = masked.slice(0, this.state.cursorPos);
  const after = masked.slice(this.state.cursorPos);
  
  return before + cursor + after;
}
```

## Placeholder Text

```typescript
renderInput(): string {
  const th = this.theme;
  const cursor = th.fg("accent", "│");
  
  if (this.state.value.length === 0) {
    return th.fg("dim", "Enter value...") + cursor;
  }
  
  const before = this.state.value.slice(0, this.state.cursorPos);
  const after = this.state.value.slice(this.state.cursorPos);
  
  return before + cursor + after;
}
```
