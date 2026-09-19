# List the share repositories

Read-only. Safe to run at any time.

```bash
cli.ts list
```

## Output

```text
work-shares  [12 shares]
  repo:  zenobi-us/work-shares
  pages: https://zenobi-us.github.io/work-shares/
  clone: /home/zenobius/.local/share/artifact-shares/work-shares
```

| Line | Meaning |
|---|---|
| `[12 shares]` | Lines in the clone's `.types` file |
| `[not cloned]` | The config names it, but the clone directory is missing |
| `repo` | The GitHub repository |
| `pages` | The site root. A share page is `<pages>shares/<hash>/` |
| `clone` | Where `share` writes |

## What it reads

`~/.config/artifact-shares.json`, and nothing else. It makes no network call, so
it works offline and never waits.

A share is invisible to `list` until `create` records it. A clone on disk with no
config entry is not found. To adopt one, add the entry by hand:

```json
{
  "clone_root": "~/.local/share/artifact-shares",
  "shares": {
    "work-shares": {
      "repo": "zenobi-us/work-shares",
      "branch": "main",
      "pages_url": "https://zenobi-us.github.io/work-shares/"
    }
  }
}
```

`pages_url` **MUST** end with a slash. Every published URL is built by joining to
it.

## When a share says `not cloned`

Run `cli.ts sync <name>`. It clones the repository on first use.
