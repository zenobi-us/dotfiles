# Outline API contract

## Sources and version boundary

Checked against the official [API documentation](https://www.getoutline.com/developers) and [OpenAPI schema](https://github.com/outline/openapi/blob/main/spec3.yml) on 2026-11-01.
These describe upstream, not a guarantee about a self-hosted deployment. Inspect the deployed version and its matching schema before using optional features.
Do not probe feature support with a destructive write to a real report.

## Connection and secrets

Use configured OUTLINE_URL as the instance origin and OUTLINE_API_KEY as the secret source, or reuse the repository's existing credential convention.
Require HTTPS unless an explicitly authorised local development instance uses HTTP.
Use POST to the instance's /api/:method with JSON, Accept: application/json, Content-Type: application/json, and Authorization: Bearer followed by the API token.
Keep the API token in memory or the configured secret store. Do not print headers, dump environment variables, or put tokens in command arguments or report content.
Use only the configured API origin for authenticated API calls. Validate pagination destinations before following them.

Require both a successful HTTP status and a successful API response; inspect ok and error where provided. Storage uploads have a separate response contract.
Record method, status, document or attachment ID, and a sanitised diagnostic, not full sensitive payloads.
On 401 or 403, fix authentication or permissions; do not repeat writes or broaden access.
On 429, honour Retry-After. After connection loss or a timeout on a mutation, reconcile state before retrying.
Paginate discovery until the destination is identified or the available results are exhausted. Do not equate a missing first-page result with absence.

## Payloads and returned state

| Method | Payload and state to use |
|---|---|
| auth.info | Empty object; confirm returned user and workspace identity |
| collections.list | limit and offset; inspect destination and available policies |
| documents.search | query plus supported filters and pagination; inspect candidate IDs and location |
| documents.info | id; read data.id, text, revision, url, publishedAt, collectionId, parentDocumentId |
| documents.create | title, text, collectionId or parentDocumentId, publish: false; record returned ID, URL and revision |
| documents.update | id, lastRevision, and changed fields only; explicit editMode: replace when replacing text |
| attachments.create | documentId, name, contentType, actual byte size; inspect data.mode, upload instructions, and attachment |

A draft's publishedAt is empty; verify the actual returned state rather than assuming a flag succeeded.
Resolve relative document URLs against the configured instance origin.
Upstream supports an optional UUID id on documents.create. When supported, generate and record it before creation to reconcile ambiguous outcomes.
Do not treat this as a universal idempotency-key guarantee. On an older server, record run identity and reconcile scoped discovery without silently choosing among duplicate titles.

## Guarded update example

After documents.info returns a current document, merge the intended change into its text.
Submit a JSON payload with that document's real values:

```json
{
  "id": "c463ce1c-63d5-4e5a-84a7-8e6a84f10495",
  "lastRevision": 12,
  "editMode": "replace",
  "text": "## Result summary\n\nUpdated report content from the merged document."
}
```

The ID, revision, and body above illustrate the payload shape; they are not live values or a complete report.
Use a JSON encoder. Do not interpolate report text into hand-quoted shell JSON.
Do not send collectionId, parent changes, dataAttributes, or display preferences unless the requested change requires them.
Upstream dataAttributes updates remove omitted attributes; avoid sending that field incidentally.

Publication uses documents.update with id, the current lastRevision, and publish: true.
Do not invent a documents.publish endpoint. Publishing to a collection is not creating a shares resource.
