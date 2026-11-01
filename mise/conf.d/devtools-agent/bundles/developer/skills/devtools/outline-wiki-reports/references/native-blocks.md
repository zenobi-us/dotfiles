# Native blocks for evidence reports

Choose a block because it helps the reader review evidence or act. Do not use every available block.
Use tables for comparable results, lists for actions, and diagrams only for genuine flow, sequence, state, or dependencies.
Keep one authoritative presentation per fact; a diagram must not repeat the same comparison table.

## Evidence and compatibility boundary

The deployed browser assets at outline.gameserver.home.arpa exposed the inventory below during read-only inspection on 2026-11-01:

- **Menu definitions:** [extensions.zj5cik46.js](http://outline.gameserver.home.arpa/static/assets/extensions.zj5cik46.js).
- **Labels and integrations:** [Editor.B9X2Jk4x.js](http://outline.gameserver.home.arpa/static/assets/Editor.B9X2Jk4x.js).

These are deployment observations, not a permanent API contract. Asset filenames change after upgrades.
The inspection used unauthenticated HTTP; HTTPS refused the connection. No credentials were sent. Do not copy this HTTP origin into credentialed publishing configuration implicitly.
No authenticated API round trip or rendered block was verified in that inspection.
Re-discover current assets and deployed version when the instance changes; do not treat these historical URLs as permanent dependencies.

Menu presence proves an editor offers a command, not that documents.create or documents.update accepts a particular Markdown encoding.
Do not invent notice fences, toggle syntax, HTML details tags, JSON node payloads, or embed endpoints.
For ordinary Markdown, use the report's existing supported forms. Before introducing any deployment-specific block encoding:

1. Inspect the matching deployed serializer/parser or an authorised existing example. Record the encoding source and deployment version.
2. If authorised, exercise the encoding in a disposable draft with harmless content through create, read, and update. Preserve the same block and text after the update.
3. Inspect the actual rendering, disclosure interaction, links, and reader access. For a draft, verify author rendering now and intended-reader access after authorised publication.
4. Record the result as editor-discovered, API-roundtrip-verified, rendered-verified, or reader-access-verified. Do not promote a weaker observation into a stronger claim.
5. If any required check is unavailable, use the plain Markdown or durable-attachment alternative below and name the limit. A different appearance is acceptable; lost meaning is not.

Never create a scratch document, publish it, or alter a real report just to probe syntax without authority for that write.
Do not silently change an unrelated human-authored block when updating a document. If its encoding is not preserved, stop that replacement and resolve compatibility.

## Choose blocks by report section

| Section or content | Preferred native form when supported | Selection rule and safe alternative |
|---|---|---|
| Context and scope | Headings and ordinary paragraphs; info notice for an important scope constraint | Keep owner, environment, version, and literal observation timestamp visible. Use plain labelled text if notice encoding is unverified. |
| Result summary | Table with linked stable check IDs and explicit result words | One row per check. Do not replace the result table with notices or decorative cards. |
| Evidence sections | H2 per check; H3/H4 for genuine subsections | The menu provides heading levels 1–4. Outline's document title remains the title; do not add a duplicate body H1. |
| UI proof | Image with descriptive alternative text and separate proof caption | Prefer the captured image over a screenshot of prose. Use a durable uploaded reference, not a local or signed URL. |
| API or CLI proof | Short language-labelled code block plus complete redacted file attachment | Preserve exact commands, requests, errors, and output. A large log belongs in Companion artifacts, with the decisive excerpt visible. |
| Supplementary diagnostics | Toggle block for optional supporting detail | Only collapse material the reviewer may skip. Keep verdicts, decisive proof, blocking findings, gaps, and cleanup actions expanded. Alternative: a labelled subsection and linked artifact. |
| Blocking finding or serious risk | Warning notice plus visible impact, owner, and follow-up | Warning is the notice style, not the result. A failed check stays Fail, not Warn. Alternative: a bold Blocking finding label and plain paragraphs. |
| Completed verification highlight | Success notice when it adds useful emphasis | Only for completed, evidenced success; never imply all checks passed when some are Info or Fail. Keep result words in the summary. Alternative: an explicit proven result in prose. |
| Neutral observation or coverage limit | Info notice | Keep Not covered as a visible required section with explicit risks. Do not hide it inside a toggle or substitute a notice for the section. |
| Optional reviewer guidance | Tip notice | Use for a useful rerun hint, not a blocker, verdict, or required cleanup action. Alternative: a short labelled paragraph. |
| Cleanup and follow-up actions | Todo checklist with owner and action | Unchecked means pending. Checked means observed complete, not merely assigned. Keep the section visible; checklist state is not a test verdict. Use plain action bullets if checklist support is unavailable. |
| Ordered reproduction steps | Ordered list | Keep prerequisites and expected/observed results separate. Use bullets for unordered observations. |
| Exact quoted evidence | Quote block | Quote the source faithfully and identify it. Do not style an unverified claim as proof merely by quoting it. |
| Timing or dependency explanation | Mermaid sequence/flow diagram; Diagrams.net only when manual layout is needed | A diagram explains the observed structure; it is not new evidence. Keep source artifacts and use a concise text sequence if rendering is unavailable. |
| Motion-dependent UI proof | Uploaded video with time-specific caption and accessible transcript or key frames | Verify playback or download for the reader. Keep the decisive state or textual description available without video playback. |
| PDF evidence | PDF attachment with preview when useful | Always keep a durable file link. Do not convert the report itself to a PDF just to obtain a preview. |
| Companion artifacts | File attachments with descriptive links | Upload the reader's copy. Preview is optional; access to the original file is required. |
| Technical calculation | LaTeX math block for a genuinely complex expression | Include source measurements, units, denominator, and computed result. Use inline code or prose for a simple ratio; pretty math does not validate arithmetic. |
| Update history | Literal timestamps with timezone and dated text | Current date/time insertions are authoring conveniences only. Verify that their saved values are fixed; never replace historical observation times with now. |
| Printed hand-off | Page break only for a verified print requirement | Do not add print breaks to an ordinary online report. Divider may separate large groups but must not replace headings. |
| Repeated report authoring | Approved workspace or collection template | Inspect it first, preserve required report sections, and remove stale values. A template is not evidence and does not establish a current Pass. |

## Editor identifiers and variants

These identifiers describe the observed editor, not JSON accepted by the documents API.

| Command family | Observed editor node or attributes |
|---|---|
| Headings | heading, level 1–4 |
| Lists | bullet_list, ordered_list, checkbox_list |
| Media and attachments | image, video, attachment; PDF uses preview: true and application/pdf |
| Table and quote | table, blockquote |
| Code and math | code_block, math_block |
| Toggle | container_toggle |
| Notices | container_notice, style info / success / warning / tip |
| Divider and page break | hr; page-break menu sets markup to *** |
| Date/time commands | date, time, datetime |
| Mermaid | code_block with language mermaid |
| Diagrams.net | editDiagram command, not a guaranteed document node |

The menu removes Diagrams.net in Electron. Embed providers depend on loaded integrations and user-disabled settings.
Templates appear only when suitable workspace or collection templates exist. Do not claim any provider or template is enabled without inspecting the authenticated context.
No standalone table-of-contents block was established by this inventory. Use actual rendered heading links and Outline navigation; do not invent a TOC widget.

## Failure patterns

| Shortcut | Counter |
|---|---|
| The slash menu has it, so the API accepts it | Establish encoding, round trip, and rendering separately |
| Warning notice means Warn result | Keep notice styling independent of Pass / Fail / Info / Warn |
| Hide messy gaps and blockers in toggles | Keep review-critical content expanded |
| Use current date for every observation | Preserve literal historical timestamps and timezone |
| Make the report impressive with every block | Use the smallest form that improves review or action |
| Include a template's checked tasks | Clear stale state; completion requires observed evidence |
