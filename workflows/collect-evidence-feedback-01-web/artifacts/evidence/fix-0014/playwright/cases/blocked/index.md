---
schema: collect-evidence/v1
kind: case
---
# Case blocked

Block unapproved Space activation

## Step blocked.1

Open the owned confirmation page

Expected: null

Observed: Page loaded.

Assertion: not-applicable

## Step blocked.2

Attempt the unapproved confirmation

Expected: null

Observed: page.evaluate: Error: SAFETY STOP blocked.2: confirmation step is not explicitly approved
    at eval (eval at evaluate (:368:30), <anonymous>:17:21)
    at eval (eval at evaluate (:368:30), <anonymous>:19:5)
    at UtilityScript.evaluate (<anonymous>:370:16)
    at UtilityScript.<anonymous> (<anonymous>:1:44)

Assertion: not-applicable



Limits: Capture time and viewport are unknown when the driver did not record them.; Only executed expect evidence with assertionPassed=true can establish a passing assertion.

