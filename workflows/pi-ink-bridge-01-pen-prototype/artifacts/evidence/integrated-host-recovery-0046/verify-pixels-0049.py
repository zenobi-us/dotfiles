# /// script
# requires-python = ">=3.11"
# dependencies = ["Pillow==13.0.0"]
# ///
"""Compare the returned tool PNG with the retained synthetic source."""
from PIL import Image, ImageChops
import json
import pathlib
import sys
source = Image.open(sys.argv[1]).convert("RGB")
result = Image.open(sys.argv[2]).convert("RGB")
assert source.size == result.size == (800, 1000)
changed = sum(a != b for a, b in zip(source.get_flattened_data(), result.get_flattened_data()))
red_marks = sum(a != b and b[0] > 120 and b[0] > b[1] + 50 and b[0] > b[2] + 50 for a, b in zip(source.get_flattened_data(), result.get_flattened_data()))
assert red_marks > 20000
# Match the retained geometry experiment's four marker regions, not the outer page corners.
corners = [(40,40,80,80), (720,40,760,80), (40,920,80,960), (720,920,760,960)]
assert all(ImageChops.difference(source.crop(box), result.crop(box)).getbbox() is None for box in corners)
print(json.dumps({"dimensions": list(result.size), "changedPixels": changed, "changedRedDominantPixels": red_marks, "four40x40CornerMarkerRegionsExact": True, "limit": "Retained marked PDF replay on host. No new tablet marks or orientation/latency proof. Outer page corners are not the marker regions."}, indent=2))
