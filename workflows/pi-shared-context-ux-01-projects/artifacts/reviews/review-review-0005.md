---
title: Formal Projects worktree review
type: Concept
---

# Formal worktree review

## Verdict

FAILURE. Standards: 0 blocking findings. Spec: 2 blocking findings (SPEC-001, SPEC-002).

## Scope

| Field | Value |
| --- | --- |
| Ticket ref and tracker path | `tracker/tickets/pi-shared-context-ux-01-projects.md` |
| Parent specification | `tracker/tickets/pi-shared-context-tui-ux-spec.md` |
| Backend | local-markdown |
| Canonical repository | `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles` |
| Source worktree | `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-pi-shared-context-ux-01-projects` |
| Source branch | `feature/pi-shared-context-ux-01-projects` |
| Base branch | `master` |
| Frozen base commit | `8d3f035541a59319fe20272af1d3d150b1d7b14b` |
| Frozen source commit | `afb6b874f70afb2035ed76288140daf1ff589691` |
| Frozen source tree | `bc8acd4597834dc04cb5169bdf93be44db95ab32` |
| Timestamp | `2026-10-27T00:35:37.308396Z` |
| Reviewer | omp, pi-context-projects-review-0001, herdr w78:p1 |

The review covers all nine changed files and relevant route, loader, modal, watcher, action, and session callers.
The diff command is `git diff 8d3f035541a59319fe20272af1d3d150b1d7b14b...afb6b874f70afb2035ed76288140daf1ff589691`.
The source commits are `26531a0a` and `afb6b874`.
Later initiative, mixed-item, description, event, and queue tickets remain outside this review.
Existing title clipping and the host shortcut conflict are not findings.

## Inputs

The reviewer read the canonical ticket, parent specification, context map, domain configuration, tracker configuration, and ADR index.
`CONTEXT.md` is absent. The ADR index contains no decisions.
The reviewer read the implementation receipt, parent completion receipt, review start receipt, draft snapshot, and recorded validation.
Source code and the frozen diff came from the source worktree. Workflow records came from the canonical repository.

## Standards

The independent Standards reviewer found no evidence-backed blocking finding. No baseline smell warrants a separate finding.
Repository rules override the complete code-review smell baseline. Baseline smells remain judgment calls.

The `withSession` callback stages text through the replacement context. The installed Pi types support that contract.
New project labels, identities, and error messages use `safeTerminalText`. Rendering retains display-width clipping.
Selected workspace callbacks retain their project context. Checkoutless workspaces disable action dispatch.

The Standards session ran at depth 2 in `w78:p2`. Herdr reported `done`, completion sequence 298.
The parent read its report and closed its pane. It did not create a separate durable review body.

## Spec

The independent Spec reviewer identified the two findings below. Parent reproductions confirmed both underlying failures.
The second reproduction exercises the exact resolver and guard, not the full Pi modal.

### SPEC-001 — P2 — resolveStoredContext uses the lossy project slug as canonicalOrigin

**ADR:** NO ADR.

**Location:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/lib.ts:285-286`.

**Requirement:** Ticket acceptance criterion 8: A project without a usable checkout retains readable context.

**Description:** resolveStoredContext uses the lossy project slug as canonicalOrigin. The existing GitHub loader rejects that identity before any issue request.

**Required change:** Resolve the actual canonical origin from authoritative stored project data. Do not substitute the slug for a remote identity.

**Validation command:** `mise exec -- bun /tmp/projects-review-github.ts` (working directory `/tmp`).

**Observed result:** `CURRENT github.com/example/project github; STORED github-com-example-project--3d3378b2 github; REPRODUCED Error: GitHub backend requires a github.com OWNER/REPO canonical origin.`.

**Completion blocker:** Selecting a supported GitHub-backed stored project makes its existing tracker unreadable.

### SPEC-002 — P2 — The current entry permanently declares checkout true

**ADR:** NO ADR.

**Location:** `mise/conf.d/devtools-agent/bundles/agent-core/extensions/pi-shared-context/index.ts:455-459`.

**Requirement:** Ticket acceptance criteria 8 and 12: retain readable context without a usable checkout; keep the current project reachable.

**Description:** The current entry permanently declares checkout true. Its resolver rejects a removed checkout although its shared records remain readable. Canonical deduplication retains this entry and suppresses the checkoutless stored entry.

**Required change:** Fall back to the existing shared context when the current checkout becomes unavailable. Refresh cached workspace checkout capability, action restrictions, and watcher targets before activation.

**Validation command:** `mise exec -- bun /tmp/projects-review-current.ts` (working directory `/tmp`).

**Observed result:** `CURRENT_RESOLVER undefined; CURRENT_ENTRY Error: The current project checkout is unavailable.; SHARED_RECORD Surviving shared item`.

**Completion blocker:** The current project cannot recover its surviving shared context after its checkout disappears.

The Spec session ran at depth 2 in `w78:p4`. The router reported `completed` for run `ecd2aca5-7a2d-47f9-96f2-5a11f8770e1c`.
The parent read its report and closed its pane. It did not create a separate durable review body.

## Validation

| Check | Observed result | Authority |
| --- | --- | --- |
| GitHub stored-project reproduction | Current checkout loads GitHub. Stored selection fails canonical-origin validation. | Reviewer runtime |
| Current-checkout removal reproduction | Current resolver returns undefined. The same shared store still loads its ticket. | Reviewer runtime |
| Focused modal and affected contracts | 90 pass, 0 fail | Recorded implementation log |
| Extension suite | 59 pass, 0 fail | Recorded implementation log |
| Fresh-session regression | 12 pass, 0 fail | Recorded implementation log |
| Scoped TypeScript | exit 0 | Recorded implementation log |
| Actual Pi terminal acceptance | Recorded 40x12, 80x24, 120x40, colour and monochrome observations | Implementation terminal report |
| Bundle-wide typecheck | Known failures in untouched muxer-subagents and writing-skills scripts | Recorded log; not rerun |
| Source preservation | HEAD and tree match frozen identity. Porcelain status is empty. | Reviewer before and after inspection |

The reviewer did not rerun the suite or actual Pi terminal acceptance. The parent owns the next focused validation.
The focused reproductions used temporary repositories and stores. The GitHub reproduction substitutes an empty issue response and needs no network credentials.
The failure occurs before any stored-project GitHub request. Neither reproduction changes the source tree.
No implementation, tracker, projection, commit, merge, or push operation ran.

## Reproduction programs

Save each program to its named temporary path. Run its validation command from `/tmp`.
The programs remove their temporary repositories and stores.

### `/tmp/projects-review-github.ts`

```typescript
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {resolveSharedContext,initializeSharedContext,resolveStoredContext,listSharedContexts} from '/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-pi-shared-context-ux-01-projects/mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/lib.ts';
import {loadExplorerSnapshot} from '/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-pi-shared-context-ux-01-projects/mise/conf.d/devtools-agent/bundles/agent-core/extensions/pi-shared-context/data.ts';
const root=await mkdtemp(join(tmpdir(),'projects-review-github-'));
const exec=async(command:string,args:string[])=>{if(command==='gh') return {stdout:'[]',code:0}; const child=Bun.spawn([command,...args],{stdout:'pipe',stderr:'pipe'});return {stdout:await new Response(child.stdout).text(),code:await child.exited};};
try {
 const repo=join(root,'repo'); const base=join(root,'shared'); await mkdir(repo);
 await exec('git',['init','--quiet',repo]); await exec('git',['-C',repo,'remote','add','origin','https://github.com/example/project.git']);
 let context=(await resolveSharedContext(exec,repo,base))!; await initializeSharedContext(context);
 const shared=context.candidateSharedRoot!;
 await mkdir(join(shared,'docs/agents'),{recursive:true});
 await writeFile(join(shared,'docs/agents/issue-tracker.md'),'---\nbackend: github\n---\n');
 const manifest=join(shared,'.context-routes.toml');
 await writeFile(manifest,(await readFile(manifest,'utf8')).replace('[records.tickets]\nadapter = "local-markdown"\nstore = "shared"','[records.tickets]\nadapter = "github"'));
 context=(await resolveSharedContext(exec,repo,base))!;
 console.log('CURRENT',context.canonicalOrigin,(await loadExplorerSnapshot(context,exec)).backend);
 await rm(repo,{recursive:true});
 const stored=await resolveStoredContext((await listSharedContexts(base))[0]);
 console.log('STORED',stored.canonicalOrigin,stored.routes.tickets.adapter);
 try {await loadExplorerSnapshot(stored,exec);console.log('UNEXPECTED SUCCESS');process.exitCode=1;} catch(error) {console.log('REPRODUCED',String(error));}
} finally {await rm(root,{recursive:true,force:true});}
```

### `/tmp/projects-review-current.ts`

```typescript
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {resolveSharedContext,initializeSharedContext,resolveStoredContext,listSharedContexts} from '/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-pi-shared-context-ux-01-projects/mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/lib.ts';
import {loadExplorerSnapshot} from '/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-pi-shared-context-ux-01-projects/mise/conf.d/devtools-agent/bundles/agent-core/extensions/pi-shared-context/data.ts';
const root=await mkdtemp(join(tmpdir(),'projects-review-current-'));
const exec=async(command:string,args:string[])=>{const child=Bun.spawn([command,...args],{stdout:'pipe',stderr:'pipe'});return {stdout:await new Response(child.stdout).text(),code:await child.exited};};
try {
 const repo=join(root,'repo'); const base=join(root,'shared'); await mkdir(repo);
 await exec('git',['init','--quiet',repo]); await exec('git',['-C',repo,'remote','add','origin','https://github.com/example/project.git']);
 let context=(await resolveSharedContext(exec,repo,base))!; await initializeSharedContext(context);
 const shared=context.candidateSharedRoot!;
 await mkdir(join(shared,'docs/agents'),{recursive:true}); await mkdir(join(shared,'tracker/tickets'),{recursive:true});
 await writeFile(join(shared,'docs/agents/issue-tracker.md'),'---\nbackend: local-markdown\n---\n');
 await writeFile(join(shared,'tracker/tickets/item.md'),'---\nid: item\ntitle: Surviving shared item\nwork_status: open\n---\n');
 context=(await resolveSharedContext(exec,repo,base))!; await rm(repo,{recursive:true});
 const resolved=await resolveSharedContext(exec,context.repositoryRoot,base);
 console.log('CURRENT_RESOLVER',resolved===undefined?'undefined':resolved.canonicalOrigin);
 try {if(!resolved) throw new Error('The current project checkout is unavailable.');} catch(error){console.log('CURRENT_ENTRY',String(error));}
 const stored=await resolveStoredContext((await listSharedContexts(base))[0]);
 console.log('SHARED_RECORD',(await loadExplorerSnapshot(stored,exec)).tickets[0].title);
} finally {await rm(root,{recursive:true,force:true});}
```

## Session mechanics

The initial concurrent router spawns collided on a timestamp-based agent name.
The Standards process remained active in its fresh pane. A later fresh Spec spawn succeeded at depth 2.
The parent obtained completion signals for both axes and closed both panes.
The parent also closed the unused pane from the failed spawn.

## Next step

Resolve SPEC-001 and SPEC-002 in a separate fix phase. Keep this review artifact and result receipt immutable.

