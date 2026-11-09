---
title: Web evidence implementation blocked
type: Report
---

# Web evidence implementation blocked

## Ticket

[Preserve Surf and Playwright in collect-evidence](../../../../tracker/tickets/collect-evidence-feedback-01-web.md). The ticket remains claimed. This attempt is blocked, not implemented.

## Problem

The ticket requires both existing real browser drivers before the canonical skill cutover. Surf cannot connect to its native host at /tmp/surf.sock.

## Implementation

No product source changed. The browser-only skill, both drivers, all active callers, historical evidence, and the older hk recovery journal remain unchanged. No capture or evidence finalization ran. No tool was installed. No browser resource was created or closed. No credential was entered. No remote Git operation ran.

## Changed files

Only this workflow's blocked-result snapshot, preflight output, result event, manifest, and three projections are outputs of this attempt. The source branch remains at 859341b01ef7be474a3128b7f94772aab731c2f7, tree c34aa8898329be9caf9b345685c8cecafaeba57d.

## Real validation

All driver probes ran from /tmp through mise. Installed executables include surf, playwright-cli, and bun. playwright-cli --version returned 0.1.22.

mise exec -- bash -c 'command -v surf; command -v playwright-cli; command -v bun; surf doctor' exited 1. Surf reported an absent socket and ENOENT.

mise exec -- bash -c 'env -u SURF_SOCKET surf doctor --json; surf extension-path; surf tab.list' exited 1. With the override removed, doctor still selected /tmp/surf.sock and reported two failures. The extension path resolved. tab.list failed with Socket not found. Native messaging manifest and executable wrapper checks passed.

See [unaltered prerequisite output](surf-preflight-implementation-0002.txt). No screenshots or media references exist. Neither controlled-page workflow, assertions, nor cleanup was exercised. The existing suite was not run because preflight blocked source work. CLI presence is not proof that Playwright browser execution works.

## Limits and open questions

The required missing prerequisite is a running Surf-enabled browser with a connected native host. The documented recovery includes extension/native-host setup and browser restart. This attempt did not change that setup or restart borrowed browsers. After the operator restores the connection, resume through the parent workflow with a fresh receipt identity. Keep the old skill until both real driver workflows pass.

Domain and ADR review, all source implementation, common records and commands, public workflow checks, caller migration, and source commits remain unperformed. No formal review, submit, or finish phase ran.

## Provenance

Input: [start-0001](../../events/start-0001.yaml). Result: [implementation-0002](../../events/implementation-0002.yaml). Initiative: tracker/initiatives/collect-evidence-feedback/index.md. Child pane: w6Y:p2. Child run: 6c1ecb51-d05b-4e23-ad61-a82ed9d67489.

