---
id: pkgmt003
type: task
title: Migrate Developer Prompts and Skills
created_at: 2026-04-01
updated_at: 2026-04-01
status: todo
epic_id: pkgmig01
phase_id: Phase 2
story_id: pkgms001
assigned_to: 
---

# Migrate Developer Prompts and Skills

## Objective
Move developer prompts/skills into `ai/files/packages/developer/`.

## Steps
1. Move prompts:
   - `codemap.md`, `commit.md`, `pr.md`, `fix-in-worktree.md`, `resolve-pr.md`
2. Move skill dirs:
   - Devtools (non-design): `agent-browser`, `bats-testing`, `chrome-debug`, `codemapper`, `create-new-bun-package-repo`, `creating-cli-tools`, `creating-pi-extensions`, `downloading-pi-extensions`, `firefox-devtools`, `github-pr-comment-analyzer`, `mise`, `release-please`, `resolving-github-pull-request-reviews`, `software-design`, `working-with-pi-coding-agent-shared-sessions`, `writing-and-creating-git-commits`, `writing-github-pr-descriptions`
   - Experts: `experts/developer-experience`, `experts/language-specialists`, `experts/quality-security`
3. Verify no overlap left in old paths.

## Expected Outcome
Developer package contains all developer-domain assets.

## Actual Outcome

Moved developer prompts and developer-domain devtools + expert skill trees into `packages/developer`.
