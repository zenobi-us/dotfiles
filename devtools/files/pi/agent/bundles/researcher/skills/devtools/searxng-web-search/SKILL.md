---
name: searxng-web-search
description: Searches the web through the local SearXNG instance using curl and renders readable results with lynx. Use for private terminal-based web searches through search.gameserver.lan.
---

# SearXNG Web Search

Use the local instance. It serves HTML results; JSON, CSV, and RSS currently return HTTP 403.

## Search

```bash
query='search terms'
SEARXNG_URL="${SEARXNG_URL:-http://search.gameserver.lan}"
curl --fail --silent --show-error --location --get "$SEARXNG_URL/search" \
  --data-urlencode "q=$query" \
  | lynx -stdin -dump
```

Use `--data-urlencode` for every user-provided value. Add supported filters only when needed:

```bash
  --data-urlencode 'categories=general,it' \
  --data-urlencode 'language=en' \
  --data-urlencode 'pageno=2' \
  --data-urlencode 'time_range=month' \
  --data-urlencode 'safesearch=1'
```

Valid `time_range`: `day`, `month`, `year`. Valid `safesearch`: `0`, `1`, `2`.

## Rules

- MUST omit `format`; configured structured formats return 403.
- MUST report curl or DNS failures instead of silently switching to a public search engine.
- SHOULD use `SEARXNG_URL` override when set.
- MAY add `-nolist` only when result link references are unnecessary.
