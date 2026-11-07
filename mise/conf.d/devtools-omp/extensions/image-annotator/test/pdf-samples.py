# /// script
# requires-python = ">=3.11"
# dependencies = ["pymupdf==1.26.7"]
# ///
"""Compare decoded pixels across PNG encoders for the geometry regression."""
import sys
import pymupdf as f

a, b = (f.Pixmap(path) for path in sys.argv[1:])
assert (a.width, a.height, a.samples) == (b.width, b.height, b.samples)
print("equal")
