---
schema: collect-evidence/v1
kind: case
---
# Case case

Check the owned heading

## Step case.1

Open the owned page

Expected: null

Observed: Page loaded.

Assertion: not-applicable

## Step case.2

Check the heading

Expected: {"text":"Boundary smoke ready","visible":null,"url":null}

Observed: Captured before expect.; Found text: Boundary smoke ready

Assertion: passed

![Capture 1 for step case.2](media/step-002-step-case-002-heading--capture-001--capture-001.png)

![Capture 2 for step case.2](media/step-002-step-case-002-heading--capture-002--capture-002.png)

Limits: Capture time and viewport are unknown when the driver did not record them.; Only executed expect evidence with assertionPassed=true can establish a passing assertion.

