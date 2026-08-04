---
name: twg-responsibility-routing
description: >
  Use with root `twg` to route owners, subject-matter experts, maintainers,
  reviewers, approvers, decision authorities, Heads of Engineering, or
  escalation paths for a topic, area, ask, project, service, or component.
---

# twg-responsibility-routing

Use the root `twg` skill. Use this workflow to answer “who should I involve,
why them, and in what role?” Do not assume a broad topic is an exact product.

## CLI launcher fallback

Run `twg <command>`. On shell `command not found`, use `$HOME/.local/bin/twg`
(macOS/Linux) / `$env:LOCALAPPDATA\Programs\twg\bin\twg.exe` (PowerShell), then
tell user to add that directory to PATH. Do not treat auth or command errors as
PATH failures.

## Classify The Role

Keep these roles distinct:

- **Declared owner**: formally accountable for an entity or area.
- **Operational owner or maintainer**: responsible for current delivery or operation.
- **Expert**: has source-backed depth in one workstream.
- **Reviewer or consulted party**: evaluates or advises but may not decide.
- **Approver or decision authority**: can authorize the specific ask or decision.
- **Escalation or Head of Engineering contact**: leads the responsible engineering
  organization or can route an unresolved ask.
- **Informed stakeholder**: affected by the decision but not responsible for it.

## Resolve Scope Before People

For a fuzzy topic or area, compare one bounded
`twg search "<topic>" --app confluence` pass with one bounded
`twg work search "<topic>"` pass. Group same-named results into distinct
initiative, platform, domain, feature, and team clusters. Hydrate 2-5 central
charters, roadmaps, services, projects, or active workstreams before ranking
people. If the sources disagree, show the alternative scopes or ask the user.

For a stable project, goal, component, service, work item, page, or repository,
use that reference directly.

## Find Responsibility And Authority

- Use `twg responsibility get <reference>` for declared owners, teams,
  maintainers, approvers, reviewers, or escalation roles.
- Use `twg responsibility infer <reference>` only when declared responsibility
  is missing or the user asks for evidence-based candidates. Preserve confidence,
  reason codes, evidence window, and declared-versus-observed status.
- Infer primarily from scoped search, declared roles, and hydrated work evidence.
  Org data is optional; do not block or weaken the workflow merely because it is
  unavailable.
- When org data is connected and a candidate leader or manager is known, prefer
  the narrowest useful tree: `org-tree` for hierarchy, `work-tree` for
  cross-surface breadth, `workitem-tree` for Jira work, or `pr-tree` for PR
  authorship/review. Tree counts help validate reach and organizational scope;
  they do not by themselves prove expertise, ownership, or approval authority.
- For an approval ask, inspect the artifact that defines the decision: project or
  goal ownership, Jira workflow/approver fields, charter, decision record, or
  accountable team. State separately who can recommend, who must be consulted,
  and who can approve. Never promote an active contributor into an approver.
- For escalation, give the nearest verified owner first. Add the engineering
  leader only when the owner is missing, blocked, cross-team, or the ask needs
  organizational authority.

Use `twg-context-discovery` only when relationship or dependency expansion is
needed after the scope and people roles are established. It is not the default
route for a responsibility question.

## Evidence And Output

Strong evidence includes explicit ownership, accountable roles, workflow
authority, charter/roadmap leadership, service ownership, sustained decisions,
or repeated central contributions. Profile text, org proximity, one document,
raw activity, or a self-authored update is weak evidence by itself.

For topic/SME maps, return at most five workstreams and one primary expert per
workstream unless the user asks for more. Name an overall owner only with
cross-workstream evidence. For approval or escalation asks, return the proposed
contact, role, scope, evidence, confidence, why they are appropriate, and a
suggested question or reach-out. State when authority is unconfirmed.

Stop when another search would not change scope, role, authority, escalation,
confidence, or the recommended contact.
