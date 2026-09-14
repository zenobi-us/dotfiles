# Publishing

A write under a shared `ALIGNMENT_ROOT` is invisible to other agents until it lands
on the remote. Read this after every write, and before you cite a file in a commit
message or a pull request.

## Find the real repository first

The storage path can be a symlink into a git repository. Running `git rev-parse` in
the symlink's parent then reports "not a git repository", which is wrong.

You **MUST** resolve it with `-C` on the alignment root itself:

```bash
git -C "$ALIGNMENT_ROOT" rev-parse --show-toplevel
```

If that command fails, the store really is not under version control. Say so and
stop. Do not run `git init` without being asked.

The repository root that command prints is **not** the alignment root. One
repository holds many slugs, each in its own directory.

## Check the branch before you push

The store is a repository like any other. Its checked-out branch may not be a
branch you should push notes to.

```bash
git -C "$ALIGNMENT_ROOT" rev-parse --abbrev-ref HEAD
git -C "$ALIGNMENT_ROOT" rev-parse --abbrev-ref '@{upstream}'
```

- The branch tracks an upstream: commit and push to it. Name the branch in your
  report so the user can object. A store may live on an unusual branch such as
  `gh-pages`. That is the owner's choice, not an error.
- The branch tracks no upstream: **STOP and ask the user.** Say which branch is
  checked out. Commit if you already wrote the file, then report the commit you
  made and the push you did not. Do not switch branches. Do not create an upstream.

## Publish

1. You **MUST** run `git -C "$ALIGNMENT_ROOT" status --porcelain` and read what you
   changed.
2. You **MUST** stage only your own writes. The store holds every project's notes.
3. You **MUST** commit with a scoped message. The scope is the work key, or
   `library` when there is no work key. Do not use the slug — it is too long for a
   subject line.

   Use `add` for a new file, `refresh` for a re-fetch, `remove` for a deletion.

   ```
   context(RWR-16627): add confluence 4280287398
   context(RWR-16119): refresh confluence 4398711849
   context(library): add document superstream-spec
   ```

4. You **MUST** push, unless the branch check above stopped you.
5. You **MUST** confirm `git -C "$ALIGNMENT_ROOT" status --porcelain` is empty.

## Citable links

Any file you cite in a commit message or a pull request body **MUST** be a link a
reviewer can click.

- File under a shared `ALIGNMENT_ROOT`: build the link from the shared repository's
  own `origin` and pushed commit, and include the slug directory:
  `https://github.com/{owner}/{repo}/blob/{sha}/{slug}/library/web/rfc-2119.md`.
  Build it only after the push.
- File in the repository being merged: use a path relative to that repository root.
  No host prefix.

The full rule lives in `developer/SHARED-CONTEXT-LINKS.md`. This file does not
replace it.
