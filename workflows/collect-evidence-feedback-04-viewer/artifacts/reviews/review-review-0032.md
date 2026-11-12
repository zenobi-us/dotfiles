---
schema: worktree-artifact/v1
title: Independent viewer review attempt 5
type: Concept
---

# Independent viewer review attempt 5

Review the complete frozen viewer change for the workflow owner.

Reader: parent session hc:t8h. Date: 2026-11-12T09:55:25.187Z.

## Overview

Verdict: FAILURE. Standards has one blocking P2 finding, STD-001. Spec has no findings.

Fresh public import creates empty Markdown records and still passes validation. Preserve Markdown content before approval. No fixes or merge are authorized.

## Scope

Ticket: tracker/tickets/collect-evidence-feedback-04-viewer.md (local-markdown).
Initiative: tracker/initiatives/collect-evidence-feedback/index.md.
Branch: feature/collect-evidence-feedback-04-viewer. Base: master, resolved ed54c37db20dc62911fb019f4c2776f9b8bb77d9.
Frozen commit: 86535914fad9d152835049a5374284a772449281.
Frozen tree: ce207d4d61add19ebb49181932bfa769a184672a.
Comparison: git diff master...86535914fad9d152835049a5374284a772449281.

Reviewed all 208 changed files by inventory and applicable source or record boundaries, not only the latest typography fix. Scope includes product source, bundled HTML, plugin registrations, public regression and retained workflow proof. The comparison contains five commits: c4b48e60, 035fdd61, 4242a96d, 9f983400 and 86535914.

Read DESIGN.md, CONTEXT-MAP.md, CONTEXT.md, domain configuration, ADR index, ticket, initiative, authoritative review-start-0031 and review-approval-0030. Read fix-0028, fix-complete-0029, pr-draft-fix-0028 and all four prior review artifacts. The sole listed ADR concerns the unrelated Pi Ink cleanup trust boundary.

Workflow and evidence routes resolve against the parent base repository. Source-worktree workflow copies are not authoritative. The inspector accepted the graph and returned review/retry for the active phase start. This child completed that assigned phase; it did not launch a replacement phase.

## Standards

Standards: one blocking P2 finding, STD-001. The imported human-readable feedback records are empty and omit the required schema frontmatter. Evidence: retained session/index.md and cases/case-1/notes.md each measure one byte; mq returns no content for either. The shared writer selects -I raw with -F text at records.ts:152.

Reviewed the pinned master...86535914fad9d152835049a5374284a772449281 change scope, maintained source, command and HTTP boundaries, frontend components and distribution, documentation, workflow receipts, and retained proof records. DESIGN.md and the initiative supply the relevant standards. The ADR index contains no decision applicable to this viewer.

Baseline smells remain judgment calls. Repetition in copied sealed evidence and vendored Base Nova components follows explicit preservation and distribution requirements; it is not a blocking duplication finding. No additional blocking smell was established.

Read-only review. No source or workflow state was edited. Builds, tests, formatters and runtime validation were not run, as instructed. Recorded browser and test results are prior implementation evidence, not independent runtime verification.

### STD-001 — P2, blocking

NO ADR: initiative decisions 20 and 22 govern feedback Markdown records. No viewer ADR applies.

**Location:** [records.ts:152–155](file:///run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-04-viewer/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/records.ts#L152-L155).

**Rule:** Decision 20 requires collect-feedback/v1 frontmatter on owned Markdown. Decision 22 requires human-readable case notes.

**Description:** The Markdown writer uses raw input with text output. The retained session/index.md and cases/case-1/notes.md each contain only one byte, and reading both through mq returns no content. Thus session imports discard the supplied headings, notes and collect-feedback/v1 frontmatter. This breaches tracker/initiatives/collect-evidence-feedback/index.md, Implementation Decisions 20 (owned Markdown records must carry the feedback schema) and 22 (human-readable case notes). The current validator still accepts these sessions because it checks JSON and media only.

**Required change:** Preserve raw Markdown bytes when generating session/index.md and case notes, including schema frontmatter and supplied content. Add a public init regression that checks the generated human-readable records. Preserve existing immutable proof artifacts; capture new proof after the fix.

**Validation command:** Run the installed collect-feedback init command against a sealed run and a new temporary resolved session. Read the returned session/index.md and cases/<id>/notes.md using mise exec -- mq --allow-http-import --lockfile /tmp/review-axis-mq.lock -I raw -F raw 'import "github.com/harehare/okf.mq" | .' <paths>. Confirm schema: collect-feedback/v1, headings and notes are present. Then run mise exec -- bun test mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/workflow.test.ts.

**Independent reproduction:** Public init from /tmp imported a retained sealed run into a fresh temporary repository route. It exited 0. The new session/index.md and cases/case-1/notes.md each measured one byte. Reading both through mq returned no content. Public validate then exited 0. Thus this is a current import failure, not only stale evidence.

This blocks completion because imported feedback sessions omit the required human-readable records and schema frontmatter.

The prior Back-control typography issue is resolved. Both controls render at 13px in desktop and narrow Chromium views. The earlier originating-asset focus and plain-output fixes also passed current checks.

## Spec

No evidence-backed blocking Spec findings. Reviewed the full master...86535914fad9d152835049a5374284a772449281 change scope against tracker/tickets/collect-evidence-feedback-04-viewer.md and the initiative's applicable common contracts.

The implementation covers sealed-run import, existing evidence-route resolution, separate immutable media copies, source identities and capture times, session validation, registered read APIs, one loopback server, exclusive session locking, explicit ports, bounded requests, Host/Origin checks, and path/symlink rejection. The maintained React interface uses Base Nova components and bundles its scripts, styles and font weights before serving. Inspector columns preserve narrow-screen horizontal navigation. Documentation identifies the viewer as read-only.

Scope judgment: annotation handlers, write tokens, export, historical labels and draft recovery belong to later tickets. Their absence does not block this browse-only slice. Existing video playback does not claim new capture or annotation support. No unrelated application features were added.

Reviewed the committed public-workflow regression and retained browser, hash and cleanup evidence. These records report successful checks; I did not rerun builds, tests, formatters or browser validation, as instructed. Runtime validation remains with the parent. No source or workflow state was changed. The ADR index contains no decision applicable to this slice.

The independent Spec axis reported no findings. STD-001 remains on the Standards axis; the shared record requirements cited there still block approval.

## Validation

- **Public regression passed:** mise exec -- env PLAYWRIGHT_MCP_EXECUTABLE_PATH=/home/zenobius/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome bun test mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/workflow.test.ts. Ran once after research: 1 pass, 0 fail, 58 assertions.
- **CLI formats passed:** Absolute installed collect-feedback.ts validate on a disposable session copy from /tmp. Plain and JSON returned valid results; quiet returned no stdout. Help listed init, validate and serve. JSON version returned collect-feedback/v1 and version 1.0.0.
- **Real viewer passed:** Absolute collect-feedback.ts serve /tmp/review-0032-session --port 18832 --json. Chromium displayed the distributed page at 1440x900 and a 390x844 CSS viewport. Body and controls were 13px. Both bundled JetBrains Mono weights loaded. No external script or stylesheet URLs were present.
- **Layout and focus passed:** Independent column bodies used overflow-y:auto. Case and asset columns scrolled independently. Narrow navigation revealed the asset column horizontally. Back and ArrowLeft returned focus to the second asset button. The narrow case column returned to left 0 with finder scrollLeft 390. Keyboard focus used a 2px primary outline and 3px offset.
- **Original bytes passed:** Registered HTTP bytes matched the immutable copy and SHA-256 9c3004a6ec3b9f0f72f4055016202e553c17d69ea5a60cbec6e0876839811449. The browser decoded 1280x720 pixels with filter:none and object-fit:contain. Screenshots showed the original browser capture without crop or recolouring.
- **Safety checks passed:** Wrong Host and Origin returned 403. Unregistered asset and source-file route returned 404. Encoded unsafe asset path returned 400. POST returned 405; oversized body returned 413. A second writer exited 3. Changed, symlinked and missing media returned 409; changed-media validation exited 2.
- **Serve lifecycle passed:** Busy port returned exit 1 without a retained lock or fallback. Direct serve.ts emitted plain readiness and served session HTTP 200. Both owned servers exited 0 on SIGTERM and released their writer locks.
- **STD-001 reproduced:** Fresh public init exited 0, created one-byte index and notes files, and public validate exited 0. mq inspection returned blank content for both files.
- **Source preserved:** Final git status --porcelain was empty. HEAD and tree remained the frozen identities. No build, formatter, source edit, commit, tracker update, projection update or merge ran.

Both independent review children delivered source-bound review-axis/v1 results. Result-delivery verified their schemas, run identities and hashes. Both native completion signals reached sequence 2; both results were acknowledged before removing only their terminals.

Standards: c1eade99-4bb7-45f9-9e48-8dcdb9e19ab2, terminal t8m, hash 1620b76b6eda14ee94cb44009cc1c2d5cdc21c6006cbee2a3d8efe2cceff5431.
Spec: 217d01a0-a523-4468-a8c3-28ff7f41d173, terminal t8k, hash 49ec6664c75858af35dc58e130136725e7bb91b886ec6c8ca720d74092f3d585.

The owned browser tab, servers, copied session and temporary import repository were removed. Removing immutable fixture directories first required restoring owner write permission. Original evidence stayed unchanged. Screenshots were temporary observations; no new evidence run is claimed.

## Next action

Parent validates review-0032 and this artifact, then records phase completion. Request fix authorization for STD-001 before changing source. Parent owns tracker publication and projections. Annotation editing, drafts, export and historical labelling remain outside this slice.

Standards: 1 P2 finding; worst issue is missing imported Markdown records. Spec: 0 findings.
