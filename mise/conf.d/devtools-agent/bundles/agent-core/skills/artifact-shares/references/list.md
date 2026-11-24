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
private-evidence  [not cloned]
  repo:  zenobi-us/private-evidence
  pages: disabled
  clone: /home/zenobius/.local/share/artifact-shares/private-evidence
```

| Line | Meaning |
|---|---|
| `[12 shares]` | Lines in the clone's `.types` file |
| `[not cloned]` | The config names it, but the clone directory is missing |
| `repo` | The GitHub repository |
| `pages` | The site root, or `disabled` when Pages is off |
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

`pages_url` is `null` when Pages is disabled. Otherwise, it **MUST** end with a
slash. The CLI builds each page URL from this value.

## When a share says `not cloned`

Run `cli.ts sync <name>`. It clones the repository on first use.

## Configuration contracts and local changes

`list` accepts unversioned or explicit `artifact-share-config/v1`, and `artifact-share-config/v2`. It validates without rewriting the file. New writes use `schemaVersion: artifact-share-config/v2`. Missing legacy `clone_root` and `shares` mean `~/.local/share/artifact-shares` and `{}`. Unknown explicit versions and malformed records stop interpretation. Unknown authored properties remain intact.

Run commands by absolute path from any directory. `<skillroot>` is the installed directory containing this skill's `SKILL.md`. These commands change local configuration only. They do not move clones or publish content:

```bash
"<skillroot>/scripts/artifact-shares/cli.ts" config upgrade
"<skillroot>/scripts/artifact-shares/cli.ts" config clone-root /new/local/clone-root
```

Use `ARTIFACT_SHARES_CONFIG` for an isolated configuration file. Configuration writes from `create`, `pages enable` and `recreate` use the same shared safe-upgrade procedure. Their remote operations still need the existing explicit authorization. The writer rejects stale loaded content, unsafe numeric values, duplicate keys, immutable artifacts, symlinks and lock conflicts. A rejected conversion leaves exact source bytes unchanged. Do not remove a stale `.contract-upgrade.lock` until its owner has stopped.

For an explicit bulk conversion, resolve the installed `skill-contracts` directory, then run its owning command with a JSON array of selected absolute config paths:

```bash
"<skill-contracts-root>/scripts/router.ts" bulk-upgrade --skill "<skillroot>" --owner file:scripts/artifact-shares/config-owner.ts --artifacts /absolute/selected-configs.json
```

Bulk items commit independently. A partial result is not complete success. Current valid configuration is not reformatted by `config upgrade`. Historical published pages have no automatic conversion.

## Contract inventory

| Boundary | Owner and definition | Validator and reader | Upgrade policy |
| --- | --- | --- | --- |
| Configuration, input and output | artifact-shares; `contracts/config-v1.json`, `contracts/config-v2.json` | `config.ts`, `config-owner.ts`; shared manifest resolution | v1 to v2 before authorized mutation or explicit selected conversion |
| Owned share frontmatter, input and output | artifact-shares; `contracts/metadata-v1.json`, `contracts/metadata-v2.json` | Template `src/share-metadata.ts`, CLI and repository checks | Read historical v1 without rewriting; new pages use v2 |
| `.types`, input and output | artifact-shares; `contracts/index-v1.txt` | CLI `readTypes` and repository `checks:types` | Preserve unversioned v1 text format |

Definitions above are relative to `references/`. Fumapress/MDX syntax, package files, GitHub API responses and hosting/workflow formats remain externally owned. Original assets are opaque byte-preserved content. Prose, components, human-facing diagnostics and transient command summaries have no separate persistent record contract. No contract identity is added to external formats or source assets.
