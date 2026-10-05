# Enable GitHub Pages

Use this procedure only when the user asks to make a repository-only share site.

Enabling Pages can publish every existing share in the repository. A private
repository usually serves its Pages site publicly. GitHub Pages access control
requires GitHub Enterprise Cloud.

1. Read the repository's share count with `cli.ts list` or `cli.ts sync <name>`.
2. Tell the user that Pages activation may expose all existing shares publicly.
3. Get explicit approval for the named repository.
4. Run:

   ```bash
   cli.ts pages enable <name> --confirm <name>
   ```

The command refuses to proceed unless `--confirm` exactly matches the share name.
It also requires a clean clone, enables Pages, restores the deploy workflow,
pushes the change, and records the Pages URL. The site URL resolves after the
first deployment finishes.

If Pages is not enabled, `share` still commits artifacts to the repository. It
returns `url: null` and a repository path. The repository remains private unless
its visibility was changed separately.
