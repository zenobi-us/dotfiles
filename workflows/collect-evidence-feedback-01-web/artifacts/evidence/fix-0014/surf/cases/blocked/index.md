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

Observed: Error: SAFETY STOP blocked.2: confirmation step is not explicitly approved
    at <anonymous>:18:21
    at <anonymous>:20:5
    at <anonymous>:20:10
    at <anonymous>:21:6; Error: SAFETY STOP blocked.2: confirmation step is not explicitly approved
    at <anonymous>:18:21
    at <anonymous>:20:5
    at <anonymous>:20:10
    at <anonymous>:21:6

Assertion: not-applicable



Limits: Capture time and viewport are unknown when the driver did not record them.; Only executed expect evidence with assertionPassed=true can establish a passing assertion.; Video is unavailable with the Surf driver. Image captures remain valid.

