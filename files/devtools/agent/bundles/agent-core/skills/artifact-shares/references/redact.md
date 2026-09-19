# Take a published share down

`redact` removes one share from the repository and pushes. The page stops
resolving when the next deploy finishes.

## What it does not do

`redact` is containment, not erasure.

- The bytes stay in this repository's git history, and on GitHub.
- Anyone who already cloned, forked, or opened the page has them.
- A search engine may still hold the page.

If the share carried a credential, **rotate the credential**. Nothing the CLI
does replaces that. Read `references/recreate.md` when the history itself has to
go.

## Steps

1. You **MUST** rotate any credential the share published, before anything else.
   Every later step takes minutes and none of them reaches a reader who was
   faster.

2. You **MUST** find the hash. `checks:secrets` prints the path, and the hash is
   the directory name under `public/s/`:

   ```text
   secrets check: trufflehog reported 1 finding(s)
     AWS (unverified) in public/s/2e9171720acb/env.txt:1
   ```

3. You **MUST** run the command with that hash:

   ```bash
   cli.ts redact 2e9171720acb --into work-shares
   ```

4. You **MUST** report the removal to the user, and say plainly that the page
   was taken down but the bytes were not recalled.

5. You **SHOULD** watch the deploy. The page resolves until it finishes:

   ```bash
   gh run watch "$(gh run list --repo <owner>/<name> --limit 1 --json databaseId --jq '.[0].databaseId')" --repo <owner>/<name>
   ```

## What the command does

| Order | Action |
|---|---|
| 1 | Refuses when the hash is not in `.types` |
| 2 | Lists the files it is about to remove |
| 3 | Deletes `public/s/<hash>/`, `content/shares/<hash>.mdx`, and the `.types` line |
| 4 | Runs every check, so the repository is left valid |
| 5 | Commits and pushes |
| 6 | Prints the `recreate` command, in case the history has to go too |

`--allow-metadata` and `--allow-large` are set for this run. A finding somewhere
else in the repository **MUST NOT** stop a removal.

## Failure modes

| Message | Cause | Fix |
|---|---|---|
| `<hash> is not a share in <name>` | Wrong hash, or wrong share repository | Run `list`, then check `.types` in the clone |
| `types validation: ...` | The repository was inconsistent before this ran | Read the message. Do not push |
| `secrets check: ...` | Another share is leaking as well | Redact that one too, then run `recreate` once |

## After a redact

Ask whether the history has to go. It does when:

- The credential cannot be rotated, or rotation is slow enough to matter.
- The share carried personal data, not a credential.
- Someone outside the team can clone the repository.

If the answer is yes, read `references/recreate.md`.
