# Sync a clone

Bring a clone up to date with its remote, or make it for the first time.

```bash
cli.ts sync <name>
```

## When to run it

- `list` shows `not cloned`.
- Someone else published a share, or edited the site, from another machine.
- A `share` failed with a git error and you want a clean tree first.

`share` syncs on its own before it writes, so you do not have to run `sync`
first in the normal case.

## What it does

| State | Action |
|---|---|
| The clone is missing | `gh repo clone <repo> <clone> -- --branch <branch>` |
| The clone exists | `git fetch origin <branch>` then `git pull --ff-only` |

`--ff-only` is deliberate. A clone with local commits that the remote does not
have stops the pull rather than making a merge commit. Nothing here rewrites
history.

## Output

```json
{
  "name": "work-shares",
  "repo": "zenobi-us/work-shares",
  "clone": "/home/zenobius/.local/share/artifact-shares/work-shares",
  "head": "d5889cee53ccccc48eee5cfb1244ea7d7e5d0e78",
  "shares": 12
}
```

## Failure modes

| Message | Cause | Fix |
|---|---|---|
| `Not possible to fast-forward` | The clone has local commits | Inspect the clone. Push the commits, or reset them, then sync again |
| `Unknown share: <name>` | The config does not name it | Run `cli.ts list` and check the spelling |

You **MUST NOT** delete a clone to get past a git error without reading it first.
A clone can hold an unpushed share.
