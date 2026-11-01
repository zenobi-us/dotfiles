# Fictional acceptance report example

This is an authored example, not a record of executed checks. The example.invalid URLs deliberately do not identify a live workspace.
Set the Outline document title to QA-42 — Sign-in acceptance report. Copy only the body below when adapting the example.
Heading links shown here illustrate the shape; capture and verify the real Outline heading links after rendering.

## Block-selection notes — not report content

The body below uses a result table, evidence image, and durable file links. The pending cleanup is an unchecked task with an owner.
For this report, F01 fits a warning notice once its encoding and rendering are verified; C02 still remains Fail, not Warn.
The C03 gap fits an info notice, but Not covered stays expanded. With unverified notice syntax, keep the visible paragraphs shown below.
No long optional diagnostic excerpt, complex calculation, temporal sequence, or video is needed here, so toggles, math, diagrams, and video would add no value.
Do not copy these authoring notes into the report.

---

Purpose: Decide whether build 2.4.1 is ready for internal acceptance.

Audience: Release reviewer
Owner: Identity team
Ticket: QA-42
Environment: Staging, synthetic accounts only
Tested version: 2.4.1
Observed at: 2026-11-01T08:00:00Z

## Result summary

| Check | Claim | Result | Evidence |
|---|---|---|---|
| C01 | [Valid sign-in reached the dashboard](https://example.invalid/doc/qa-42#c01) | Pass | 10-dashboard.png |
| C02 | [Expired session returned 401](https://example.invalid/doc/qa-42#c02) | Fail | 20-expired-session.json |
| C03 | [Password reset delivery](https://example.invalid/doc/qa-42#c03) | Info | Not run |

## C01 — Valid sign-in reached the dashboard

Result: Pass
Observed at: 2026-11-01T08:00:00Z

Steps: Signed in with the synthetic staging account, then reloaded the dashboard.
Expected: The account reached the dashboard and remained signed in.
Observed: The dashboard displayed the synthetic account after reload.

![Dashboard showing the synthetic account and account menu](https://example.invalid/api/attachments.redirect?id=synthetic-image)

Evidence: 10-dashboard.png showed the authenticated dashboard after reload.
Why this proves it: The authenticated account remained visible after a new page load, not just after submitting the form.

## C02 — Expired session returned 401

Result: Fail
Observed at: 2026-11-01T08:02:00Z

Input: Requested the staging profile endpoint using an expired synthetic session.
Expected: HTTP 401 with no profile data.
Observed: HTTP 200 returned the synthetic account's profile.
Evidence: [Redacted request and response](https://example.invalid/api/attachments.redirect?id=synthetic-response).
Why this proves it: The request used an expired session, yet the response returned profile data.

## C03 — Password reset delivery

Result: Info
Observed at: Not run

Expected: A synthetic account received a usable reset message.
Observed: The staging mail service was unavailable.
Evidence: None collected.
Why this proves it: No delivery conclusion was possible.

## Findings

F01: Expired sessions could retrieve profile data in staging. Owner: Identity team. Follow-up: QA-43.

## Not covered

C03 did not run. Risk: Reset messages may fail to arrive or contain unusable links.
Production identity-provider integration was not exercised. Risk: Staging results do not establish production compatibility.

## Test data left behind

- [ ] Identity team: delete the synthetic staging account after QA-43 reproduction.

The account remained at the observation time. No production data changed.

## Companion artifacts

[Redacted session request and response](https://example.invalid/api/attachments.redirect?id=synthetic-response).
The attachment contains no real account details or session credentials.

## Update history

2026-11-01T08:05:00Z: Initial observation set. C02 failed; C03 remained untested. No retest has superseded these results.
