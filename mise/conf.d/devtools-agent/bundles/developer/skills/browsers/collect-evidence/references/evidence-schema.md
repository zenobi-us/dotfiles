---
schema: collect-evidence/v1
kind: contract
---
# Common evidence contract

Every first-party JSON file and JSONL record uses schema collect-evidence/v1 and a kind. Owned Markdown has the same schema in frontmatter. Preserve tool-native bytes under native/.

| Kind | Authoritative content |
|---|---|
| run | Stable run ID, sealed status, actual collection interval, driver provenance, ordered cases and file inventory hashes. |
| plan | The authored typed Plan in data. Consumers do not execute the preserved plan.ts. |
| case | Stable case ID, purpose, preconditions, ordered steps, expectations, observations, assets, errors and limits. |
| asset | Stable capture ID, case and step references, increasing sequence, descriptive media path, actual SHA-256, dimensions, media type, capture time and driver provenance. |
| event | Ordered observations, assertionResult, captureStatus and registered asset references. |
| error | Explicit assertion, capture, blocked or operation failure. |

## Layout

A run has run.json, plan.ts, plan.json and index.md. Each cases/<id>/ directory has case.json, index.md, events.jsonl and media/. Asset and error records are embedded in case.json. Preserve native scripts, workflows, logs, original screenshots and recordings under native/.

Images use actual PNG bytes. WebM recordings have scope case and a sourcePath for the preserved native file. Duration, viewport and capture time can be null when the source did not record them. Do not substitute file modification time or import time. Asset hashes identify the exact source bytes.

## Results

Capture status is captured, failed or not-requested. Assertion results are passed, failed, not-run or not-applicable. Only an executed expect with assertionPassed true establishes a passing assertion. A captured image, process exit or successful cleanup is not an assertion.

PASS requires completed steps, executed passing assertions and image evidence. FAIL records an actual failure. BLOCKED identifies an unmet prerequisite or safety stop. PARTIAL records missing proof or human work. WARN remains an observation capability; it does not turn an assertion into a pass.

## Validation and immutability
A successful native screenshot result must retain its expected media reference. If that file is missing, collection stops before finalization with exit code 2. The incomplete staging directory and unchanged native run logs remain available for diagnosis. No sealed run is published.

Finalization builds privately, validates records and source assets, seals files and publishes without replacing another identity. The required Linux primitive is GNU /usr/bin/mv with exclusive no-copy support. A missing prerequisite blocks collection; no racy overwrite fallback applies.

Consumers reject unsupported schemas, missing or changed media, invalid PNG or WebM data, bad references and order, symlinks, writable sealed files and incomplete finalization. A rejected run is not rewritten or resealed. Validation and reporting are read-only.

Retries use new run IDs. Captures within a step increase their sequence without replacing earlier media. Titles can change without changing case IDs. Do not migrate earlier archives automatically. Explicit historical reuse preserves original bytes and provenance and must not claim to show the current application.
