---
schema: collect-evidence/v1
kind: case
---
# Case case-1

Inspect original evidence 1

## Step case-1.1

Open the owned page

Expected: null

Observed: Page loaded.

Assertion: not-applicable

## Step case-1.2

Read the original heading

Expected: {"text":"Original browser capture","visible":null,"url":null}

Observed: Captured before expect.; Found text: Original browser capture

Assertion: passed

![Capture 1 for step case-1.2](media/step-002-step-case-1-002-original-page--capture-001--capture-001.png)

![Capture 2 for step case-1.2](media/step-002-step-case-1-002-original-page--capture-002--capture-002.png)

Limits: Capture time and viewport are unknown when the driver did not record them.; Only executed expect evidence with assertionPassed=true can establish a passing assertion.

