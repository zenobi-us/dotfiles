---
schema: collect-evidence/v1
kind: case
---
# Case a-b

Preserve identity a-b

## Step a-b.1

Open the case-specific page without a screenshot

Expected: null

Observed: Page loaded.

Assertion: not-applicable

## Step a-b.2

Check the case-specific URL

Expected: {"text":null,"visible":null,"url":"case=a-b$"}

Observed: Captured before expect.; URL matched: http://127.0.0.1:44339/?case=a-b

Assertion: passed

## Step a-b.3

Capture the case-specific heading

Expected: null

Observed: Read: Owned evidence test

Assertion: not-applicable

![Capture 1 for step a-b.2](media/step-002-step-a-b-002-case-identity--capture-001--capture-001.png)

![Capture 2 for step a-b.2](media/step-002-step-a-b-002-case-identity--capture-002--capture-002.png)

![Capture 1 for step a-b.3](media/step-003-step-a-b-003-identity-capture--capture-001--capture-001.png)

Limits: Capture time and viewport are unknown when the driver did not record them.; Only executed expect evidence with assertionPassed=true can establish a passing assertion.; Video is unavailable with the Surf driver. Image captures remain valid.

