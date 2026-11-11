---
schema: collect-evidence/v1
kind: plan
---
# Manual test plan — native

Steps for a person to follow in the approved private terminal. Written before collection,
and generated from `plan.ts`; edit the plan, not this file. The same steps were
driven with `tui`, which is how the evidence was captured.

## Environment

- Surface: `terminal://private`
- Command: `["/var/home/zenobius/.local/share/mise/installs/bun/1.4.3/bin/bun","/tmp/ce-fix-0023-lu0flE/credential-2-expect.ts"]`
- Working directory: `/tmp/ce-fix-0023-lu0flE`
- Terminal: 80 × 24; monospace:size=12; line height 20px
- Approved input steps: None

## Preconditions

None declared.

## Test case — Credential safety and delayed native transition

1. Inspect ready.

**PASS:** Expected outcome
**FAIL:** Unexpected outcome
