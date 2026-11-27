# HTML and UI artifact foundation

Implement the shared style for reports, websites, and UX previews created in this repository.
Audience: agents and contributors building or reviewing these artifacts.
Updated: 2026-11-26.

## Overview

Read [DESIGN.md](DESIGN.md) for visual defaults before creating or changing an artifact.
This document defines implementation boundaries and delivery checks, not a specific application architecture.
Use both documents for standalone HTML and framework-based UI work.

An explicit user request may change the visual direction. Record that choice in the
artifact handoff. Keep the relevant skill's workflow, accessibility checks, and evidence requirements.

## Contents

- [Overview](#overview)
- [Choose the implementation](#choose-the-implementation)
- [Apply the visual system](#apply-the-visual-system)
- [Build accessible interactions](#build-accessible-interactions)
- [Separate content and state](#separate-content-and-state)
- [Verify and deliver](#verify-and-deliver)

## Choose the implementation

- **Standalone HTML:** Use semantic HTML, inline styles, and minimal JavaScript when a portable document meets the request.
- **Existing websites:** Reuse the host framework, components, assets, and build conventions. Do not add a second UI stack for styling alone.
- **Component libraries:** Reuse installed primitives when suitable. This foundation does not require React, Tailwind, or shadcn.
- **Local assets:** Reuse available fonts and icons. Keep relative asset paths valid at the delivery location.
- **Dependencies:** Add a runtime or build dependency only when the requested behavior needs it.

Choose the artifact workflow from the matching skill. For example, use
`html-artifact` for standalone documents and `ux-preview` for option comparisons.
Apply this repository's visual defaults instead of a template's incidental styling.

## Apply the visual system

1. Read DESIGN.md and identify any explicit visual exception in the request.
2. Define its semantic color, typography, spacing, border, and focus roles in one place.
3. Map host variables to those roles, or define them in the standalone artifact.
4. Build shared controls and compositions from those roles.
5. Adapt layout to content and available width rather than copying an unrelated page structure.

Keep raw palette values in the theme definition. Components consume semantic roles.
An embedded component inherits the host theme or accepts a documented token boundary.
Keep font loading local or use the documented fallback.

If a theme selector is needed, update native `color-scheme` with the selected theme.
Restore a saved choice before first paint when the host supports it.
Do not add a selector or persistence solely because this document describes them.

## Build accessible interactions

- **Document structure:** Use a page title, ordered heading levels, landmarks, and descriptive links.
- **Native controls:** Prefer buttons, links, inputs, and disclosure elements over clickable generic containers.
- **Accessible names:** Label fields and icon-only controls. Associate errors and help text with their fields.
- **Focus behavior:** Keep tab order logical. Restore focus after closing an overlay and support Escape where appropriate.
- **Overlay behavior:** Use suitable dialog primitives. Modal dialogs must manage focus and prevent interaction with background content.
- **Responsive controls:** Preserve the same tasks on narrow screens and coarse pointers. Keep essential actions available without hover.
- **State feedback:** Announce meaningful asynchronous changes without moving focus unnecessarily.

## Separate content and state

- **Evidence:** Distinguish observed results, supplied content, sample fixtures, and inference.
- **Preview state:** Keep comparison selection and visibility controls independent of the simulated workflow.
- **Functional claims:** Implement an action before presenting it as working. Label simulations and unavailable actions.
- **Persistence:** Use only the storage behavior the task requires. State whether choices survive reload or change source files.
- **Failure handling:** Preserve user input when an operation fails and show the actual failure with a recovery action where possible.
- **Data boundaries:** Keep filtering and calculations outside presentation components when the implementation has those boundaries.

## Verify and deliver

1. Open the actual rendered artifact in a browser. A successful build alone is not visual proof.
2. Check a desktop width and a narrow width. Include long content and zoom where they could expose clipping.
3. Exercise the implemented controls with pointer and keyboard input. Check focus visibility and return behavior.
4. Inspect relevant empty, loading, error, and unavailable states. For previews, check every requested option and interaction.
5. Check contrast, readable wrapping, local scrolling, asset loading, and browser errors.
6. Run the host project's relevant checks when code changes require them. Use existing commands rather than assumed package paths or ports.
7. Deliver the exact file path or served URL required by the workflow. State what was exercised and any unverified behavior.

Keep temporary verification scaffolds out of the deliverable. Do not describe browser
simulations as production-runtime proof. If the workflow requires a running preview
server, keep it available for the review and report its exact address.

