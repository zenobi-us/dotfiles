# Style Showcase

Use when behavior and information architecture are already understood but visual direction is undecided.

## Typical axes

- tone: restrained, expressive, editorial, utilitarian
- typography
- color and contrast
- density
- shape language
- brand alignment

## Inputs

```yaml
scenario: style
option_count: 3
style_axes: [tone, typography, color, density]
content: fixed
behavior: fixed
states: [default, populated, error]
```

## Rules

- Keep content, layout, and interaction behavior invariant.
- Show the same states for every option.
- Use realistic product copy, not abstract swatches.
- Explain exactly which visual variables changed.
- Include contrast and readability notes.
- Do not build a multistep flow unless the visual style changes interaction comprehension.

## Report shape

Use a side-by-side board or synchronized option tabs with:

- identical UI structure
- shared state selector
- visual rationale
- token or typography notes
- trade-offs and recommendation
