---
schema: collect-evidence/v1
kind: case
---
# Case transition

Inspect the real delayed native transition

## Step transition.1

Inspect ready.

Expected: {"text":"Ready screen","visible":null,"url":null}

Observed: SAFETY STOP: unexpected terminal confirmation; approve the actual prompt before input

Assertion: not-run

## Step transition.2

Open details.

Expected: null

Observed: Not executed

Assertion: not-applicable

## Step transition.3

Inspect details.

Expected: {"text":"Details screen","visible":null,"url":null}

Observed: Not executed

Assertion: not-run



Limits: Native video is unavailable.; OCR and stable frame hashes check visible content, not usability. Inspect every original PNG.; The private headless display does not reproduce a borrowed desktop terminal.; Font metrics and output dimensions depend on installed foot/wlroots/fonts; explicit image expectations must match.

