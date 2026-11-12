---
schema: collect-evidence/v1
kind: case
---
# Case pass

Select the named project

## Step pass.1

Open the owned page

Expected: null

Observed: Page loaded.

Assertion: not-applicable

## Step pass.2

Check the heading

Expected: {"text":"Owned evidence test","visible":null,"url":null}

Observed: Captured before expect.; Found text: Owned evidence test

Assertion: passed

## Step pass.3

Select Select project

Expected: null

Observed: Clicked.

Assertion: not-applicable

## Step pass.4

Check the selected project

Expected: {"text":"Project selected: Aurora","visible":null,"url":null}

Observed: Captured before expect.; Found text: Project selected: Aurora

Assertion: passed

![Capture 1 for step pass.2](media/step-002-step-pass-002-heading--capture-001--capture-001.png)

![Capture 2 for step pass.2](media/step-002-step-pass-002-heading--capture-002--capture-002.png)

![Capture 1 for step pass.4](media/step-004-step-pass-004-selected-project--capture-001--capture-001.png)

![Capture 2 for step pass.4](media/step-004-step-pass-004-selected-project--capture-002--capture-002.png)

Limits: Capture time and viewport are unknown when the driver did not record them.; Only executed expect evidence with assertionPassed=true can establish a passing assertion.; Video is unavailable with the Surf driver. Image captures remain valid.

