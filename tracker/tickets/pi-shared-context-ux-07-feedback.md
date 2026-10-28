---
schema: tracker-ticket/v1
id: pi-shared-context-ux-07-feedback
title: Track ongoing shared-context UX feedback
parent: pi-shared-context-tui-ux-spec
sequence: 7
type: enhancement
triage: ready-for-agent
work_status: claimed
blocked_by: []
---

## What to build

Keep this task as the ongoing feedback log for the shared-context UX initiative. The user will add feedback as work progresses. This task is in progress at the user's request; capture does not imply the UI changes are implemented.

## Feedback — 2026-10-29

1. **Ticket list density:** The initial ticket list is relatively compact while receipts load, which is good (image 1). After loading, receipt diagnostics add excessive information and overwhelm the list (images 2 and 3). Keep the list compact after loading; detailed diagnostics should remain available through inspection rather than dominate each item.
2. **Selection indicator:** The selected item's background is fine. The arrow currently repeats on every rendered line (images 2 and 3). If retained, show it once per item, not once per line.
3. **Item spacing:** Add spacing around list items so adjacent items are easier to distinguish (images 1–3).
4. **Detail spacing and body background:** Add spacing around fields in ticket details (image 5) and receipt details (image 4). Give the actual ticket Markdown body its own background and padding, separate from metadata and receipt diagnostics (image 6).
5. **Initiative path copy:** Add a keymap in the initiative list to copy the selected initiative's file path, matching the existing ticket path-copy behavior. Make the keymap discoverable.

## Acceptance criteria

1. Receipt loading still works. Loaded receipt warnings do not expand ticket rows into walls of diagnostics; full diagnostics remain inspectable.
2. Selection retains its background. Any selection arrow appears at most once per selected item, including wrapped or multiline items.
3. List items have visible spacing around them.
4. Ticket and receipt detail fields have visible spacing. The ticket Markdown body has a separate background and padding.
5. The initiative list exposes a keymap that copies the selected initiative's canonical index.md file path, consistent with ticket path-copy behavior.
6. All six original screenshots remain linked from this task. Further user feedback can be appended here without losing earlier feedback.

## Screenshots

Screenshots are stored in the adjacent pi-shared-context-ux-07-feedback/ directory. Image numbers match the user's original attachments.

- **Image 1:** [Initial ticket list while receipts load](pi-shared-context-ux-07-feedback/01-ticket-list-loading.png).
- **Image 2:** [Loaded list overwhelmed by workflow diagnostics](pi-shared-context-ux-07-feedback/02-ticket-list-loaded-diagnostics.png).
- **Image 3:** [Repeated selection arrows and dense adjacent items](pi-shared-context-ux-07-feedback/03-ticket-list-selection-spacing.png).
- **Image 4:** [Receipt detail fields needing spacing](pi-shared-context-ux-07-feedback/04-receipt-detail.png).
- **Image 5:** [Ticket detail fields needing spacing](pi-shared-context-ux-07-feedback/05-ticket-detail.png).
- **Image 6:** [Ticket Markdown body needing a separate background and padding](pi-shared-context-ux-07-feedback/06-ticket-markdown-body.png).

## Verification

When implementing this feedback, exercise the actual Pi modal with receipt loading and loaded diagnostics, multiline selection, ticket and receipt details, and initiative path copy. Compare the changed screens with the supplied screenshots. Capturing this task does not verify those UI changes.

## Comments

### 2026-10-29 — User feedback capture

The user requested one shared-context feedback task, marked in progress, with all screenshots stored beside it. Keep this task available for additional feedback during the initiative. No implementation or completion is claimed.

