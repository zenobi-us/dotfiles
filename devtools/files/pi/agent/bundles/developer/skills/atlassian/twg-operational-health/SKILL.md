---
name: twg-operational-health
description: >
  Use with the root `twg` skill for on-call handoffs, incident response and
  investigation, post-incident reviews, reliability reviews, Assets refresh,
  capacity views, meeting summaries, and operational risk readouts.
---

# twg-operational-health

Use together with the root `twg` skill. Exact command grammar comes from live
`twg help` or `twg help describe <path>`.

## CLI launcher fallback

Run `twg <command>`. On shell `command not found`, use `$HOME/.local/bin/twg`
(macOS/Linux) / `$env:LOCALAPPDATA\Programs\twg\bin\twg.exe` (PowerShell), then
tell user to add that directory to PATH. Do not treat auth or command errors as
PATH failures.

## Use When

- "I'm taking over on-call"
- "Reliability, incident, SEV, or post-incident review readout"
- "Investigate an active incident and find mitigation"
- "Analyze root cause or draft postmortem/PIR learning/action items"
- "Open risks, blockers, overloaded people, operational health"

## First Move

Resolve scope, window, anchors, owner/escalation path, status, recency, and
follow-ups. Find the operational anchor before joining relevant surfaces.
Run without `--site`; TWG inherits the user's pinned Jira/JSM site. Only add a
site override when the user explicitly requests another tenant. Never assume a
vendor-internal incident site.

## Evidence Policy

- Rank by impact, urgency, owner clarity, recurrence risk, and actionability;
  separate live risks from historical mentions.
- Cluster compact incident, PIR, follow-up, runbook, owner, asset, or meeting
  evidence by service, theme, owner, and recency. Hydrate highest-risk clusters;
  stop once theme, owner signal, and confidence are clear.
- Separate `working theory`, `confirmed problem`, `mitigation`, and `root
  cause`. Require a causal mechanism for confirmed root cause; a closed record
  is insufficient. Mark claims `confirmed`, `supported`, `candidate`, or
  `missing evidence`; use references for RCA details.
- After one correction of a repeated backend, auth, or schema error, report the
  gap and use remaining evidence instead of nearby aliases or broad inventories.

## Recipe Cards

### Leadership Reliability Review / On-Call Handoff

Load `references/reliability-review.md`. Resolve leader, platform, and window;
cluster supported themes, separate cause from mitigation, connect prevention
work, and rank leadership actions. For handoffs, add a first-hour checklist and
escalation map.

### Incident Investigation / Mitigation

Use when the incident is active, newly mitigated, or pre-PIR. Anchor on the
incident record, then pull responders, symptoms, impact, recent
deploys/flags/config, topology, alert/log/metric pointers, ownership, runbooks,
and similar incidents. If ticket fields are sparse, probe the four golden-signal
families with bounded follow-ups. See `references/incident-investigation.md`.
Output a four-signal matrix, hypotheses, confidence, next checks, and mitigation
options; never call a mitigation the root cause without the causal mechanism.

### Post-Incident Root Cause / Learning

Use after mitigation/recovery when drafting or evaluating a postmortem/PIR. Pair
the incident with the PIR, linked docs, final comms, remediation PRs, and action
items; cover confirmed mitigation, causal mechanism, 5-why chain, and
detection/response gaps. See `references/pir-root-cause.md`. Output root cause,
contributing factors, mitigation-versus-cause, and prioritized actions.

### Assets / Asset Refresh

Build contributors from project/goal/Jira/PR/doc/activity evidence. Inspect
Assets schema/type metadata before AQL; join people via discovered user-like
attributes such as `Calculated user`. Rank by contribution centrality plus asset
risk, and report confidence and gaps. See `references/assets.md`.

### Capacity / Staffing / Meetings

For staffing, resolve project/topic/org and identify people by related work,
ownership, review influence, docs, and project/goal involvement; check load
  before recommending. For meetings, query scoped recordings, preview transcripts
  first, fetch full transcripts only for central ones, then summarize decisions,
  action items, and gaps.

## Output Shape

- Lead with severity, urgency, or recommendation, then owner, status, recency,
  impact, confidence, and evidence.
- For active investigations, add a four-signal evidence matrix and an
  incident-to-learning timeline with confirmed problem, mitigation, root-cause
  status, and prevention action.
- Group patterns across artifacts, give ranked next actions with a suggested
  owner, and call out data gaps (missing transcripts, no asset match, stale
  update, ACL/auth gaps, weak ownership).

## Anti-Patterns

- Do not fetch every transcript or page body, or treat every incident mention
  as a live risk.
- Do not wait for chat/comments to label RCA before surfacing directional
  hypotheses for pre-PIR investigation.
- Do not call mitigation root cause without an established mechanism. Do not
  treat workflow panels, bot comments, or opaque fields as RCA narrative.
- Do not use keyword matches alone as org ownership — cross-check assignee,
  service owner, PIR participants, or org-tree membership.
- Do not join Assets by display-name guesses before inspecting schema/type
  fields, or recommend staffing from activity counts alone.

## References

- `references/assets.md` - schema-first Assets queries and person/device joins
- `references/reliability-review.md` - bounded incident/PIR leadership review
- `references/incident-investigation.md` - active investigation and mitigation
- `references/pir-root-cause.md` - post-mitigation root-cause and PIR workflow
