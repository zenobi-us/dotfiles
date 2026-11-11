---
schema: collect-evidence/v1
kind: case
---
# Case blocked

Stop at a credential prompt

## Step blocked.1

Open the controlled credential page

Expected: null

Observed: page.evaluate: Error: SAFETY STOP blocked.1: credential prompt or uninspectable frame; human handling required
    at eval (eval at evaluate (:368:30), <anonymous>:14:32)
    at eval (eval at evaluate (:368:30), <anonymous>:19:5)
    at UtilityScript.evaluate (<anonymous>:370:16)
    at UtilityScript.<anonymous> (<anonymous>:1:44)

Assertion: not-applicable

## Step blocked.2

Attempt the prohibited field

Expected: null

Observed: Not executed

Assertion: not-applicable



Limits: Capture time and viewport are unknown when the driver did not record them.; Only executed expect evidence with assertionPassed=true can establish a passing assertion.

