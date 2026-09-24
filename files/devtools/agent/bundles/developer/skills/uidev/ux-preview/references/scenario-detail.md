# Detail and Hierarchy Showcase

Use when the decision concerns how much information to reveal and when.

## Typical axes

- information density
- progressive disclosure
- hierarchy
- copy length
- help placement
- summary versus full editor

## Inputs

```yaml
scenario: detail
option_count: 3
detail_axes: [density, disclosure, hierarchy, help]
content_lengths: [short, realistic, long]
states: [default, populated, validation_error, narrow]
```

## Rules

- Keep visual styling mostly invariant.
- Vary information architecture, hierarchy, and disclosure behavior.
- Test realistic short and long content.
- Make hidden information discoverable and keyboard accessible.
- Include errors and narrow layouts.
- Compare scan speed, discoverability, perceived complexity, task length, and recovery.

## Report shape

Use synchronized option panels with:

- collapsed and expanded states
- content-length switcher
- responsive preview
- visibility/disclosure matrix
- decision criteria tied to observable behavior
