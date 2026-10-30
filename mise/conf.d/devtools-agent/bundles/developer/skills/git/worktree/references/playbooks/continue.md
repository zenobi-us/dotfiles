# Playbook: continue

`continue` resumes an in-flight ticket by finding its last known state and re-dispatching to the correct next subcommand's playbook.

## Ticket resolution

Run the shared-context CLI from the repository before reading tracker
configuration, workflow records, or review artifacts. Use its reported
alignment `root` as `ALIGNMENT_ROOT` and read
`docs/agents/issue-tracker.md` from that root. Load `references/issue-tracker.md`
and the ticket skill. Resolve the selector and return the canonical ticket
`ref` and backend. Then run
`shared-context resolve workflow --id <ticket-id>`. Do not derive paths. Ask
when the selector is missing or ambiguous.

## Process

1. Resolve the canonical ticket and workflow location without creating storage.
2. Resolve the absolute installed `WORKTREE_SKILL_ROOT`. From the repository or surviving base worktree, run `"$WORKTREE_SKILL_ROOT/scripts/inspect.ts" <canonical-ticket-ref> --json`.
3. Follow that shared decision and `references/receipts.md`'s recovery modes and execution gates. Do not infer next action from review filenames, claim status, or a submit receipt. Inspection does not mutate anything.
4. Observe active work; obtain explicit scoped takeover approval for unknown/different ownership and reconcile active reservations before mutation. Reconcile valid child results without rerunning them; use fresh sessions for missing/unusable start, review, or fix results as directed by the decision.
5. Dispatch the recommended action's playbook with the same canonical ticket, parent receipt and inputs. Offer only reported alternatives, subject to publication policy. Reinspect there before execution. A completed ticket or removed source worktree may still require finish reconciliation with durable mapping evidence. A submitted PR is not completion; preserve any human merge gate.
6. For `blocked`, report the exact missing evidence; for `complete`, report verified completion without mutation. Never fabricate receipts or automatically terminate a session.

## Unchanged

Whatever playbook `continue` dispatches to carries its own full Preconditions, Process, and Safety rules. `continue` only decides which one to call.
