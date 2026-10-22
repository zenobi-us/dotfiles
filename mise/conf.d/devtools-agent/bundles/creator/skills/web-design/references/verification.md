# Verify the deliverable

Read this file before handing off a page, theme, or design system.

## Rendered surfaces

- Start the target application or a static server on a known free port. Open the actual changed page.
- Inspect desktop and narrow layouts with realistic long content. Check that intentional local scrolling does not cause accidental page-wide overflow.
- Follow each new or changed link. Exercise each new or changed control and the state transitions within scope.
- Use the keyboard to check focus visibility, reading order, disclosure, dismissal, and focus return where applicable.
- Confirm stylesheet, font, image, and icon loading. Verify asset URLs under the intended deployment prefix.
- Check text and focus contrast against actual surfaces. Confirm semantic headings, control names, and meaningful status text.
- Inspect browser errors. Distinguish an unavailable destination from a broken local link, and report either explicitly.
- Run the relevant existing checks once after implementation. Fix affected contract failures; do not substitute a build for browser evidence.

Use the available browser skill for interaction and screenshots. Close verification tabs when finished. Keep a ux-preview server running when that workflow requires it; otherwise stop only the temporary server you started.

## Specifications

For specification-only work, verify token names, semantic mappings, requested component coverage, and the distinction between implemented and proposed rules. Do not claim browser proof for unimplemented components.

## Handoff

Report the output path or URL, selected style and primary source, explicit overrides, exercised checks, and remaining limits. For a preview, label fixture content and simulated behavior. Publishing, repository creation, and design approval are separate user decisions.
