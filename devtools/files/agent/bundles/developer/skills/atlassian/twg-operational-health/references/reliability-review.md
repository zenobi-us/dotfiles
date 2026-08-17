---
description: Build a bounded leadership reliability review from representative JSM incidents, PIRs, ownership, and prevention evidence.
---

# Leadership Reliability Review

Resolve platform and window, then start with the native operational records:
`twg jsm incident query --after <window> --limit 20` and
`twg jsm post-incident-review query --after <window> --limit 20`. Connect the
bounded results to the platform through service, owner, linked work, or record
content; do not assume its name appears in incident or PIR titles. These
commands accept natural search text when an incident-specific alias is known;
use `--jql` only for a structured JQL query.
Run without `--site` unless the user or runtime explicitly selects another
tenant. Use semantic `twg search` only to resolve an ambiguous platform name,
not as the incident inventory.

If structured JSM records are unavailable or do not expose the verified
platform relationship, use one platform-and-window-bounded Confluence query for
reliability reviews/PIRs and one Jira query for incident actions or prevention
work. Absence from JSM alone is not proof of no incident evidence. These are
bounded fallbacks, not permission to substitute a tenant-wide search corpus.

Treat incident and PIR results as the primary corpus. Pair linked records,
cluster materially distinct themes, and hydrate only representative records
needed to establish impact, mitigation, causal confidence, recurrence, and
prevention status. Use `org-tree` once after services or owners are known when
people data is available. Query docs, Jira work, code, collaboration, or
observability only for a selected record when it resolves a cause, ownership,
or prevention gap. Do not replace sparse native incident/PIR results with a
tenant-wide inventory or force unsupported themes. Separate mitigation from
root cause, label causal confidence, and rank the prevention work that warrants
leadership attention.
