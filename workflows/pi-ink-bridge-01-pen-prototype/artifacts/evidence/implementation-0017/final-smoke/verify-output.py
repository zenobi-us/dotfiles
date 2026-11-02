# /// script
# dependencies = ["pymupdf==1.26.7"]
# ///
"""Check actual delivered pixels and the retained full PDF after server shutdown."""
import hashlib
import json
from pathlib import Path
import pymupdf as f

root = Path(__file__).parent
source = f.Pixmap(root / 'source.png')
result = f.Pixmap(root / 'pdf-delivered.png')
assert (source.width, source.height, result.width, result.height) == (800,1000,800,1000)
a, b = source.samples, result.samples
assert a != b
corners = {}
for name, x, y in [('top_left',40,40),('top_right',720,40),('bottom_left',40,920),('bottom_right',720,920)]:
    differences = sum(a[(row*800+col)*3:(row*800+col+1)*3] != b[(row*800+col)*3:(row*800+col+1)*3] for row in range(y,y+40) for col in range(x,x+40))
    corners[name] = {'different_pixels':differences, 'region':[x,y,40,40]}
    assert differences == 0
original = root / 'retained-annotated.pdf'
assert hashlib.sha256(original.read_bytes()).hexdigest() == 'fc49be15009fdf904eb4cd5edc82833b22cfeec40c656d90d5041a98a4ab42cf'
png_result = f.Pixmap(root / 'png-delivered.png')
assert png_result.samples != source.samples
report = {'pdf_delivered_dimensions':[result.width,result.height], 'annotation_differs_from_source':True,
          'corner_regions':corners,'full_pdf_sha256':hashlib.sha256(original.read_bytes()).hexdigest(),
          'full_pdf_retrieved_after_server_close':True, 'ordinary_png_dimensions':[png_result.width,png_result.height], 'ordinary_png_contains_drawing_after_pdf_mode_round_trip':True}
(root / 'output-verification.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report,indent=2))
