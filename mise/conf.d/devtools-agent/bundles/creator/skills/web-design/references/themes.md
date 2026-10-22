# Create or apply a theme

Read this file for a theme or styling-only request.

## Map semantic roles

1. Inspect the current token source, theme catalog, stylesheet loading order, and saved preference behavior.
2. Select the style with references/style-selection.md. Map its background, surface, foreground, muted text, primary, border, error, success, and focus roles to existing tokens.
3. Define component colors through those roles. Derive muted values with the selected source's formulas where appropriate. Keep charts, editors, and embedded surfaces within their existing host token contracts.
4. Apply typography, spacing, and geometry only within the requested scope. Keep data, filters, selection, URLs, widget placement, and save behavior unchanged.
5. Add theme switching or persistence only when requested. If a selector already exists, preserve its catalog, saved preference, initial paint, and color-scheme behavior.
6. Test text contrast against actual surfaces, including hover, muted controls, focus, errors, and disabled states. Keep meaning available without color alone.

For a new theme, document the mapping and any source role that has no target equivalent. Do not claim the asset supplies font files, a complete component library, or measured contrast values for your implementation.

## Check

Render the changed surfaces and compare populated, empty, focused, and error states where they exist. Complete references/verification.md. Confirm that styling changes have not reset application state.
