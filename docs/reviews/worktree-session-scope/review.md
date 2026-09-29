
  ## Assessment

  Your desired workflow is sound. The current worktree skill does not implement it.

  The main conflict is in references/playbooks/review.md:

  ┃ “Review never opens a new pane or launches a fresh agent — it only inspects the current worktree.”

  That directly causes the context contamination you described.

  The current fix playbook also starts another agent, but it does not define a durable, immutable handoff model. It relies on:

  • /tmp/{ticket-id}-fix-handoff.md
  • one mutable review artifact
  • chat output markers
  • workflow records that can be updated

  That is not enough for a reliable start → review → fix → review loop.

  There is also a configuration mismatch:

  [merge]
  squash = false

  The finish playbook promises a squash merge. The Worktrunk configuration currently disables squashing.

  ---

  # Recommended workflow

  Use one fresh agent session per phase.

  start
    └─ implementation session
         └─ immutable implementation receipt
         └─ draft PR projection

  review
    └─ fresh review session
         └─ immutable review receipt
         └─ verdict: SUCCESS or FAILURE

  fix
    └─ fresh fix session
         └─ immutable fix receipt
         └─ updated draft PR projection

  review
    └─ fresh review session
         └─ new immutable review receipt

  finish
    └─ validate latest SUCCESS receipt
    └─ update final projections
    └─ squash merge
    └─ push
    └─ complete ticket
    └─ remove worktree and muxer workspace

  The implementation, review, and fix sessions must never resume one another.

  ---

  # Durable artifact architecture

  Use two classes of artifacts.

  ## 1. Immutable event receipts

  Every lifecycle action creates a new file. Existing receipts are never overwritten.

  Suggested layout:

  {ticket-anchor}/worktree/
    workflow.yaml

    events/
      0001-start.yaml
      0002-implementation.yaml
      0003-review.yaml
      0004-fix.yaml
      0005-review.yaml
      0006-finish.yaml

    reviews/
      review-0003.md
      review-0005.md

    snapshots/
      pr-draft-0002.md
      pr-draft-0004.md

    projections/
      implementation-log.md
      pr-draft.md
      latest-status.yaml

  The exact extension can follow the tracker skill. The important rules are:

  • events/ is append-only.
  • reviews/ is append-only.
  • snapshots/ is append-only.
  • projections/ may be regenerated.
  • Every artifact records its parent event.
  • Every artifact records the source commit or tree SHA.
  • Every artifact records the ticket and branch.
  • Every artifact records the agent and session ID.
  • No phase may rely on chat as a handoff.

  ## 2. Mutable projections

  These are convenience views derived from the immutable records:

  projections/pr-draft.md
  projections/implementation-log.md
  projections/latest-status.yaml

  The draft PR should be updated after implementation and each successful fix. It should not be the source of truth.

  The source of truth is the event and snapshot history.

  ---

  # Required receipt fields

  Use a common receipt schema for all phases.

  schema: worktree-receipt/v1
  receipt_id: review-0003
  ticket: ABC-123
  workflow_id: ABC-123
  phase: review
  attempt: 1
  parent_receipt: implementation-0002

  repository: /absolute/path/to/repository
  worktree: /absolute/path/to/worktree
  source_branch: feature/ABC-123-example
  base_branch: main

  source_commit: 0123456789abcdef
  source_tree: 0123456789abcdef
  created_at: 2026-09-29T12:00:00Z

  muxer: hrdx
  workspace_path: /absolute/path/to/worktree
  pane_id: 42
  agent: pi
  session_id: session-id-if-available

  ticket_path: ...
  context_root: ...
  context_storage: shared

  inputs:
    - ticket
    - adr-001
    - context-file
    - implementation-receipt:implementation-0002
    - source_commit:0123456789abcdef

  outputs:
    - review-artifact:reviews/review-0003.md

  status: FAILURE

  For implementation receipts, add:

  changed_files:
    - path/to/file.ts

  validation:
    - command: mise run test
      result: passed

  implementation_summary: ...
  open_questions: ...

  For review receipts, add:

  verdict: FAILURE
  findings:
    - id: F-001
      severity: blocking
      adr: ADR-004
      file: path/to/file.ts
      line: 42
      description: ...
      required_change: ...
      validation_command: ...

  For fix receipts, add:

  consumed_reviews:
    - review-0003

  resolved_findings:
    - F-001

  unresolved_findings: []

  validation:
    - command: mise run test
      result: passed

  ---

  # Command behavior changes

  ## `start X`

  The start playbook should:

  1. Resolve the ticket and context.
  2. Create the Worktrunk worktree.
  3. Create a workflow record.
  4. Launch one implementation session.
  5. Pass the handoff file as input.
  6. Require the implementation agent to:
     • implement the ticket;
     • run validation;
     • create an immutable implementation receipt;
     • create a versioned draft PR snapshot;
     • update the PR projection;
     • return a completion marker.
  7. Close the implementation pane after completion.
  8. Keep the worktree and workspace available for review.

  The implementation agent should not write only to /tmp. /tmp can contain a generated handoff, but the durable receipt must go to the tracker-defined or
  shared-context-defined location.

  Add a completion requirement such as:

  WORKTREE_IMPLEMENTATION_DONE

  The marker is only a process signal. The receipt is the authoritative result.

  ---

  ## `review X`

  Change the current review behavior completely.

  The review playbook should:

  1. Resolve the ticket.
  2. Locate the workflow record.
  3. Read the latest implementation receipt.
  4. Resolve the current source commit.
  5. Freeze the review target to a commit SHA.
  6. Open a new pane or tab in the existing worktree workspace.
  7. Launch a fresh review agent session.
  8. Pass a review handoff containing:
     • ticket;
     • issue requirements;
     • ADRs and context;
     • implementation receipt;
     • draft PR snapshot;
     • source branch;
     • source commit;
     • exact review artifact path.
  9. Require the reviewer to inspect the actual diff at the frozen SHA.
  10. Require a new immutable review artifact.
  11. Close the review pane after completion.
  12. Update the workflow projection.

  The review agent must not use the implementation session. It must not send text to the existing implementation pane.

  For hrdx, this means using:

  {
    "method": "pane.create",
    "params": {
      "workspace": "/absolute/path/to/worktree",
      "kind": "pi",
      "split": "tab"
    }
  }

  Then launch the new session in the returned pane.

  Do not use:

  {
    "method": "pane.send_text"
  }

  against the existing implementation pane.

  Use the absolute worktree path. The hrdx contract correctly warns against using workspace names because names can collide.

  ---

  ## `fix X`

  The fix playbook should:

  1. Require the latest persisted FAILURE review receipt.
  2. Read the latest review artifact.
  3. Read the implementation receipt and current draft snapshot.
  4. Confirm that the source branch is still the expected branch.
  5. Open a new pane or tab.
  6. Launch a fresh fixer session.
  7. Pass only the required findings plus the relevant project context.
  8. Require the fixer to:
     • resolve blocking findings;
     • run validation;
     • write an immutable fix receipt;
     • write a new PR draft snapshot;
     • update the PR projection.
  9. Close the fixer pane.
  10. Automatically start a new fresh review session, or report the exact review command if you want manual control.

  The fixer must not resume the failed reviewer session.

  Use a chain like:

  review-0003
    ↓
  fix-0004
    ↓
  review-0005

  The next reviewer must explicitly consume fix-0004 and review the new source commit.

  ---

  ## `finish X`

  The finish playbook should:

  1. Require the latest review receipt to have:

  verdict: SUCCESS

  2. Confirm that the receipt covers the current source commit.
  3. Confirm that no later source changes exist.
  4. Run the recorded validation command.
  5. Update the final PR projection.
  6. Write a final immutable finish receipt.
  7. Stop all agent panes in the worktree workspace.
  8. Switch to the main worktree.
  9. Squash merge with Worktrunk.
  10. Push the base branch.
  11. Complete the ticket.
  12. Remove the worktree.
  13. Close the hrdx workspace.

  Do not remove the workspace before the push and ticket update succeed.

  The final receipt should include:

  merged_commit: ...
  pushed: true
  ticket_completed: true
  worktree_removed: true
  workspace_closed: true

  If any step fails, keep the worktree and preserve the receipts.

  ---

  # Review artifact changes

  The current review playbook says to overwrite the prior review artifact. That should change.

  Replace:

  ┃ “overwriting the prior artifact for this ticket”

  with:

  ┃ Create a new immutable review artifact for every review attempt. Never overwrite an earlier review. The latest review is selected through the workflow record
  and must identify the exact source commit it examined.

  This is important because a FAILURE review must remain available after a later SUCCESS.

  A review should also distinguish:

  review verdict
  - SUCCESS: no blocking findings
  - FAILURE: one or more blocking findings

  Do not use the draft PR as the verdict source.

  ---

  # Draft PR rules

  The draft PR should be a projection, not a handoff document.

  Each implementation or fix session should create a snapshot:

  snapshots/pr-draft-0002.md
  snapshots/pr-draft-0004.md

  Then regenerate:

  projections/pr-draft.md

  The projection should contain:

  • ticket summary;
  • problem statement;
  • implementation summary;
  • files changed;
  • validation;
  • review history;
  • resolved findings;
  • remaining findings;
  • final reviewer verdict;
  • merge status.

  The draft must link to the receipts and review artifacts. For example:

  ## Review history

  - [Review 0003](../reviews/review-0003.md): FAILURE
  - [Fix 0004](../events/0004-fix.yaml): completed
  - [Review 0005](../reviews/review-0005.md): SUCCESS

  This prevents the PR description from losing history when it is updated.

  ---

  # Workflow state machine

  Add an explicit state machine to the skill.

  CREATED
    → IMPLEMENTING
    → IMPLEMENTED
    → REVIEWING
    → REVIEW_FAILED
    → FIXING
    → FIXED
    → REVIEWING
    → REVIEW_PASSED
    → FINISHING
    → FINISHED

  Invalid transitions should fail clearly.

  Examples:

  review before implementation receipt     → reject
  fix without latest FAILURE review         → reject
  finish with stale SUCCESS review          → reject
  finish after source changed               → reject
  second start for active workflow          → reject
  review while implementation pane runs    → either wait or reject

  The state should be derived from immutable receipts where possible. A mutable latest-status.yaml can provide a fast lookup, but must not override the event
  history.

  ---

  # Recommended edits to the skill

  ## `references/playbooks/review.md`

  Change the opening description to:

  Review completed work in a fresh agent session. The reviewer MUST run in a
  new pane or tab and MUST NOT reuse the implementation or fixer session.

  Add:

  • fresh-session requirement;
  • commit SHA freeze;
  • review handoff receipt;
  • immutable review artifact;
  • pane close procedure;
  • parent receipt;
  • no chat-only verdicts.

  ## `references/playbooks/fix.md`

  Add:

  • fresh-session requirement;
  • parent_receipt;
  • consumed_reviews;
  • immutable fix receipt;
  • new draft snapshot;
  • new source commit requirement;
  • explicit pane close procedure.

  ## `references/playbooks/start.md`

  Add:

  • implementation receipt;
  • draft PR snapshot;
  • implementation completion marker;
  • pane close procedure;
  • durable handoff location;
  • source commit recorded after implementation.

  ## `references/playbooks/finish.md`

  Add:

  • latest-success commit check;
  • final receipt;
  • final draft projection;
  • squash configuration check;
  • workspace close after Worktrunk removal;
  • preservation of the workspace on failure.

  ## `SKILL.md`

  Add a global rule:

  Every start, review, fix, and finish phase MUST create a durable receipt.
  Receipts are append-only and immutable. Chat output, pane output, temporary
  handoff files, and mutable projections are not authoritative workflow state.

  Add another:

  Review and fix MUST launch a fresh agent session in the existing worktree
  workspace. They MUST NOT send instructions to, resume, or reuse the previous
  implementation, review, or fixer session.

  ---

  # Priority order

  I would implement this in four steps:

  1. Change review and fix to use fresh sessions.
     This fixes the immediate context contamination problem.

  2. Introduce immutable receipts and review attempts.
     This fixes lost history and unreliable handoffs.

  3. Freeze review targets by commit SHA.
     This prevents a reviewer from unknowingly reviewing a moving branch.

  4. Make draft PR content a generated projection.
     This preserves a useful current PR description without making it the source of truth.

  The most important invariant is:

  ┃ Every phase gets a new session, reads durable artifacts, writes a new receipt, and links its result to the exact source commit it inspected or changed.

  ---

  # Post-review correlation

  The worktree skill changed after this review. Commit `aec2a692` added fresh
  review and fix sessions, append-only receipts, commit-scoped review
  validation, and projection rules.

  The current Worktrunk configuration has:

  ```toml
  [merge]
  squash = true
  ```

  The remaining design gaps were addressed as follows:

  • `fix` now checks the current branch against the consumed review receipt;
  • receipt `inputs` and `outputs` are now standardized;
  • projection contents are now defined;
  • terminal finish receipt fields are now defined;
  • the receipt history is the workflow record;
  • review artifacts use the tracker path or the `reviews/` fallback directory.
