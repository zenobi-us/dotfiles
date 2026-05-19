# release-please object return shapes

Purpose: document the concrete object interfaces referenced by `release-please-action` outputs.

## Source of truth

- PullRequest interface:
  - https://github.com/googleapis/release-please/blob/main/src/pull-request.ts
- CreatedRelease interface:
  - https://github.com/googleapis/release-please/blob/main/src/manifest.ts
- GitHubRelease interface (base type):
  - https://github.com/googleapis/release-please/blob/main/src/github.ts

## PullRequest shape

```ts
interface PullRequest {
  headBranchName: string;
  baseBranchName: string;
  number: number;
  mergeCommitOid?: string;
  title: string;
  body: string;
  labels: string[];
  files: string[];
  sha?: string;
}
```

Used by action outputs:

- `pr` (first PR)
- `prs` (JSON array of PullRequest)

## GitHubRelease base shape

```ts
interface GitHubRelease {
  id: number;
  name?: string;
  tagName: string;
  sha: string;
  notes?: string;
  url: string;
  draft?: boolean;
  uploadUrl?: string;
}
```

## CreatedRelease shape

```ts
interface CreatedRelease extends GitHubRelease {
  id: number;
  path: string;
  version: string;
  major: number;
  minor: number;
  patch: number;
  prNumber: number;
}
```

Action output naming transforms camelCase fields to snake_case for key outputs (e.g. `tagName` -> `tag_name`, `uploadUrl` -> `upload_url`) when exported for workflow use.

## Mapping hints for workflow authors

- Treat numeric values from outputs as strings unless explicitly parsed.
- `paths_released` and `prs` are JSON strings and should be parsed with `fromJSON(...)`.
- Path-prefixed release outputs follow `<path>--<key>` naming convention.
