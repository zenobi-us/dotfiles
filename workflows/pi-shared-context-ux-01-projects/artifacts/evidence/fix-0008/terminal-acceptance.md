---
title: Checkoutless project fix evidence
type: Concept
---

# Checkoutless project fix evidence

## Findings

SPEC-001 and SPEC-002 were the only blocking findings selected from review-0005. Both have ADR status NO ADR.

## Checks

| Check | Result | Evidence |
| --- | --- | --- |
| Extension and shared-context contracts | 120 pass, 0 fail | [Test log](focused-tests-final.txt) |
| Scoped TypeScript | Exit 0 | [Compiler log](scoped-typecheck.txt) |
| Checkoutless GitHub runtime | Canonical origin github.com/example/fix-smoke; issue 42 loaded through four substituted gh responses | [Runtime output](github-runtime.txt) |
| Actual Pi v1.1.0 | Removed current checkout; surviving shared records and restrictions remained usable | [Terminal protocol](terminal-protocol.json) |

## Actual terminal observations

The runtime used an isolated temporary repository, shared store, HOME and Pi configuration. It loaded the source extension directly. The session used --offline and --no-session. No model request ran.

The first runtime fixture lacked its tracker definition. The modal showed the missing-definition error. Creating the fixture definition and pressing R loaded the shared ticket. This was a fixture setup correction, not a source defect.

The modal opened the single current project through Projects. After the checkout was removed, Enter reopened the same cached project and displayed its surviving shared ticket. The header retained Repo because alignment remained repository-owned. The status explained that repository records were unavailable.

The ask-matt shortcut displayed No usable checkout and did not open a confirmation or replacement session. Files displayed the surviving shared root. Creating live-after-removal.txt appeared without a manual reload. Updating the shared ticket through mq also appeared without a manual reload. Esc returned to the deduplicated current entry.

| Surface | Evidence |
| --- | --- |
| Current tracker before removal | [120x40](120x40-before-removal.txt) |
| Disabled checkout-dependent action | [120x40 text](120x40-disabled-actions.txt), [capture](120x40-disabled-actions.svg) |
| Live tracker after removal | [120x40 text](120x40-live-tracker.txt), [capture](120x40-live-tracker.svg) |
| Shared Files after removal | [120x40](120x40-shared-files.txt) |
| Shared Files at 80x24 | [Text](80x24-shared-files.txt), [capture](80x24-shared-files.svg) |
| Shared Files at 40x12 | [Text](40x12-shared-files.txt), [capture](40x12-shared-files.svg) |
| Reachable current project | [Projects capture](120x40-deduplicated-current.txt) |

The launch set NO_COLOR=1. These checks prove the changed runtime paths, not a new full colour/monochrome audit. The initial implementation retains its complete terminal acceptance evidence.

## Regression coverage

The stored GitHub regression asserts the canonical origin, returned issue title and correct repository target. The complete live modal regression removes the current checkout after caching Files, then verifies surviving shared data, the unchanged Repo indicator, action restrictions, watcher updates and one current entry.

## Validation corrections and limits

The first combined test run returned 118 pass and 2 fail because the new GitHub fixture returned the wrong pagination shape and the migration fixture had conflicting instructions. The second returned 119 pass and 1 fail because its new modal readiness wait matched an old header. The corrected final suite returned 120 pass and 0 fail.

The broader bundle typecheck has known unrelated failures and was not repeated. The language server could not initialize its TypeScript installation. The scoped TypeScript compiler succeeded.

Older stored projects without .context-project.json retain local record reads. Shared initialization or route migration records the real remote while a checkout is available. The resolver never invents a remote from a slug. The current project can also use its authoritative in-session origin if an older store lacks metadata.

## Executed probes

- **Fixture setup:** [projects-fix-setup.ts](projects-fix-setup.ts).
- **GitHub probe:** [projects-fix-github.ts](projects-fix-github.ts).
- **Commands and results:** [validation.json](validation.json).

This workflow directory is a receipt store, not an OKF bundle. Each generated Markdown document is validated independently. A bundle-wide OKF check does not apply.

