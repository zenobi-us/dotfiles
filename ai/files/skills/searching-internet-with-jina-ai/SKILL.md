---
name: searching-internet-with-jina-ai
description: Use when you need fast, headless web search or readable page content without a browser, especially when you only have curl/wget and need a deterministic URL-based endpoint.
---

# Jina AI Search + Reader

## Overview
Use Jina AI’s public endpoints to (1) search the web and (2) fetch readable page content as plain text/markdown via a single URL.

## When to Use
- You need quick web search results without an API key or browser
- You need readable page content from a URL for summarization or analysis
- You’re in a headless environment and only have HTTP tools (curl/wget)

When NOT to use:
- You need advanced ranking, filters, or custom search parameters (use a full search API)

## Quick Reference

### Search (s.jina.ai)
```
https://s.jina.ai/YOUR_SEARCH_QUERY
```

### Reader (r.jina.ai)
```
https://r.jina.ai/YOUR_URL
```

## Implementation

### 1) Search for pages
```bash
curl "https://s.jina.ai/jina%20ai%20reader%20usage"
```
- URL-encode spaces and special characters in the query.
- Output returns search results with titles/snippets/links (plain text).

### 2) Fetch readable page content
```bash
curl "https://r.jina.ai/https://example.com/article"
```
- Prepend `https://r.jina.ai/` to any HTTP/HTTPS URL.
- Output is readable text/markdown for the target page.

### 3) Typical workflow
1. Use `s.jina.ai` to discover relevant links.
2. Use `r.jina.ai` to fetch readable content from those links.

## Common Mistakes
- Forgetting to URL-encode the search query → results in malformed requests.
- Omitting the original URL scheme (http/https) after `r.jina.ai/`.
- Assuming `r.jina.ai` performs search (it only reads a specific URL).
