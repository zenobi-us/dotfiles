---
title: Projects terminal acceptance
type: Concept
---

# Terminal acceptance

Ticket: `tracker/tickets/pi-shared-context-ux-01-projects.md`

Source commit: `afb6b874f70afb2035ed76288140daf1ff589691`
Source tree: `bc8acd4597834dc04cb5169bdf93be44db95ab32`

Actual runtime: Pi v1.1.0 under termscope. The runtime loaded the source extension with explicit ask-matt and worktree skills. It used isolated repository and shared stores. No model request or worktree command ran.

## Surface checks

| Size | Colour evidence | Monochrome evidence | Observation |
| --- | --- | --- | --- |
| 40x12 | [Projects](40x12-projects-final-colour.txt) | [Projects](40x12-projects-monochrome-final.txt) | Selected project, stable identity, storage, and Enter/Esc controls remain visible. Arrow keys reach the other project. |
| 80x24 | [Projects](80x24-projects-colour-final.txt) | [Projects](80x24-projects-monochrome-final.txt) | Both project identities remain distinct. Focus and selection use text markers. |
| 120x40 | [Projects](120x40-projects-final-colour.txt) | [Projects](120x40-projects-monochrome-final.txt) | Both projects and full navigation hints remain visible. |

Each linked text capture has a sibling SVG. These are actual terminal captures, not renderer test output. Colour [span metadata](80x24-projects-colour-final.spans.txt) records distinct border and accent colours. The monochrome runtime used a temporary grey theme. [Monochrome spans](monochrome-span-metadata.json) retain textual focus and selection meaning.

## Interaction checks

- **Keyboard focus:** Shift+Tab reaches Projects. Enter opens its project list. Tab returns forward. [Focused breadcrumb](80x24-monochrome-focus-final.txt).
- **Mouse breadcrumb:** A left-button SGR press/release at the rendered breadcrumb opened Projects in the actual Pi modal. The capture [shows the resulting list](120x40-projects-final-colour.txt).
- **Project ownership:** Selecting the other stored project displayed its ticket, Shared alignment indicator, and shared Files directory. The Pi footer retained the initial repository directory.
- **Files independence:** [Current Files](80x24-current-files-independent-confirmed.txt) remained at its own root. [Return to the stored project](80x24-files-state-restored-confirmed.txt) restored its selected notes file and preview.
- **Checkout safety:** [Narrow disabled actions](40x12-disabled-actions-final-colour.txt) and [monochrome disabled actions](120x40-monochrome-disabled-actions-final.txt) display the missing-checkout reason. The modal did not dispatch an action for that project.
- **Current actions:** [Current-project actions](80x24-current-actions-final.txt) preserve available commands and workflow restrictions. [Confirmation](80x24-current-action-confirmation.txt) identifies the current ticket.
- **Fresh chat:** Initial acceptance exposed a stale parent context after newSession. The fix uses withSession. [Final proof](120x40-fresh-chat-success-final.txt) shows the selected command data and return-session data in the new editor, unsent.
- **Escape behavior:** Esc at the tracker root opens Projects. Esc at Projects [closes the modal](80x24-projects-escape-closed-final.txt). Files keeps its existing close behavior.
- **Session invariants:** [Before](session-before.json) and [after](session-after.json) records have the same directory, effective system-prompt SHA-256, and ephemeral session-file value. A temporary read-only observer collected these records around project selection.

## Failure checks

- **Empty store:** [Empty project store](80x24-empty-project-store-final.txt) explains that no stored projects exist and keeps the current project selectable.
- **Unreadable store:** [Unreadable project store](80x24-unreadable-project-store-final.txt) shows the permission failure and keeps the current project selectable.
- **Unavailable project:** [Unavailable selection](80x24-unavailable-selected-project-final.txt) shows its route-read failure without opening the previous project's records as the new project.

## Limits and existing behavior

The isolated runtime had no model credentials. This did not prevent modal interaction or fresh-chat staging. No command was sent to a model.
The host reported an existing ctrl+shift+g shortcut conflict. The changed breadcrumb and workspace controls worked.
At 40x12, the existing tracker ticket-row prefix still clips long titles. That row redesign belongs to later UX tickets. Projects keeps the selected identity and essential controls visible.
Earlier captures and failed compiler attempts remain diagnostic history. Files named final or confirmed in this report identify the accepted observations. The initially misnamed fresh-chat-unsent-action capture contains the stale-context failure, not successful staging.

