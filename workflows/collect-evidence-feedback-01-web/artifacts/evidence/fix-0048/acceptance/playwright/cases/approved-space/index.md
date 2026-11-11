---
schema: collect-evidence/v1
kind: case
---
# Case approved-space

Permit approved keyboard confirmation

## Step approved-space.1

Open the confirmation page

Expected: null

Observed: Page loaded.

Assertion: not-applicable

## Step approved-space.2

Activate the approved confirmation

Expected: null

Observed: Pressed Space.

Assertion: not-applicable

## Step approved-space.3

Check submission

Expected: {"text":"Submitted","visible":null,"url":null}

Observed: Captured before expect.; Found text: Submitted

Assertion: passed

![Capture 1 for step approved-space.3](media/step-003-step-approved-space-003-keyboard-submitted--capture-001--capture-001.png)

![Capture 2 for step approved-space.3](media/step-003-step-approved-space-003-keyboard-submitted--capture-002--capture-002.png)

Limits: Capture time and viewport are unknown when the driver did not record them.; Only executed expect evidence with assertionPassed=true can establish a passing assertion.

