# Publishing

A shared-context write is usable on the current machine as soon as it is written.
A git remote makes it available to agents on other machines. Read this after every
write under a shared `ALIGNMENT_ROOT`.

## Detect the storage mode

The storage path can be a symlink into a git repository. Test the alignment root
itself:

```bash
git -C "$ALIGNMENT_ROOT" rev-parse --show-toplevel
```

If the command succeeds, use the git-backed workflow below. The repository root
that it prints can contain many context slugs. It is not necessarily the
`ALIGNMENT_ROOT`.

If the command fails, continue the shared-context write as local-only work. Do
not treat missing git setup as a failure, and do not undo the write. Complete any
required `index` update, then report:

- the written path;
- that the context is available only on this machine;
- that no remote link exists.

Then offer these choices. Do not perform either choice until the user accepts it:

1. Keep the store local-only.
2. Initialize the shared store as a git repository.
3. Create a private artifact-share repository and place the store in its
   `shared-context/` directory.

## Offer a local git repository

The shared store is the parent of the origin-keyed `ALIGNMENT_ROOT`:

```bash
SHARED_STORE="$(dirname "$ALIGNMENT_ROOT")"
```

Offer to initialize that directory. Explain that `git init` adds local version
history but does not make the context available on another machine. If the user
accepts, initialize it, commit only the shared-context files, and then offer to
configure a private remote. Do not invent a remote or publish without approval.

## Offer a private artifact-share repository

A private artifact-share repository can provide the remote and hold more than one
origin-keyed context. This is storage, not a published Pages artifact.

If the user accepts this option:

1. Load the `agent-core:artifact-shares` skill.
2. Follow its create procedure. Agree the repository name and owner before you
   run `artifact-shares create`; that operation creates and pushes a GitHub
   repository.
3. Create `shared-context/` in the artifact-share clone. Do not put context files
   under `content/shares/` or `public/s/`, and do not run `artifact-shares share`
   for the context directory.
4. Before you change storage, show the user the current store and the proposed
   `<artifact-share clone>/shared-context` path. Ask whether to copy existing
   contexts or start with an empty store.
5. Set `storage_path` in `~/.config/shared-agent-context/config.json` to the
   accepted `shared-context/` path.
6. Commit and push the `shared-context/` directory through the artifact-share
   repository.

Keep the repository private unless the user explicitly chooses otherwise. The
artifact-shares skill owns its GitHub plan and Pages warnings. Follow those rules
even when this repository is used only as shared-context storage.

## Publish a git-backed store

First inspect the branch, upstream, and worktree:

```bash
git -C "$ALIGNMENT_ROOT" rev-parse --abbrev-ref HEAD
git -C "$ALIGNMENT_ROOT" rev-parse --abbrev-ref '@{upstream}'
git -C "$ALIGNMENT_ROOT" status --porcelain
```

Use these branches:

- **Upstream exists:** commit your write and push to that upstream. Report the
  branch name.
- **No upstream exists:** commit your write locally. Keep the completed context
  available as local-only work. Report that no push occurred, then offer to add a
  private remote or use the private artifact-share option above.
- **Commit or push fails because git setup is incomplete:** keep the write. Report
  the exact git error and offer to repair the missing identity, remote, upstream,
  or authentication. The shared-context write itself remains complete.

Do not switch branches, create an upstream, initialize a repository, or create a
remote without approval.

## Commit rules

1. Stage only files written by the current task. The store can hold notes for many
   repositories.
2. Use a scoped commit message. Use the work key as the scope, or `library` when
   there is no work key. Do not use the origin slug as the scope.
3. Use `add` for a new file, `refresh` for a re-fetch, and `remove` for a deletion.

```text
context(RWR-16627): add confluence 4280287398
context(RWR-16119): refresh confluence 4398711849
context(library): add document superstream-spec
```

After a successful push, confirm that your paths are clean:

```bash
git -C "$ALIGNMENT_ROOT" status --porcelain
```

Unrelated existing changes can remain. Report them; do not stage them.

## Citable links

Build a remote link only after the file is pushed.

- For a file under a pushed shared `ALIGNMENT_ROOT`, build the link from the
  storage repository's `origin` and pushed commit. Include the context slug:
  `https://github.com/{owner}/{repo}/blob/{sha}/{slug}/library/web/rfc-2119.md`.
- For an artifact-share store, include `shared-context/` before the slug:
  `https://github.com/{owner}/{repo}/blob/{sha}/shared-context/{slug}/library/web/rfc-2119.md`.
- For local-only storage, report the local path and state that no citable remote
  link exists.
- For a file in the repository being changed, use a path relative to that
  repository root.

The full link rule lives in `developer/SHARED-CONTEXT-LINKS.md`. This reference
does not replace it.
