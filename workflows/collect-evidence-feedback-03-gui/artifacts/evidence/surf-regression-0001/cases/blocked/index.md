---
schema: collect-evidence/v1
kind: case
---
# Case blocked

Stop at a credential prompt

## Step blocked.1

Open the controlled credential page

Expected: null

Observed: Error: SAFETY STOP blocked.1: credential prompt or uninspectable frame; human handling required
    at <anonymous>:15:32
    at <anonymous>:20:5
    at <anonymous>:21:6; Error: SAFETY STOP blocked.1: credential prompt or uninspectable frame; human handling required
    at <anonymous>:15:32
    at <anonymous>:20:5
    at <anonymous>:21:6

Assertion: not-applicable

## Step blocked.2

Attempt the prohibited field

Expected: null

Observed: Not executed

Assertion: not-applicable



Limits: Capture time and viewport are unknown when the driver did not record them.; Only executed expect evidence with assertionPassed=true can establish a passing assertion.; Video is unavailable with the Surf driver. Image captures remain valid.

