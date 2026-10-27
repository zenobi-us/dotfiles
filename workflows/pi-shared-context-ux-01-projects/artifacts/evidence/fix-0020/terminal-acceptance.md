---
title: Projects filtering terminal acceptance
type: Concept
---

# Projects terminal acceptance

## Runtime

Actual Pi v1.1.0 ran through termscope. It loaded the source-worktree extension through `-e`, with an isolated HOME and disposable local Git/context fixtures. No model request or live-service request ran.

## Observed behavior

| Scenario | Result | Evidence |
| --- | --- | --- |
| `/shared-context`, then tracker-root Escape | Projects opened with 2/2 projects | [Protocol](pi-runtime.json) |
| Type `qybd12` | Active query stayed visible; 2/2 origins matched the subsequence; q, 1 and 2 remained input | [Query](pi-name-filter.txt) |
| Append `zzzz` | 0/2 and a clear no-results message | [Zero results](pi-zero-results.txt) |
| Enter with zero results | Projects remained open; no stale target opened | [Zero-result Enter](pi-zero-enter.txt) |
| Ctrl+U; type `filterbta` | 1/2 and selected beta identity | [Identity match](pi-identity-filter-final.txt) |
| Enter | Shared beta tracker displayed beta filter target; Pi footer retained alpha session directory | [Selected target](pi-filtered-target.txt) |
| Reopen Projects; type q; Tab; Escape | Modal closed with active query and breadcrumb focus | [Escape](pi-escape-close.txt) |

## Terminal bounds and visual limits

Captures cover 120x40, 80x24 and 40x12. The count, query and selected project remain visible at each size. At 40x12, long names, identities and key hints truncate within the modal. This is not a full tracker layout audit.

[120x40 requested colour](pi-colour-120x40.svg), [80x24 requested colour](pi-colour-80x24.svg), [40x12 requested colour](pi-colour-40x12.svg), [80x24 monochrome](pi-mono-80x24.svg), and [40x12 monochrome](pi-mono-40x12.svg) preserve the captures. FORCE_COLOR=1 and NO_COLOR=1 were requested in separate launches. Both produced monochrome SVG captures. No colour/contrast audit is claimed. SVG font metrics differ from terminal cell metrics.

The existing host shortcut conflict appeared at startup. It did not prevent the Projects flow. No shortcut configuration changed.

## Harness corrections

The first identity query btaqybd12 legitimately matched both origins through different subsequences. The corrected unique query filterbta selected beta. The initial compiler command pointed at nonexistent root TypeScript; the package-relative command passed. One resized-session shutdown wait timed out; explicit termscope close returned exit 0. See [exact validation commands](validation.json) and [all terminal interactions](pi-runtime-all.json).
