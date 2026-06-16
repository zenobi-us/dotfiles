# Filename Conventions

## Purpose
Define deterministic filename rules for planning artifacts so links, validation, and archival are reliable.

## Base Rules
- Artifact files MUST use lowercase kebab-case titles.
- ID-bearing artifact files MUST use an 8-character lowercase hex id: `[a-f0-9]{8}`.
- Singleton artifact files MUST use their exact reserved filename and MUST NOT include an id.
- Artifact references MUST use markdown links, not plain text filenames.
## Artifact Type → Filename Pattern

| Artifact Type | Filename Pattern | Example |
|---|---|---|
| Project Constitution | `constitution.md` | `constitution.md` |
| Idea | `idea-<id>-<title>.md` | `idea-a1b2c3d4-better-branch-hooks.md` |
| Epic | `epic-<id>-<title>.md` | `epic-8f2d1a9c-worktree-automation.md` |
| Story | `story-<id>-<title>.md` | `story-5c4e7a11-configure-zellij-tabs.md` |
| Task | `task-<id>-<title>.md` | `task-3a9d7c20-add-post-start-hook.md` |
| Research | `research-<id>-<title>.md` | `research-7e11ab44-zellij-cli-capabilities.md` |
| Decision | `decision-<id>-<title>.md` | `decision-f0d3a221-tab-naming-strategy.md` |
| Learning | `learning-<id>-<title>.md` | `learning-c91f2e88-worktree-port-collisions.md` |
| Retrospective | `retrospective-<id>-<title>.md` | `retrospective-1b7a3d66-epic-closeout.md` |

## Link Format
- ID-bearing artifacts: `[label](./<type>-<id>-<title>.md)`
- Project Constitution: `[Project Constitution](./constitution.md)`

## Validation Hints
A validator SHOULD enforce:
1. ID-bearing filename matches artifact type pattern.
2. Singleton filename matches exact reserved filename.
3. `id` in frontmatter matches `<id>` in filename for ID-bearing artifacts.
   - In Basic Memory, schema validation only enforces this field if the artifact schema declares `settings.frontmatter.id`; filename-to-frontmatter equality still requires wrapper/custom validation.
4. All artifact links use markdown link format.
5. No duplicate `<id>` within active artifact set.
6. Exactly one `constitution.md` exists per project before planning exits.
