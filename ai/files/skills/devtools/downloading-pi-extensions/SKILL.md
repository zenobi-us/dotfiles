---
name: downloading-pi-extensions
description: Use when installing third-party pi extensions from GitHub into devtools/files/pi/agent/extensions using gh download
---

# Downloading Pi Extensions

You install third-party pi extensions to the local extensions directory.

## Destination

Always install to:

`/mnt/Store/Projects/Mine/Github/Dotfiles/devtools/files/pi/agent/extensions/`

(Equivalent symlink path: `~/.pi/agent/extensions/`)

## Preferred Source: GitHub (use `gh download`)

If the extension is on GitHub, use `gh download` first.

```bash
gh download --help
```

```bash
gh download <owner>/<repository> [...filepaths] --outdir /mnt/Store/Projects/Mine/Github/Dotfiles/devtools/files/pi/agent/extensions/<extension-name>
```

### Notes

- For monorepos, pass the extension subdirectory path(s) in `...filepaths`.
- Keep folder layout correct: `extensions/<extension-name>/index.ts` (or package root with `src/index.ts` + build config).
- Avoid accidental nesting like `extensions/<name>/<repo>/<name>/...`.

## Verification

After download, verify:

1. Files exist in the expected destination folder.
2. Extension entrypoint exists (`index.ts`, `src/index.ts`, or built `dist/index.js` depending on project structure).
3. `package.json` is present for package-based extensions.
4. If TypeScript source is provided, install/build as required by that extension.
5. Pi can load the extension without errors.

## Safety

- Prefer pinned refs (tag or commit) when possible.
- Review `index.ts`/`src/index.ts` and `package.json` before trusting behavior.
- Do not run unreviewed scripts blindly.

## Provenance

Record source details in notes/commit:
- repository URL
- ref (commit/tag)
- local modifications (if any)
