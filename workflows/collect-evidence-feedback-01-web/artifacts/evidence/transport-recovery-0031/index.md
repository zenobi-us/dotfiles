---
kind: evidence
schema: collect-evidence/v1
title: Blocked delivery and owned native trace
type: Evidence
---

# Blocked-result delivery and native trace recovery

The public writer now delivers blocked and failed reviews without a fabricated verdict. Completed reviews and explicit verdict values remain validated. The shared decision reconciles non-completed child results before a retry.

The scoped protocol suite passed 49 tests and 244 expectations. The original blocked review-0029 was delivered through the installed writer and independently read back with its original status and no verdict. This is not acceptance of collect-evidence.

[Historical owned native trace](native-request-trace.json) correlates the original Surf failure to request cli-1794260360730 and session ce-10659c4a-9e18-4ccb-ab91-66cb6aac8620. Queue wait was 0 milliseconds. The native host hard deadline fired after 60041 milliseconds on the acquired tab lane. The underlying missing navigation completion remains unexplained. No failing workflow was rerun and no service was restarted or modified.

The raw mixed-session native log remains outside the repository. Only the owned audit events and body-free extension event notices from the bounded failure interval were exported. Original capture times were preserved; collectedAt identifies this extraction. This is an audit excerpt, not a new screenshot or video run.

