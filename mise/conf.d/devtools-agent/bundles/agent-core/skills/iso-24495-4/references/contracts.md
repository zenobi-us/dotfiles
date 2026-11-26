# Plain-language assessment contracts

The iso-24495-4 skill owns these five record families. scripts/lib/contracts.ts validates content. contracts.json uses the shared manifest validator.

## Identity and historical detection

Current JSON uses exactly one identity: schemaVersion: <family>/v2. A schema field, a non-string identity, an unknown version, or a wrong family fails interpretation. Explicit v1 labels are not historical formats.

Each <family>/v1 denotes the existing unversioned shape, with neither identity field. The reader tests all five shapes below. Exactly one must match. Zero or multiple matches fail. Read-only scoring and reporting never rewrite these inputs.

Unknown authored properties remain allowed at every level. Conversion preserves them, array order, citations, and snapshot references. JSON must round-trip without numeric loss. Duplicate keys, negative zero, non-finite or rounded numbers fail the JSON reader. Contract validity is not ISO compliance or certification.

## Families and content

| Family | Required content and meaning | Producer and consumer |
| --- | --- | --- |
| plain-language-answers | dimensions is an object of dimension objects with Boolean criterion answers; optional organisation is a string | Human-authored answers or explicit conversion; score-maturity reads both versions |
| plain-language-findings | configHash string; files maps paths to objects with violations arrays; totals maps rule names to nonnegative safe integer counts | audit-corpus and audit-text produce v2; generate-report reads both versions |
| plain-language-evidence | artefacts maps categories to found Boolean and paths string array; found equals whether paths has entries | audit-evidence produces v2; generate-report reads both versions |
| plain-language-maturity | dimensions includes every MATURITY_MODEL dimension with integer level 0–4 and missing string array; overall is the weakest level | score-maturity produces v2; generate-report reads both versions |
| plain-language-audit-state | snapshots array of historical entries described below | generate-report produces and appends v2; reads both versions |

A finding has a nonempty rule string, positive safe integer line, and detail string. Totals must equal the per-rule counts of every recorded violation. Zero counts are allowed. Optional skipped is a string array. The text-audit producer always includes it, including unreadable and symlink selections. Report consumption does not remove it or rewrite the source.

Maturity missing criteria belong to the next level in the unchanged MATURITY_MODEL catalogue. At levels below four, at least one next criterion is missing. At four, missing is empty. Answers can omit dimensions and criteria; the scorer treats absent evidence as absent. Unknown Boolean criteria do not award levels. Evidence presence never proves evidence quality.

Snapshots have timestamp (a parseable date string), totals (nonnegative safe integer counts), and overall (integer 0–4). They have no independent identity. Existing entries retain all unknown fields and references. The state container can adopt v2 during an authorized append, but no historical entry is stamped, sorted, or rewritten independently.

## Operations and scope

All report inputs are validated before writing state or reports. Destinations must be distinct from consumed sources and each other. Consumed project configuration includes the acronym lexicon at <project-dir>/.iso-24495-4/acronyms.json for both audit-corpus and audit-text. Destination checks protect this lexicon through direct paths and filesystem aliases, including symlinked ancestors. Symlinks, hard links, non-files, and immutable history destinations are rejected before writes. Existing state is appended through shared safeUpgrade with the owning adapter. A concurrent state change rejects the append. A new state starts with v2. Rejected input or unsafe destination leaves input, state, and report bytes unchanged.

Ordinary Markdown reports, selected prose, external frontmatter, acronyms.json (an external string-array lexicon), tables, and prose references keep their existing formats. They are not assessment records. The selected text and its frontmatter stay read-only; --no-front-matter retains its existing reading behavior. English heuristics, scoring policy, provisional committee-draft limits, and human decisions are unchanged.

Read [the upgrade procedure](assessment-upgrade.md) before an authorized append or explicit conversion. Use [the current answers example](../assets/answers.example.json). The test fixtures retain unversioned inputs to exercise historical readers.
