# Path filters

Use path conditions to keep hooks narrowly targeted.

## Run only when any changed path matches

```yaml
hooks:
  - id: any-src-ts-change
    event: file.changed
    conditions:
      - matchesAnyPath:
          - "src/**/*.ts"
          - "src/**/*.tsx"
    actions:
      - notify: "A TypeScript source file changed"
```

This runs if at least one changed path matches one of the patterns.

## Filter a specific post-tool event by path

```yaml
hooks:
  - id: write-src-ts-change
    event: tool.after.write
    conditions:
      - matchesAnyPath:
          - "src/**/*.ts"
          - "src/**/*.tsx"
    actions:
      - notify: "A TypeScript source file was written"
```

This runs only after the `write` tool and only when the written path matches one of the patterns. Use `file.changed` instead when the workflow should react to the path regardless of whether `write`, `edit`, or a recognized mutation-shaped `bash` command caused it.

## Run only when all changed paths stay inside one area

```yaml
hooks:
  - id: all-paths-under-docs
    event: session.idle
    conditions:
      - matchesAllPaths: "docs/**"
    actions:
      - notify: "Only docs changed this turn"
```

This runs only if every changed path matches `docs/**`.

## Require an intersection

If you want all changed paths to be under `src/` and also all to be TypeScript, split the conditions:

```yaml
hooks:
  - id: all-src-ts
    event: session.idle
    conditions:
      - matchesAllPaths: "src/**"
      - matchesAllPaths: "**/*.ts"
    actions:
      - notify: "Only src TypeScript files changed"
```

## Quick test

1. Add one of the snippets
2. Change a matching file
3. Confirm the hook fires
4. Change a non-matching file
5. Confirm the hook does not fire
