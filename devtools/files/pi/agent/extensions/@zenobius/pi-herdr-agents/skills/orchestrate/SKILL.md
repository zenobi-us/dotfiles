---
name: orchestrate
description: Run an approved, review-only orchestration workflow from local files, URLs, tickets, or combinations of accessible sources. Use when a parent needs bounded fresh parallel review and synthesis with one final result.
---

# Orchestrate a review

This is a parent-only authoring procedure. Read this file before doing any
orchestration. The extension is the runner; this skill is the only bundled
workflow author. Do not use `subagent()` for workflow nodes.

## 1. Resolve and materialize the source

Accept one or more user sources: local paths, URLs, tickets, or any
combination. Use only capabilities already available to the parent (for
example, `read` for repository files and an already-installed browser or
research capability for remote material). There is no tracker client in this
package.

- Stop and report the inaccessible source. Do not guess, silently omit it, or
  continue with a partial source.
- Read remote and tracker content now, before preparation. Materialize the
  exact text, URL or ticket identifier, and retrieval note into the workflow
  prompts/script. Children must never refetch a URL or ticket.
- Resolve local paths inside the approved repository at the selected committed
  base. Reviewers may read those paths only through the runner-owned read-only
  checkout. Do not use parent uncommitted or untracked files as evidence.
- Keep source strings in metadata as provenance. If exact evidence cannot fit
  within the runner limits, stop and ask the user to narrow the source.

## 2. Parent-only preflight

Perform discovery in the parent session only. Inspect the source and candidate
revision, identify the review questions, and resolve available Pi review roles
with their exact authenticated `provider/model` and `thinking` values. Use the
normal role discovery and model catalog already available to the parent; do not
add a tracker client, a second discovery mechanism, or ask a child to discover
roles.

Choose at least two independent reviewer nodes and one fresh synthesis node.
Each node needs a distinct ID, but independent nodes can use the same review
role. Every declared role must be Pi-backed and have a non-empty read-only tool
set after runner derivation. Use bounded caps no higher than `maxAgents: 8` and
`maxConcurrency: 4`; leave enough agent calls for one synthesizer and any
permitted replacement. Exact model and thinking are mandatory for every node.
Pick each node's exact authenticated `provider/model-id` by the tier matched to
its task: fast for bounded mechanical work and recon, mid for ordinary review,
and frontier for architecture or hard diagnosis. Then set thinking within that
model's supported range. When more than one provider is authenticated,
independent reviewer nodes must use a different provider/family than the model
that produced the work; do not reuse that family for its review. Never inherit,
guess, or fall back to a parent or role default. Do not add tier fields to
workflow metadata; each node continues to pin its exact provider/model.

The first flow is review-only. Do not plan writers, commits, worktrees for
writing, ticket changes, pull requests, merges, deployments, publishing,
messages to external systems, cleanup, replay, nested workflows, or runtime or
model/tool fallback.

## 3. Author one exact workflow script

The parent alone writes `.pi/plans/<run>/workflow.js` in a new unique run
directory. Use the committed `baseSha` selected during preflight, not a moving
ref. Do not
overwrite a prior run or create a journal yourself. The first bytes must be the
runner metadata comment, with only the fields accepted by the runner:

```js
/* herdr-workflow
{
  "version": 1,
  "name": "review: <short request>",
  "sources": ["<provenance>", "<provenance>"],
  "baseSha": "<40 lowercase hex characters>",
  "maxAgents": 8,
  "maxConcurrency": 4,
  "roles": [
    {"id": "<review-node-a>", "role": "<review-role>", "kind": "review", "model": "<provider/model>", "thinking": "<level>"},
    {"id": "<review-node-b>", "role": "<review-role>", "kind": "review", "model": "<provider/model>", "thinking": "<level>"},
    {"id": "<synthesis-node>", "role": "<review-role>", "kind": "review", "model": "<provider/model>", "thinking": "<level>"}
  ]
}
*/
```

After the metadata, embed exact remote and tracker evidence as ordinary
JSON-compatible constants. For local repository sources, include the exact path
and committed base and direct reviewers to inspect that path in the runner-owned
read-only checkout. Children must not refetch URLs or tickets or use shell,
network, or MCP access. The parent-authored task prompt and review questions
must be explicit. Keep the script below the runner's size limit.

Launch independent fresh reviewers with ordinary JavaScript and `Promise.all`.
Each reviewer must get the exact evidence and the same review request, while
retaining its distinct declared node ID. Pass only
`{ kind: "review", node: "<declared-node>" }` to `agent()`; the script cannot
select tools, model, thinking, cwd, skills, or context.

A required reviewer may have at most one fresh same-node replacement, and only
when its returned failure envelope explicitly has `retryable === true`:

```js
const finalReviews = await Promise.all(reviewRequests.map(async ({ node, prompt }) => {
  const first = await agent(prompt, { kind: "review", node });
  if (first && first.ok === false && first.retryable === true) {
    return await agent(prompt + "\nThis is the one approved replacement attempt.", {
      kind: "review",
      node,
    });
  }
  return first;
}));
```

Do not infer retryability from prose, error text, stop reasons, null values, or
negative review findings. Do not retry a successful review or a failure without
explicit `retryable: true`. The replacement keeps the exact same review node
and approved runtime. Current runtime failures are non-retryable, so this branch is
normally dormant; do not invent a retryable integration fixture.

Start one fresh synthesizer only after all reviewers and any bounded
replacement have settled. It must receive the exact source evidence and every
final reviewer success/failure envelope, including failures; never filter,
collapse, or synthesize in the parent. The synthesizer is a distinct declared
node and uses only:

```js
const synthesis = await agent(synthesisPrompt, {
  kind: "review",
  node: "<synthesis-node>",
});
```

Return one JSON-compatible, task-specific result chosen for this request. Do
not impose a package-wide verdict enum, review receipt, fixed task schema, or
mechanical worst-result rule. Keep operational failure envelopes explicit in
whatever evidence shape the task needs.

## 4. Prepare, show, and approve

Call only the parent-facing `herdr_workflow` tool for workflow execution:

```ts
herdr_workflow({ action: "prepare", path: ".pi/plans/<run>/workflow.js" })
```

Preparation has no child, journal, checkout, or other execution effect. Present
the returned approval packet **unmodified**. Do not summarize it in place of
the packet or alter its hash, role fingerprints, repository, base, sources, or
tools. Ask the user to reply with the exact line shown by the packet:

```text
APPROVE <8 lowercase hex characters>
```

Do not call `start` until that exact user reply is received in the same active
parent session. Do not put approval text in a tool argument. After the reply,
call:

```ts
herdr_workflow({ action: "start", runId: "<run from packet>" })
```

If preparation fails, source access fails, or the candidate changes, stop and
explain the failure. A revised script requires a new prepare and approval.

## 5. Wait for one delivery

After `start` returns, wait for the single final workflow delivery. Do not poll,
sleep, tail a journal, call a status/history/resume action, or ask children for
updates. The runner delivers one bounded result and retains the journal and
child sessions as evidence.

The parent may cancel with:

```ts
herdr_workflow({ action: "cancel", runId: "<run>" })
```

Cancellation is fail-closed: active child process identities are captured,
panes are closed, process exit is confirmed before checkout disposal, and an
unconfirmed process retains the checkout and produces a failed terminal result.
A same-process `/reload` preserves the active owner and one final delivery. A
full process restart does not replay work; stale running evidence is marked
`interrupted`, retained artifacts remain for inspection, and a new approved
run is required.

The Worker and Node `vm` isolate workflow availability from Pi's main event
loop, but neither is a security boundary. Treat the approved script as trusted
code and inspect it before approval. Worktrees isolate Git state only; Pi,
Herdr, children, and installed packages retain the user's system permissions.
