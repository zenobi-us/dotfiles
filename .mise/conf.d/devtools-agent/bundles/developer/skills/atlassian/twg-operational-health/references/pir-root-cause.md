---
description: >
  Post-mitigation root-cause workflow for incidents, SEV reviews, PIRs,
  postmortems, causal analysis, 5-why, contributing factors, and action items.
---

# PIR Root Cause And Learning

Use this reference after mitigation, or when the user asks to draft/evaluate an
incident PIR, SEV review, post-incident review, or postmortem; identify root
cause; run 5-whys; compare against actual PIRs/postmortems; or propose
P0/P1/P2 action items.

## Post-Incident Learning Model

Use phase names rather than local shorthand. There is no universal
`T1`/`T2`/`T3` incident timeline standard that a non-Atlassian reader should be
expected to know:

- `Mitigation or recovery checkpoint`: service was restored or stabilized, and
  the recovery action is known.
- `Root-cause analysis`: the causal mechanism is identified and supported by
  evidence.
- `Learning and prevention`: contributing factors, detection gaps, and action
  items are written into post-incident review/action-item work.

The goal is not to rediscover every active-incident detail. The goal is to turn
mitigation evidence into a causal explanation and durable prevention plan.

If an active investigation produced a four-signal evidence matrix, treat it as
input, not as truth. Promote `hint` or `candidate` items only when the final
incident comms, post-incident review, remediation, or equivalent evidence
explains the causal mechanism. Preserve useful but unresolved branches as
post-incident review gaps.

## Discovery Sequence

1. Pair the incident and post-incident review. Verify linkage when it is not
   obvious. Infer site/cloud/workspace from strong evidence before asking:
   pasted incident or review URLs, product-native links, prior command output,
   or consistent linked incident/PIR hosts. Proceed when the inferred site is
   well-supported and state the source. Ask for the site/cloud/workspace,
   incident key, or review key only when evidence is weak or conflicting, such
   as bare keys with no host, multiple plausible sites, or an unverified linkage.
2. Use live help for the current command shape before hydrating JSM, Jira, or
   other incident-review records. Do not hard-code product-specific flags in
   the skill.
3. Hydrate the selected incident/review pair with full fields and comments.
4. Discover field labels before interpreting opaque custom field IDs.
5. Fetch the post-incident document only when fields/comments do not contain
   enough narrative. Hydrate linked action items and remediation PRs for
   prevention recommendations.

## Evidence Hierarchy

Prefer evidence in this order:

1. Human PIR narrative, linked PIR document, and explicit 5-why/root-cause text.
2. Root Cause Category, Recovery by, Preventable by, Faulty Service PIR,
   TTD/TTR/TTRC or detected-by-customer reason, Change PR link, Feature Flag
   link, Affected services, and related incident fields.
3. Final incident comms and human comments that name recovery and impact window.
4. Linked remediation PRs, deploys, feature-flag changes, data fixes, or rollbacks.
5. Linked post-incident action items and their priorities/status.
6. Similar past incidents, only for recurrence patterns or candidate actions.

Approved PIR descriptions may be null. That is normal. Look at full fields,
comments, linked PIR docs, issue links, and action items before concluding that
root-cause evidence is missing.

## Mitigation Versus Root Cause

Always separate:

- `Mitigation`: what restored service.
- `Immediate cause`: the proximate trigger or broken mechanism.
- `Contributing factors`: missing tests, observability gaps, unsafe rollout,
  unclear ownership, weak runbook, capacity assumption, dependency contract,
  customer-specific shard/tenant behavior, or abuse guardrail gap.
- `Systemic root cause`: why the organization/system allowed the failure to
  reach customers or remain undetected.

Mitigation equals root cause only when the mitigation directly removes the
causal mechanism and the evidence explains why. A feature flag off, rollback,
or scale-out is usually just the handoff from investigation to PIR analysis.

## 5-Why Frame

Use 5-why as a scaffold, not a ritual:

1. Why did customers/service see the symptom?
2. Why did that component behave that way?
3. Why did the triggering change/state reach production?
4. Why did detection, ownership, or rollback take that long?
5. Why were existing controls/tests/runbooks/alerts insufficient?

Stop when the next answer becomes speculative. Mark unresolved branches as PIR
gaps rather than smoothing them into a false single cause.

## Action Item Design

Classify actions by purpose and priority:

- `P0`: urgent prevention of repeat high-severity or active high-risk exposure.
- `P1`: near-term control improvement for detection, rollback, validation, or
  owner handoff.
- `P2`: durable learning, runbook, dashboard, test coverage, cleanup, or
  operational hygiene.

Good action items name the control being added or changed:

- alert/SLO on the signal that would have detected the incident,
- pre-deploy validation or release gate,
- rollback/feature-flag/runbook improvement,
- data contract or schema ownership,
- capacity guardrail or traffic isolation,
- dependency fallback/retry behavior,
- customer-impact comms or support routing improvement.

Avoid vague actions like "monitor more" or "improve testing" unless the concrete
signal, test, owner, and success criterion are named.

## Output Shape

For one incident/PIR:

- Mitigation summary and evidence that service recovered.
- Root-cause status: confirmed, partial, conflicting, or missing.
- Evidence provenance: separate `confirmed by incident comms`,
  `confirmed by post-incident review`, `confirmed by action item`, `candidate
  from incident evidence`, `directional hint from active investigation`, and
  `missing from incident evidence`.
- Causal chain with 5-why branches and confidence.
- Contributing factors by category.
- Action items grouped P0/P1/P2 with owner/status when available.
- PIR gaps: missing evidence, conflicting text, draft/canceled status, or weak
  action specificity.

For portfolio analysis:

- Incident-to-learning table with mitigation, root-cause category, prevention
  theme, action quality, and confidence.
- Repeated systemic patterns across incidents.
- Accuracy readout against actual post-incident review/action-item evidence.

## Anti-Patterns

- Do not write PIR root cause while the incident is still in detection, triage,
  or active investigation unless you label it as hypothesis.
- Do not treat "rollback fixed it" as the root cause.
- Do not collapse detection failure, response delay, and product defect into one
  undifferentiated cause.
- Do not generate P0/P1/P2 actions without tying each to a causal or control gap.
