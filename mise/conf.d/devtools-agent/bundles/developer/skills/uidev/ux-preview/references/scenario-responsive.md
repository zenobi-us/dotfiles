# Responsive Showcase

Use when viewport size, input method, localization, or content stress is the main uncertainty.

## Inputs

```yaml
scenario: responsive
option_count: 3
viewports: [wide, medium, narrow]
content_stress: [long_label, multiline_error, translated_copy]
interaction: [pointer, keyboard, touch]
```

## Rules

- Render every option at the same viewport sizes.
- Include long labels, errors, and realistic content lengths.
- Test overflow, focus order, target size, and truncation.
- Distinguish responsive reflow from simply scaling desktop.
- Include the narrowest useful viewport.

## Report shape

Use a viewport switcher with synchronized option panels, plus an overflow/focus annotation panel and a responsive behavior table.
