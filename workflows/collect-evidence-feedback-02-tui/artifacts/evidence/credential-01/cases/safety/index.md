---
schema: collect-evidence/v1
kind: case
---
# Case safety

Stop before unsafe input

## Step safety.1

Show the credential stop fixture.

Expected: null

Observed: Input completed on the owned terminal

Assertion: not-applicable

## Step safety.2

Never type into the credential fixture.

Expected: null

Observed: SAFETY STOP: visible credential prompt; human handling required

Assertion: not-applicable



Limits: Native video is unavailable.; OCR and stable frame hashes check visible content, not usability. Inspect every original PNG.; The private headless display does not reproduce a borrowed desktop terminal.; Font metrics and output dimensions depend on installed foot/wlroots/fonts; explicit image expectations must match.

