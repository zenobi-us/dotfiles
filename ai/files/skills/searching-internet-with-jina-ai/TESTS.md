# Skill TDD Notes — jina-ai-search

## RED: Baseline (Without Skill)

### Scenario 1: Extract readable content from a URL
- Prompt: "Get the readable text for https://example.com/article."
- Baseline behavior observed: Reached for browser-based reading or guessed at curl without the r.jina.ai prefix. No deterministic text extraction approach.
- Failure symptom: Could not provide a single-step, headless extraction URL.

### Scenario 2: Search the web quickly without a browser
- Prompt: "Search for 'jina ai reader usage' and summarize top results."
- Baseline behavior observed: Defaulted to unrelated tools or stalled due to lack of search endpoint knowledge.
- Failure symptom: No direct search URL pattern or output format.

## GREEN: With Skill (Expected Behavior)

### Scenario 1
- Uses: https://r.jina.ai/https://example.com/article
- Expected: Markdown-like readable text returned from r.jina.ai.

### Scenario 2
- Uses: https://s.jina.ai/jina%20ai%20reader%20usage
- Expected: Search results list with titles, links, snippets suitable for follow-up r.jina.ai fetches.

## REFACTOR: Loopholes Closed
- Explicitly note both r.jina.ai (reader) and s.jina.ai (search) endpoints.
- Require URL encoding for search queries.
- Include curl examples and when to prefer s.jina.ai vs r.jina.ai.
