# /// script
# dependencies = ["pymupdf==1.26.7"]
# ///
import pathlib
import pymupdf as f
root = pathlib.Path(__file__).parent
original = root.parent / 'stock-editor-round-trip-001/source.pdf'
doc = f.open(original)
info = doc[0].get_image_info(xrefs=True)[0]
f.Pixmap(doc, info['xref']).save(root / 'source.png')
print({'input': str(original), 'output': str(root / 'source.png'), 'width': info['width'], 'height': info['height']})
