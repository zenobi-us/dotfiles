---
name: brave-search
description: Web search and content extraction via Brave Search API. Use for searching documentation, facts, or any web content. Lightweight, no browser required.
---

# Brave Search

Headless web search and content extraction using Brave Search. No browser required.

The below scripts use bun shebangs and can be executed directly if Bun is installed.

## When to Use

- Searching for documentation or API references
- Looking up facts or current information
- Fetching content from specific URLs
- Any task requiring web search without interactive browsing

## Search

```bash
scripts/search "query"                    # Basic search (5 results)
scripts/search "query" -n 10              # More results
scripts/search "query" --content          # Include page content as markdown
scripts/search "query" -n 3 --content     # Combined
```

## Extract Page Content

```bash
scripts/content https://example.com/article
```

Fetches a URL and extracts readable content as markdown.

## Output Format

```
--- Result 1 ---
Title: Page Title
Link: https://example.com/page
Snippet: Description from search results
Content: (if --content flag used)
  Markdown content extracted from the page...

--- Result 2 ---
...
```
## Execution Steps

1. use `{skill_path}/scripts/search` resource to perform searches.
2. use `{skill_path}/scripts/content` resource to fetch and extract page content from searches.
