# Rebuild a share repository without its history

`recreate` deletes the GitHub repository and builds it again from the clone's
current working tree, as one commit with no ancestors.

It is the only thing in this skill that gets published bytes off GitHub.

## Before you start

The command **deletes a repository**. Run it only when the user names the
operation, in those words, after a `redact`.

You **MUST** state the cost and the limit:

| | |
|---|---|
| Cost | The commit history, issues, and stars are gone |
| Cost | The site 404s until the new deploy finishes |
| Kept | The repository name, so the Pages URL does not change |
| Kept | **Every share still in the tree keeps the URL it had** |
| Limit | It does not recall what was already read, cloned, or forked |

That last row is why rotation comes first, always.

## Why not `git filter-repo`

`filter-repo` rewrites history in place. It breaks every existing clone, it
leaves unreachable objects that GitHub can still serve by SHA, and it needs a
force push that the deploy workflow will fight. Deleting the repository removes
the objects because it removes the repository.

## Steps

1. You **MUST** rotate the credential first.

2. You **MUST** redact the offending share, so the working tree no longer holds
   it:

   ```bash
   cli.ts redact <hash> --into <name>
   ```

3. You **MUST** repeat the name to confirm:

   ```bash
   cli.ts recreate <name> --confirm <name>
   ```

4. You **MUST** report the new `pagesUrl` and the bundle path.

5. You **SHOULD** watch the first deploy:

   ```bash
   gh run watch "$(gh run list --repo <owner>/<name> --limit 1 --json databaseId --jq '.[0].databaseId')" --repo <owner>/<name>
   ```

## What the command does

| Order | Action | Reversible |
|---|---|---|
| 1 | Refuses unless `--confirm <name>` matches the share name | — |
| 2 | Refuses a path that is not a share repository clone | — |
| 3 | Runs every check on the working tree. All **MUST** pass | — |
| 4 | Writes `<clone>/../<name>-<timestamp>.bundle`, the whole old history | — |
| 5 | Turns GitHub Pages off | yes |
| 6 | Deletes the repository | **no** |
| 7 | Creates it again, same owner, same name, **same visibility** | — |
| 8 | Removes `.git`, commits the tree once, pushes | — |
| 9 | Installs the hooks and sets Pages back to `build_type: workflow` | — |

Step 3 comes before step 6 on purpose. Rebuilding around a secret spends the one
move that removes it.

Step 4 comes before step 5 for the same reason. After step 6 the old history
exists only in that bundle. To read it later:

```bash
git clone <name>-<timestamp>.bundle recovered
```

## Visibility is preserved

`recreate` reads the repository's visibility before it deletes anything, and
rebuilds it the same way. That matters in both directions:

- A public repository rebuilt as private loses its site on a free plan.
- A private repository rebuilt as public publishes every share in it.

Neither may happen by accident, so the value is read while the old repository
still exists and printed before the delete.

## Failure modes

| Message | Cause | Fix |
|---|---|---|
| `recreate deletes ... To go ahead, repeat the name` | `--confirm` missing or wrong | Repeat the share name exactly |
| `Not an artifact share repository` | The config points somewhere else | Check the path in `list` |
| `secrets check: ...` | The tree still holds a credential | Redact it, then run again |
| `gh repo delete ... HTTP 403` | The token has no `delete_repo` scope | `gh auth refresh -s delete_repo`, then run again |

A failure at step 6 leaves Pages off and the repository intact. That is the safe
state: the site is down, nothing is lost, and the command can be run again.

`recreate` does not clean up after a failure between steps 6 and 8. If it stops
there, the repository exists and is empty. Run it again; step 3 and step 4 are
cheap and it will rebuild from the same tree.
