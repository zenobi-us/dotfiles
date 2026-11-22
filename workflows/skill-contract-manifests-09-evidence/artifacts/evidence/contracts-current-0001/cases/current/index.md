---
schemaVersion: collect-evidence/v2
kind: case
---
# Case current

Capture a real private terminal under the current contract

## Step current.1

Read the contract capture screen.

Expected: {"text":"Contract capture","visible":null,"url":null}

Observed: Native screen did not settle on the expected visible content before timeout

Assertion: failed



Limits: Native video is unavailable.; OCR and stable frame hashes check visible content, not usability. Inspect every original PNG.; The private headless display does not reproduce a borrowed desktop terminal.; Font metrics and output dimensions depend on installed foot/wlroots/fonts; explicit image expectations must match.

