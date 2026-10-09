---
description: Find Confluence pages with CQL, exact filters, titles, creators, labels, spaces, and modified dates.
---

# Confluence Querying

Use CQL when the target is definitely Confluence and exact constraints are
needed.

Example shapes:

```text
space = "ENG" AND type = page ORDER BY lastmodified DESC
creator = currentUser() AND lastmodified >= now("-30d")
title ~ "release" AND type in (page, blogpost)
```

Guidance:

- Use CQL for space, type, title, creator, contributor, label, and modified-time
  filters.
- Use fuzzy cross-product search when the page title, product, or location is
  uncertain.
- Treat search results as candidates; fetch selected IDs or URLs natively.
- Verify author/creator metadata when the answer depends on who wrote content.
- Bound broad content lists and state truncation.
- Fetch full bodies only for the few pages central to the answer.

Do not assume every content type is represented by the same CQL `type` value.
Use the exact help and returned metadata for specialized content.
