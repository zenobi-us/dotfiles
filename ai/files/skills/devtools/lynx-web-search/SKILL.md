---
name: lynx-web-search
description: Use when terminal-only internet research is needed and you must search the web or read pages without browser automation, especially when relying on lynx CLI to query search engines and save readable page dumps to /tmp.
---

# Lynx Web Search

## Overview

Use `lynx` as a fast text-only fallback for web search and page retrieval.

This skill focuses on two repeatable tasks:
1. Search engines from the terminal
2. Fetch a URL and save a readable dump in `/tmp`

## When to Use

- Need quick web search from shell without GUI/browser automation
- Dedicated web tooling is unavailable
- Need plain-text output for analysis/summarization
- Need deterministic saved artifacts in `/tmp`

**When NOT to use:**
- JavaScript-heavy pages requiring interaction/login flows
- Visual testing or DOM inspection (use browser automation tools)

## Quick Reference

### Engine URL templates

| Engine | URL template |
|---|---|
| Google | `https://www.google.com/search?q=<query>` |
| Brave | `https://search.brave.com/search?q=<query>&source=web` |
| Bing | `https://www.bing.com/search?q=<query>` |
| Yahoo | `https://search.yahoo.com/search?p=<query>` |
| GitHub | `https://github.com/search?q=<query>&type=repositories` |
| Reddit | `https://www.reddit.com/search/?q=<query>` |
| Reddit (less JS-heavy fallback) | `https://old.reddit.com/search?q=<query>` |

### Core lynx flags from `man lynx`

- `-dump`: render readable text and exit
- `-source`: dump raw source and exit
- `-listonly`: output links list only (good for extracting URLs)
- `-accept_all_cookies`: avoid cookie prompts
- `-useragent=...`: override UA when sites block default behavior

## Implementation

### 1) Search any engine and save output to `/tmp`

```bash
engine="brave"          # google|brave|bing|yahoo|github|reddit|oldreddit
query="lynx cli usage"
q=$(python - <<'PY' "$query"
import sys, urllib.parse
print(urllib.parse.quote_plus(sys.argv[1]))
PY
)

case "$engine" in
  google)    url="https://www.google.com/search?q=$q" ;;
  brave)     url="https://search.brave.com/search?q=$q&source=web" ;;
  bing)      url="https://www.bing.com/search?q=$q" ;;
  yahoo)     url="https://search.yahoo.com/search?p=$q" ;;
  github)    url="https://github.com/search?q=$q&type=repositories" ;;
  reddit)    url="https://www.reddit.com/search/?q=$q" ;;
  oldreddit) url="https://old.reddit.com/search?q=$q" ;;
  *) echo "Unknown engine: $engine" >&2; exit 2 ;;
esac

out="/tmp/lynx-search-${engine}-$(date +%Y%m%d-%H%M%S).txt"
lynx -accept_all_cookies -dump "$url" | tee "$out"
printf "\nSaved: %s\n" "$out"
```

### 2) Fetch a given URL and save readable dump to `/tmp`

```bash
url="https://example.com"
out="/tmp/lynx-page-$(date +%Y%m%d-%H%M%S).txt"
lynx -accept_all_cookies -dump "$url" > "$out"
printf "Saved readable dump: %s\n" "$out"
```

### 3) Optional: save raw HTML/source to `/tmp`

```bash
url="https://example.com"
out="/tmp/lynx-source-$(date +%Y%m%d-%H%M%S).html"
lynx -source "$url" > "$out"
printf "Saved source dump: %s\n" "$out"
```

## Common Mistakes

- **Forgetting URL encoding** for multi-word queries → use `urllib.parse.quote_plus`
- **Assuming Google always works** in text mode (often blocked/JS challenge)
- **Using only one engine** when blocked → retry with Brave/Bing/Yahoo/GitHub/old Reddit
- **Not saving outputs** → always write to `/tmp/lynx-*.txt` for traceability
- **Expecting JS-rendered content** from `lynx` → use browser automation for dynamic pages
