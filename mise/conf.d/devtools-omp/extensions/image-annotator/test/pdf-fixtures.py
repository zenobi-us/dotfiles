# /// script
# requires-python = ">=3.11"
# dependencies = ["pymupdf==1.26.7"]
# ///
"""Create synthetic exports with known mapping and color-independent outer ink."""
import pathlib
import sys
import pymupdf as f

root = pathlib.Path(sys.argv[1])
root.mkdir(parents=True, exist_ok=True)
pix = f.Pixmap(f.csRGB, f.IRect(0, 0, 80, 100), False)
pix.clear_with(255)
pix.set_rect(f.IRect(2, 2, 12, 12), (0, 0, 255))
pix.set_rect(f.IRect(68, 88, 78, 98), (0, 255, 0))
pix.save(root / 'source.png')
for name, color, alpha in [('empty', None, 1), ('black', (0,0,0), 1), ('blue', (0,0,1), 1), ('white', (1,1,1), 1), ('alpha', (0,1,0), 0.01), ('subpixel', (1,0,0), 0.0001), ('shifted', None, 1)]:
    doc = f.open()
    page = doc.new_page(width=100, height=120)
    page.set_mediabox(f.Rect(-10.25,-20.125,90.25,100) if name == 'empty' else f.Rect(-10,-20,90,100))
    left = 11 if name == 'shifted' else 10.25 if name == 'empty' else 10
    page.insert_image(f.Rect(left,0,left+80,100), pixmap=pix)
    if color:
        page.draw_line(f.Point(3,10), f.Point(3,90), color=color, width=0.001 if name=='subpixel' else 2, stroke_opacity=alpha)
    if name == 'empty':
        page.draw_line(f.Point(3,10), f.Point(3,90), color=(0,0,0), width=2, stroke_opacity=0)
        hidden = page.add_rect_annot(f.Rect(0,105,6,115))
        hidden.set_flags(f.PDF_ANNOT_IS_HIDDEN)
        hidden.update()
        transparent = page.add_rect_annot(f.Rect(94,30,99,40))
        transparent.set_opacity(0)
        transparent.update()
        empty = page.add_rect_annot(f.Rect(94,50,99,60))
        empty.update()
        appearance = int(doc.xref_get_key(empty.xref, 'AP/N')[1].split()[0])
        doc.update_stream(appearance, b'q Q')
    doc.save(root / (name+'.pdf'))
