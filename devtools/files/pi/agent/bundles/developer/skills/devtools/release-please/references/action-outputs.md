# release-please-action output contract

Purpose: authoritative quick reference for `googleapis/release-please-action` outputs used in workflow conditionals and `fromJSON(...)` parsing.

## Source of truth

- README outputs tables: https://github.com/googleapis/release-please-action/blob/main/README.md
- Emission logic (`core.setOutput`): https://github.com/googleapis/release-please-action/blob/main/src/index.ts

## Top-level outputs

| Output | Type | When present | Notes |
|---|---|---|---|
| `releases_created` | boolean-ish string | Always | `true` if any release created |
| `paths_released` | JSON string array | Always | e.g. `[]`, `[".","packages/a"]` |
| `prs_created` | boolean-ish string | Always | `true` if PR created/updated |
| `pr` | object (set as output value) | When at least one PR exists | first PR |
| `prs` | JSON string array | When PRs exist | list of PR objects |

> Practical note: GitHub expression engine treats outputs as strings. Use explicit comparisons and `fromJSON(...)` where appropriate.

## Root component outputs

Available when root component (`.`/unset) is released.

| Output | Type |
|---|---|
| `release_created` | boolean-ish string |
| `upload_url` | string |
| `html_url` | string |
| `tag_name` | string |
| `version` | string semver |
| `major` | number-ish string |
| `minor` | number-ish string |
| `patch` | number-ish string |
| `sha` | string |
| `body` | string |

## Path-prefixed outputs (manifest / monorepo)

Per released path, outputs are emitted as:

`<path>--release_created`, `<path>--tag_name`, `<path>--version`, etc.

Supported suffixes:

- `release_created`
- `upload_url`
- `html_url`
- `tag_name`
- `version`
- `major`
- `minor`
- `patch`
- `sha`
- `body`

If path contains `/`, use bracket syntax in expressions:

- `steps.release.outputs['packages/my-module--release_created']`

## Safe usage patterns

- Gate with explicit boolean-string checks:
  - `if: ${{ steps.release.outputs.release_created == 'true' }}`
- Parse JSON only when field is present/non-empty:
  - `fromJSON(steps.release.outputs.paths_released)`
  - `fromJSON(steps.release.outputs.prs)`

## Drift warning

`action.yml` defines inputs but not a full static outputs schema. Treat README + `src/index.ts` as the effective output contract.
