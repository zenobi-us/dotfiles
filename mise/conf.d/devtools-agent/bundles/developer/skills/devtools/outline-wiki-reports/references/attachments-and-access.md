# Attachments and access

## Prepare evidence

Use original screenshots for UI proof. Use redacted request, response, or output files for API and CLI proof.
Use ordered names such as 10-login.png and 20-error-response.json.
Read actual MIME type, byte size, and image dimensions where needed. Check the upload-size limit.
Redact secrets and unnecessary personal data locally before sending bytes. Do not upload a secret and then rely on report text to hide it.

## Two-step upload

1. Call attachments.create with documentId, name, contentType, and actual size in bytes.
2. Record the attachment ID and durable attachment reference. Treat returned signing material as a secret.
3. Inspect data.mode, not the filename or storage provider:
   - **post:** Send a multipart POST to data.uploadUrl. Include the returned data.form fields and the file bytes in the file part. Let the multipart encoder set the boundary.
   - **put:** Send the raw file bytes with PUT to data.url and the supplied data.headers. Do not replace required signed headers with guessed values.
4. Use a separate unauthenticated storage request. Never send the Outline API bearer token to the upload origin. Do not follow cross-origin redirects with credentials.
5. Check the storage response. An attachments.create success only created metadata; it did not upload the file.
6. Reference the attachment's durable Outline path or identifier using the deployed editor/API's supported attachment representation. Inspect the returned attachment fields and existing documents instead of guessing a storage URL.
7. Fetch and render the document. Open the evidence as an authorised reader and confirm the actual content, not merely HTTP success.

Do not embed the uploadUrl, PUT signing URL, or a temporary redirect target as the report's permanent link.
If returned metadata does not expose the durable reference clearly, inspect the matching deployed schema before editing the document.

## Captions and companions

Use Markdown image syntax with meaningful alternative text and a separate proof caption.
Use descriptive file links for companion artifacts. Upload the reader's copy rather than linking to a local checkout, /tmp path, or sibling workflow directory.
A private source artifact must not be republished across an unapproved access boundary.
Outline-managed attachments provide durable wiki references, not an offline portable bundle. Do not claim the report works without access to the wiki.

## Partial uploads

If upload fails, keep the attachment ID and draft ID, omit broken image markup, and mark the check Info if proof is missing.
Check whether storage received the bytes before repeating an ambiguous upload. Do not create another attachment record blindly.
For expired signing instructions, use the deployed supported recovery flow. If it requires a replacement attachment, record the orphan ID without deleting shared files automatically.
A test account used for access verification must already be authorised. Do not create accounts or alter permissions merely to make verification pass.
