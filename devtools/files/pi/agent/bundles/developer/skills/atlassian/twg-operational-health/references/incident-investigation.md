---
description: >
  Active production/service incident, outage, degradation, SEV review, and
  customer-impacting operational event investigation workflow for
  identification, triage, diagnosis, impact, responder routing, mitigation, and
  recovery.
---

# Incident Investigation And Mitigation

Use this reference before a PIR is complete, or when the user asks what is
happening, who should investigate, how to reproduce, what changed, what is
affected, or how to mitigate.

## Incident Phase Model

Use industry phase names rather than local shorthand. There is no universal
`T1`/`T2`/`T3` incident timeline standard that a non-Atlassian reader should be
expected to know. These are logical phases, not guaranteed timestamps:

- `Event or impact start`: the failure begins; may be a deploy, feature flag,
  config, data change, dependency, capacity pattern, abuse event, or unknown.
- `Identify and log`: human or system detects the issue and creates an incident
  record.
- `Triage and prioritize`: responders assess severity, customer impact, affected
  product/service, urgency, and escalation path.
- `Investigate and diagnose`: responders reproduce or confirm the problem,
  narrow hypotheses, and identify likely owner/service/change surfaces.
- `Mitigate or contain`: responders identify and execute the recovery path. This
  may not be root cause.
- `Resolve and recover`: service is restored, monitored for stability, and
  handoff facts are captured for post-incident learning.

The goal is to reduce uncertainty and restore service. Do not wait for perfect
root cause before proposing mitigations.

## Directional Investigation Mode

Run from partial evidence. Incident tickets and Slack threads often contain
breadcrumbs without explicit RCA labels: a pasted dashboard, a rollback note, a
feature flag mention, an error phrase, or a responder asking the right owner to
look. Use those traces to make directional progress.

Each run should:

- Surface plausible hypotheses even when no source says "confirmed".
- Label each claim as `hint`, `supported`, `confirmed`, or `missing`.
- Pair each hypothesis with confidence, the next check, and a rerun trigger.
- Keep weak signals visible without overstating causality.
- Improve on rerun as new comments, dashboard links, change evidence, or
  mitigation results appear.

Use `confirmed` only when the source actually establishes the fact. For active
investigation, prefer precise labels such as `conversation hint`, `incident
field`, `responder observation`, `change correlation`, `observability signal`,
`topology/impact evidence`, `historical similarity`, `post-incident review`, or
`post-incident action item`.

## First Pass

Start from the incident key, alert, service, customer, team, or time window.
Resolve the user's incident-management system, site/cloud/workspace, and issue
or incident key before querying. Infer missing site/cloud/workspace inputs from
strong evidence before asking: a pasted incident URL, a product-native link, a
search result that carries a single canonical host, prior command output for
the same incident, or multiple ticket/comment links pointing to the same site.
When the evidence is strong, proceed and state the inferred anchor with its
source. Ask the user only when evidence is weak or conflicting, such as a bare
issue key with no site, multiple plausible sites, a project key reused across
tenants, or a site-specific severity field that cannot be discovered from a
hydrated candidate. Do not guess a default.

Use live help for the current command shape before hydrating incident records
or querying by severity. For JSM-backed incidents, inspect `twg help jsm
incident`; for Jira-backed incident records, inspect `twg help jira workitem
get` or `twg help jira workitem query`.

For severity-scoped analysis, do not use Jira `priority` as a proxy for
incident severity unless the project explicitly defines it that way. Hydrate a
candidate incident first, discover the severity field label or metadata, then
apply a project/site-specific query only after the field is known.

Use native issue or incident data for status, description, comments, labels,
affected products, faulty service, support links, responders, and linked
post-incident review or action records. Use context only after the incident
anchor is selected.

## Sparse Anchor Expansion

Treat the incident workitem as the anchor, not the complete investigation. At
incident time the ticket may only contain symptoms, paging comments, or a rough
service guess. If the ticket does not already cover the four signal families,
run bounded follow-up probes before synthesizing:

- Context perimeter: linked PRs, commits, deployments, branches, builds, docs,
  dashboards, alerts, chats, related incidents, and post-incident records around
  the incident anchor.
- Change probes: code search, PR/commit/deploy lookups, release or build
  history, feature-flag/config links, and rollback or flag-off evidence near
  the impact window.
- Service/impact probes: service record, owner/escalation evidence, affected
  products, upstream/downstream services, topology/service graph, Assets, and
  support/customer blast-radius clues.
- Observability probes: linked dashboards, alerts, metric/log/trace links,
  pasted queries, error fingerprints, SLO symptoms, capacity/queue/saturation
  signals, and similar anomalies.
- Resources/history probes: runbooks, incident/PIR history, docs, chat threads,
  on-call schedules, SMEs, and similar incidents by service, symptom, change
  class, or error text.

For each family, record whether it was `probed`, `not available`, or `needs
user/tool context`. Do not over-fetch. One good probe per missing family is
often enough to move the investigation forward. If a surface is unavailable or
returns no evidence, keep the gap visible with the next best query or owner to
ask.

## Investigation Surfaces

Collect a bounded evidence set across the four RCA signal families:

- Change: deploys, PRs, commits, releases, feature flags, config changes,
  migrations, backfills, data contracts, dependency releases, scheduled
  maintenance, and rollback/flag-off attempts.
- Service/impact: affected products, customers, faulty service, upstream and
  downstream services, horizontal dependencies, vertical infra dependencies,
  service topology, service graph/registry/Assets, traces, and blast radius.
- Observability: linked alert/log/metric dashboards, SLOs, error rates, queue
  depth, capacity, saturation, latency, traces, customer reports, telemetry
  fingerprints, and similar anomalies elsewhere in the system.
- Resources/history: incident details, responders, escalation labels, support
  links, chat threads, runbooks, docs, on-call schedules, experts, and recent
  incidents/post-incident reviews with matching service, symptom, change class,
  alert, error message, or affected product.

Avoid broad cross-product inventory. Add a surface only when it can change
severity, ownership, reproduction, mitigation, or next action.

## Four-Signal Evidence Matrix

Produce a compact matrix before the theory table. Use it even when some
dimensions are sparse:

| Dimension | Signal or hint | Source | What it suggests | Check to confirm | Confidence | Rerun trigger |
| --- | --- | --- | --- | --- | --- | --- |
| Change | PR/deploy/flag/config near impact | ticket, PR, release, flag, comms | candidate trigger or rollback path | compare deploy time, owner, rollback result | low/med/high | new deploy/rollback/flag result |
| Service/impact | upstream/downstream or infra boundary | incident fields, topology, traces, service registry | blast radius and likely owner | inspect topology, caller/callee, affected tenants | low/med/high | new impacted service/customer |
| Observability | metric/log/trace/error fingerprint | dashboard, alert, pasted query, customer report | failure mode and correlation window | query baseline, compare similar events | low/med/high | new spike, alert, trace, log sample |
| Resources/history | runbook, SME, past incident, current thread | docs, on-call, chat, incident/postmortem history | known mitigation or similar cause | read matched runbook/postmortem, ask SME | low/med/high | new expert update or similar match |

Do not require all four dimensions before advising responders. Missing
dimensions become targeted next checks.

## Working Theories

Maintain a theory table. Each row should include:

- Hypothesis: concrete failure mechanism, not just an area.
- Evidence for and against.
- Test or query to confirm/falsify.
- Owner for the next check.
- Confidence: low/medium/high.
- Mitigation candidate if the hypothesis is true.
- Supporting signal families and which ones are still missing.

Examples of good active-incident hypotheses:

- A rollout changed a code path; rollback or flag-off should restore service.
- Capacity or queue depth crossed a threshold; scale-out or traffic shaping may
  mitigate while root cause remains open.
- A dependency/API started returning unexpected status codes; fallback or retry
  adjustment may mitigate.
- Data or bootstrap drift dropped/misrouted events; targeted replay/backfill may
  mitigate.

## Mitigation Is Not Root Cause

Classify the recovery action separately:

- `rollback/revert`
- `feature flag off/change`
- `scale up/out`
- `restart/failover`
- `config change`
- `data repair/bootstrap/backfill/replay`
- `dependency workaround`
- `customer/workflow workaround`
- `no action/self-recovered`

Turning off a feature flag, rolling back, or scaling out is usually mitigation.
It is root cause only when the evidence explains why that change caused the
failure and why the mitigation removes the causal mechanism.

## Output Shape

For an active incident:

- Current read: severity, status, impact, affected customers/products, owner.
- Probe coverage: which golden-signal families were checked, what each added,
  and which remain missing or need user/tool context.
- Four-signal evidence matrix with source, confidence, next check, and rerun
  trigger.
- Timeline: event/impact start, detection/logging, triage, investigation,
  mitigation, and recovery, with unknowns called out.
- Working theory table.
- Reproduction/confirmation plan.
- Mitigation options ranked by speed, confidence, blast radius, and reversibility.
- Escalation map and next 30/60 minute checks.
- Root-cause status: `unknown`, `candidate`, `confirmed`, or `not needed yet`.
- Evidence provenance for each claim: `conversation hint`, `incident comms`,
  `incident field`, `dashboard/link`, `change correlation`, `topology/impact
  evidence`, `responder comment`, `historical similarity`, `post-incident
  review`, or `post-incident action item`. In pre-PIR work, prefer `hint`,
  `supported`, or `candidate` unless the incident evidence itself confirms the
  fact.

For a newly mitigated incident:

- What restored service and evidence that it worked.
- What remains unknown.
- Follow-up data needed before post-incident root-cause analysis.
- Suggested rerun triggers: new incident comment, chat update, dashboard/log
  evidence, mitigation result, deploy/rollback/flag change, ownership update,
  or linked post-incident review/action item creation.

## Anti-Patterns

- Do not assert root cause from the first successful mitigation.
- Do not chase every linked doc, dashboard, or Slack thread.
- Do not wait for chat or incident comments to label something as RCA before
  using it as a directional clue.
- Do not discard weak traces when they suggest a concrete next check.
- Do not collapse change, service/impact, observability, and resources/history
  into a single undifferentiated guess.
- Do not treat correlation as causation without a confirming check.
- Do not summarize bot escalation comments as human diagnosis.
- Do not hide uncertainty; make it actionable.
- Do not wait for post-incident review fields to exist before helping
  responders investigate.
