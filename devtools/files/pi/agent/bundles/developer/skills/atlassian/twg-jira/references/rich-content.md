---
description: Write Jira descriptions, comments, mentions, links, and structured content with supported HTML, Markdown, or ADF forms.
---

# Jira Rich Content

Match the command's advertised description or comment format.

- Use real HTML tags when the format is HTML.
- Use markdown only when the command explicitly supports it.
- Do not pass Jira wiki markup such as `h2. Heading`, `[label|url]`, or
  `*bold*`.
- Use a body file for long or structured content.

For HTML mentions, resolve the person first and use a real Atlassian account ID:

```html
<span data-type="mention" data-user-id="AAID">@Display Name</span>
```

Markdown has no portable mention syntax. When the Jira write path supports the
compatibility form, `[~accountId:AAID]` can be converted to an ADF mention.
Prefer the HTML form when controlling the format.

Never invent account IDs. Read back the resulting description or comment when
format preservation matters.
