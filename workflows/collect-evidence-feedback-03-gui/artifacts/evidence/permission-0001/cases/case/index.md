---
schema: collect-evidence/v1
kind: case
---
# Case case

Inspect selected native GUI surface

## Step case.1

Inspect the selected native window.

Expected: {"text":null,"visible":true,"url":null,"image":{"width":480,"height":260,"pixels":[{"x":40,"y":110,"rgb":[201,166,255]},{"x":260,"y":110,"rgb":[156,207,216]},{"x":10,"y":10,"rgb":[25,21,33]}],"lines":[]}}

Observed: Native GUI display/capture access failed; check installed tools, X11 authorization and selected window permissions separately

Assertion: not-run



Limits: Native video and automated GUI input are unavailable.; Only Linux X11 is supported. Wayland portals, macOS and Windows are not implemented.; Pixel probes and stable frames do not prove usability or absence of private content. Inspect every original PNG.; Keep the selected window unobscured; X11 capture can include occlusion. Display root captures include the whole approved display.

