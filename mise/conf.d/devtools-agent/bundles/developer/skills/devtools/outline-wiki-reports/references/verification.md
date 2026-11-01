# Verification

## Before writing

- **Content:** Every summary row has a stable check ID and corresponding evidence section. Verdicts match the evidence and the fixed vocabulary. Replace every template marker before writing; no REPLACE_WITH field or example.invalid evidence URL may remain in a real report.
- **Gaps:** Not covered is present and names risks. Test data left behind states cleanup actions or None.
- **Artifacts:** Every intended attachment has a source, safe content, correct MIME type and byte size. No local paths or signing credentials appear in the body.
- **History:** Retests and corrections preserve earlier observations and their dates. Observation time is distinct from document update time.

## Block checks

Use the [native block compatibility procedure](native-blocks.md) before introducing a deployment-specific encoding. Record the deployed version and evidence level, not merely the command name.
Check that create/read/update preserves the intended block and content, and that rendering and interactions work. Do not flatten an existing human block silently.
Verify that warning notice styling did not change a Fail verdict to Warn, that no essential finding or gap is collapsed, and that checklist state has observed support.
Check fixed historical timestamps, math values and units, diagram meaning, video alternatives, PDF download links, and template values when those forms are used.
If native rendering cannot be established, use the documented plain alternative and report the limitation.

## After writing

1. Call documents.info by ID. Check saved text, revision, location, and publication state against the intended outcome. Account for Markdown normalisation without ignoring lost content.
2. Confirm unrelated human content remains. Ensure summary results, evidence sections, gaps, and history agree.
3. Open the actual Outline document with an available authenticated browser. Use the applicable browser skill. Check table readability and native rendering.
4. Click every summary link and confirm its target. Check images, alternative text, captions, and companion-file downloads. Inspect narrow-screen layout when tables or evidence are wide.
5. For published reports, verify access with an already-authorised intended reader when available. Author access alone does not prove reviewer access.
6. Close browser resources. Return a concise receipt.

## Receipt

Report URL, document ID, saved revision, draft or published state, changed check IDs, uploaded evidence, verification performed, and remaining risks.
Name leftover test data and incomplete uploads by safe identifiers. Never include tokens or signed upload URLs.

## Missing verification prerequisites

If no live API credential exists, validate the skill or local content only. Do not claim a remote draft, upload, or publication succeeded.
If authenticated browser access is unavailable, verify reachable API content and attachments, but explicitly state that rendering and heading links remain unverified.
If no intended-reader account exists, name that access-verification limit. Do not claim reviewer access was proved.
A partial report may remain a draft; never call it a completed verified report while these required checks remain unresolved.
