---
blocked_by: 
  - collect-evidence-feedback-04-viewer
id: collect-evidence-feedback-09-history
parent: collect-evidence-feedback
schema: tracker-ticket/v1
sequence: 9
title: Review historical evidence without rewriting it
triage: ready-for-agent
type: enhancement
work_status: claimed
---

# Review historical evidence without rewriting it

## What to build

Explicitly import an earlier evidence run for review and generate reports from the shared records without modifying the original.

Implement this complete slice. Follow the collect-evidence-feedback initiative and its common schema, command, storage, safety and testing rules.

## Acceptance criteria

- **Require an explicit** historical run selection. Create new versioned records and immutable feedback asset copies with source references. Do not silently migrate earlier evidence or feedback.
- **Preserve known capture** times, provenance and original media bytes. Mark the run as historical. Report unknown dates as unknown rather than using import time or file modification time.
- **Validate the selected** source format and refuse unsupported explicit versions. Do not invent assertion results from filenames, file existence or driver exit codes.
- **Make writing-reports consume** the common evidence records read-only. Do not introduce another capture model, annotation database or conflicting source of case results.
- **Check that reports,** feedback sessions and exports agree on case order, asset IDs, hashes and results. Verify that imports and repeated read-only reports leave earlier artifacts and saved feedback unchanged.
- **Publish the explicit-import** procedure and historical-label behaviour. Exercise a real earlier-run fixture through public commands and inspect the resulting browser view.

## Verification

Use the public workflow boundary approved in the initiative. Exercise the installed commands and the applicable HTTP, browser or native-driver surface. Use temporary resolved stores. Keep regression checks for consumer-visible failures. Do not prove behaviour from generated source text. Update affected documentation after verification.

## Specification coverage

This slice covers initiative user stories 24, 52, 54. Keep the initiative as the complete specification.

## Comments

No discussion has been recorded.


- **Review 2026-11-16T09:04:41.881Z: FAILURE.** Commit `710abe78428a93c4d22f2981d71614f598bf82f5`; tree `49c19b9e9e19178bb21d826ae558d460e9035221`. [Review artifact](../../workflows/collect-evidence-feedback-09-history/artifacts/reviews/review-review-0005.md).

- **Review 2026-11-16T09:32:17.569Z: FAILURE.** Commit `9f744831bc9a5edee5ab7a37aa2c089dd82fbf7f`; tree `00625a17e78c1b5728098f45a41c5ec7239c8cd7`. [Review artifact](../../workflows/collect-evidence-feedback-09-history/artifacts/reviews/review-review-0011.md).

- **Review 2026-11-16T21:41:09.376Z: FAILURE.** Commit `7b52145875c1935340592d4f82e63edc5c00b931`; tree `74491d21ffd2c4e2736a49928da06ef703d48502`. [Review artifact](../../workflows/collect-evidence-feedback-09-history/artifacts/reviews/review-review-0019.md).

- **Review 2026-11-17T06:11:33.271Z: FAILURE.** Commit `5e1ba904a178a7076aa556225beb4aff3288c65e`; tree `f691de272e6f2a040eb594438236000de451f40a`. [Review artifact](../../workflows/collect-evidence-feedback-09-history/artifacts/reviews/review-review-0025.md).
