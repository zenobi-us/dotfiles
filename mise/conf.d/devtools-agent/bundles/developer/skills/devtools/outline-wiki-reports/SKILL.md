---
name: outline-wiki-reports
description: Creates, structures, and updates evidence reports in Outline Wiki through its API. Use for QA results, acceptance evidence, audits, migrations, bug reproductions, and report hand-offs. Produces a verified document with linked checks, durable attachments, explicit coverage gaps, and revision-guarded updates.
---

# Outline Wiki reports

A report records what happened, shows the evidence, and names what was not covered.
Use Outline-native Markdown and attachments. Do not copy HTML, CSS, BEM classes, or lightbox scripts from an HTML report.

## When to use

Use for creating or updating QA, acceptance, audit, migration, and bug reproduction reports in Outline through its API.
Do not use for plans, meeting notes, general wiki administration, or public-sharing administration.
Use the same evidence standards as the writing-reports skill, but not its HTML generator or validator.

## Required rules

- **Evidence first:** A Pass needs an executed check and evidence. Code inspection alone is not a Pass. UI checks need screenshots; API and CLI checks need usable requests, responses, or output.
- **Fixed results:** Use only Pass, Fail, Info, and Warn. Unrun or untestable checks are Info. Warn means an unrelated bug, not an unrun check.
- **Visible gaps:** Always include Not covered, even when no known gaps remain. State the risk of each gap.
- **Stable identity:** Use one document per report and stable check IDs such as C01. Use document IDs for updates; title matches are discovery only.
- **Safe updates:** Preserve human edits and prior observations. Use lastRevision where supported. Never force a stale replacement after a 409.
- **Private by default:** Create a draft. Publish only when the request authorises publication to the resolved collection. Publishing and public sharing are different actions. Never create a public share or widen access implicitly.
- **Durable evidence:** Upload local images and companion artifacts. Never publish local paths, expiring signed upload URLs, tokens, or storage credentials.
- **Purposeful blocks:** Read the native-block reference before composing sections. Prefer useful supported blocks, but keep verdicts, blockers, coverage gaps, and cleanup actions visible. Editor availability is not API compatibility.
- **Truthful completion:** A successful HTTP write is not proof of a complete report. Verify saved content, rendering, and evidence access before calling it done.

## Workflow

1. Resolve the configured Outline URL, credential source, intended audience, collection, and optional parent. Use existing configuration before asking for missing inputs. Confirm workspace identity with auth.info.
2. Read [report structure](references/report-structure.md) and [native block selection](references/native-blocks.md). Choose blocks for their report purpose and check deployment-specific encoding before using it. Start from [the template](assets/report-template.md); use [the example](examples/acceptance-report.md) for the finished shape.
3. Read [API contract](references/api-contract.md) before requests. Check compatibility with the deployed Outline version; do not assume current upstream features exist there.
4. For new reports, follow [create and publish](references/create-and-publish.md). For existing reports, follow [update and conflicts](references/update-and-conflicts.md).
5. For each image or file, follow [attachments and access](references/attachments-and-access.md). Upload the actual bytes before referencing the attachment.
6. Complete [verification](references/verification.md). Return the document URL, ID, revision, publication state, changed checks, and any remaining limits.

All linked paths are relative to this installed skill directory, not the working repository. Resolve the directory from the loaded SKILL.md location.

## Quick reference

| Task | Method or rule |
|---|---|
| Confirm workspace | auth.info |
| Read a known report | documents.info with id |
| Discover a destination | collections.list, documents.search; paginate |
| Choose section blocks | Native-block selection matrix; verify custom encodings before use |
| Create a draft | documents.create with publish: false |
| Upload evidence | attachments.create, then returned POST or PUT upload |
| Update safely | documents.update with lastRevision and explicit editMode |
| Publish a draft | documents.update with publish: true, after authorisation |
| Conflict | 409: fetch, reconcile, validate, then use the new revision |
| Ambiguous write | Reconcile remote state before repeating the mutation |

## Common mistakes and red flags

| Shortcut or rationalisation | Required response |
|---|---|
| “The code looks right; mark Pass.” | Info until an executed check supplies proof |
| “The release is urgent; replace everything.” | Preserve human edits and use a revision guard |
| “The upload record exists; the image is done.” | Complete the storage upload and verify retrieval |
| “Reviewers need access; make it public.” | Check the authorised audience without widening access |
| “The create timed out; create it again.” | Reconcile by recorded ID and run identity first |
| “No known bugs means no gaps.” | Keep Not covered and state actual scope limits |

## Completion gate

The linked summary, evidence sections, Not covered, cleanup state, and update history agree.
Attachments render and companion files open for the intended audience.
Remote content matches the intended revision without lost human edits.
Publication state matches the request. Any verification limit is explicit.
See [authoring validation](references/authoring-validation.md) for the skill's behavioural checks and deployment limits.
