---
schema: collect-evidence/v1
kind: case
---
# Case a.b

Observe identity a.b

## Step a.b.1

navigate

Expected: null

Observed: Page loaded.

Assertion: not-applicable

## Step a.b.2

expect

Expected: {"text":"Identity a.b","visible":null,"url":null}

Observed: Captured before expect.; Found text: Identity a.b

Assertion: passed

![Capture 1 for step a.b.2](media/step-002-step-a-b-002-distinct-identity--capture-001--capture-001.png)

![Capture 2 for step a.b.2](media/step-002-step-a-b-002-distinct-identity--capture-002--capture-002.png)

Limits: Capture time and viewport are unknown when the driver did not record them.; Only executed expect evidence with assertionPassed=true can establish a passing assertion.

