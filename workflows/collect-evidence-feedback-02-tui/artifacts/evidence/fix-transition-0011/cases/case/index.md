---
schema: collect-evidence/v1
kind: case
---
# Case case

Native transition

## Step case.1

Inspect ready.

Expected: {"text":"Ready screen","visible":null,"url":null}

Observed: Expected screen, native dimensions, colour probes and text line positions match

Assertion: passed

## Step case.2

Open details.

Expected: null

Observed: Input completed on the owned terminal

Assertion: not-applicable

## Step case.3

Inspect details.

Expected: {"text":"Details screen","visible":null,"url":null}

Observed: Expected screen, native dimensions, colour probes and text line positions match

Assertion: passed

![Capture 1 for step case.1](media/step-001-step-case-001-ready--capture-001--capture-001.png)

![Capture 1 for step case.3](media/step-003-step-case-003-details--capture-001--capture-001.png)

Limits: Native video is unavailable.; OCR and stable frame hashes check visible content, not usability. Inspect every original PNG.; The private headless display does not reproduce a borrowed desktop terminal.; Font metrics and output dimensions depend on installed foot/wlroots/fonts; explicit image expectations must match.

