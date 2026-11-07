# /// script
# requires-python = ">=3.11"
# dependencies = ["pymupdf==1.26.7", "pypdf==6.21.4", "Pillow==13.0.0"]
# ///
"""Render inert PDF bytes for the request server; never open links or execute actions.

Only one opaque, untransformed source image is supported. Unknown source mappings
fail closed. Full-page alpha detects ink of any color; paint bounds guard against
subpixel ink that the raster could miss. Empty expanded margins remain empty.
"""
import hashlib
import json
import math
import pathlib
import sys
from io import BytesIO

import pymupdf as fitz
from pypdf import PdfReader
from pypdf.generic import ContentStream
from PIL import Image

MAX_PIXELS = 40_000_000


def require(condition, message):
    if not condition:
        raise ValueError(message)


def rgb(pix):
    if pix.colorspace != fitz.csRGB:
        pix = fitz.Pixmap(fitz.csRGB, pix)
    if pix.alpha:
        pix = fitz.Pixmap(pix, 0)
    return pix


def main():
    mode, directory = sys.argv[1:]
    root = pathlib.Path(directory)
    source_bytes = (root / "source-image").read_bytes()
    with Image.open(BytesIO(source_bytes)) as header:
        require(0 < header.width * header.height <= MAX_PIXELS,
                "Source exceeds the 40 megapixel rendering limit.")
    source = fitz.Pixmap(source_bytes)
    if source.alpha:
        require(all(a == 255 for a in source.samples[source.n-1::source.n]),
                "Stock PDF mode needs an opaque source image.")
    source = rgb(source)
    w, h = source.width, source.height
    require(w * h <= MAX_PIXELS, "Source exceeds the 40 megapixel rendering limit.")
    if mode == "source":
        doc = fitz.open()
        page = doc.new_page(width=w, height=h)
        page.insert_image(page.rect, pixmap=source)
        doc.save(root / "source.pdf")
        print(json.dumps({"width": w, "height": h}))
        return
    doc = fitz.open(root / "annotated.pdf")
    require(not doc.is_encrypted and len(doc) == 1, "Use one unencrypted PDF page.")
    page = doc[0]
    media = page.mediabox
    full_crop = fitz.Rect(media.x0, 0, media.x1, media.height)
    require(page.rotation == 0 and all(abs(a-b) < 0.001 for a, b in zip(page.cropbox, full_crop)),
            "Rotated pages or differing CropBox/MediaBox are not supported.")
    require(doc.xref_get_key(page.xref, "UserUnit")[0] == "null",
            "PDF UserUnit transforms are not supported.")
    parsed = PdfReader(root / "annotated.pdf")
    operations = parsed.pages[0].get_contents().operations
    require(not any(operator == b"INLINE IMAGE" for _, operator in operations),
            "Inline images are not supported.")
    for operands, operator in operations:
        if operator == b"Do":
            obj = parsed.pages[0]["/Resources"]["/XObject"][operands[0]].get_object()
            require(obj.get("/Subtype") == "/Image",
                    "Source image in a Form XObject is not supported.")
            require(not any(key in obj for key in ("/SMask", "/Mask", "/Decode")),
                    "Source image masks or custom decode transforms are not supported.")
            break
        require(operator in (b"q", b"Q", b"cm"),
                "Source paint state is not supported; the source must be the first opaque image.")
    # get_image_info hashes decoded pixels. Bound resource dimensions before that
    # call, not after a compressed image can allocate its full pixel buffer.
    for resource in page.get_images(full=True):
        require(resource[1] == 0 and (resource[2], resource[3]) == (w, h),
                "PDF image dimensions do not match the bound source.")
    images = page.get_image_info(xrefs=True)
    require(len(images) == 1 and images[0]["xref"] > 0,
            "Expected exactly one bound source image; inline or extra images are not supported.")
    image = images[0]
    embedded = fitz.Pixmap(doc, image["xref"])
    require(not embedded.alpha and doc.extract_image(image["xref"]).get("smask", 0) == 0,
            "Masked source images are not supported.")
    embedded = rgb(embedded)
    require((embedded.width, embedded.height) == (w, h) and embedded.samples == source.samples,
            "The PDF source image does not match this request.")
    # Convert trusted PDF coordinates [0, 0, w, h] to MuPDF page coordinates.
    window = fitz.Rect(0, 0, w, h) * page.transformation_matrix
    expected = (w, 0, 0, h, window.x0, window.y0)
    require(all(abs(a-b) < 0.001 for a, b in zip(image["transform"], expected)),
            "The PDF source image is moved, scaled, reflected, or rotated.")
    require(page.rect.contains(window), "The PDF page cuts off the source window.")
    require(page.rect.width * page.rect.height <= MAX_PIXELS,
            "Expanded PDF exceeds the 40 megapixel rendering limit.")
    # No JavaScript engine, action execution, URI loading, or remote resource resolver
    # is used. MuPDF renders only the supplied byte document and embedded resources.
    pix = page.get_pixmap(alpha=True, annots=True)
    outside = 0
    samples = pix.samples
    for y in range(pix.height):
        for x in range(pix.width):
            if not (window.x0 <= x and x + 1 <= window.x1 and
                    window.y0 <= y and y + 1 <= window.y1):
                # Boundary pixels partly covering the source are checked by paint
                # bounds below, rather than counting source-edge antialiasing as ink.
                if not fitz.Rect(x, y, x+1, y+1).intersects(window):
                    outside += samples[(y * pix.width + x) * 4 + 3] > 0
    uncertain = False
    invisible = set()
    for drawing in page.get_drawings():
        if ((drawing["type"] == "s" and drawing.get("stroke_opacity") == 0) or
                (drawing["type"] == "f" and drawing.get("fill_opacity") == 0) or
                (drawing["type"] == "fs" and drawing.get("stroke_opacity") == 0 and drawing.get("fill_opacity") == 0)):
            invisible.add(drawing["seqno"])
    invisible.update(span["seqno"] for span in page.get_texttrace() if span["opacity"] == 0)
    for seqno, (kind, bounds) in enumerate(page.get_bboxlog()):
        if kind in ("ignore-text", "fill-image") or seqno in invisible:
            continue
        box = fitz.Rect(bounds)
        if not window.contains(box) and not box.is_empty:
            uncertain = True
    # PDF annotation appearance streams are not in get_bboxlog(). Their rectangles
    # conservatively cover visible and subpixel marks, including transparent colors.
    for annot in page.annots() or []:
        if annot.flags & (fitz.PDF_ANNOT_IS_INVISIBLE | fitz.PDF_ANNOT_IS_HIDDEN | fitz.PDF_ANNOT_IS_NO_VIEW) or annot.opacity == 0:
            continue
        record = next((entry.get_object() for entry in parsed.pages[0].get("/Annots", [])
                       if getattr(entry, "idnum", None) == annot.xref), None)
        ap = record.get("/AP") if record else None
        appearance = ap.get_object().get("/N") if ap else None
        if appearance is not None and hasattr(appearance.get_object(), "get_data"):
            operations = ContentStream(appearance.get_object(), parsed).operations
            paints = {b"Do", b"S", b"s", b"f", b"F", b"f*", b"B", b"B*", b"b", b"b*",
                      b"Tj", b"TJ", b"'", b'"', b"sh", b"INLINE IMAGE"}
            if not any(operator in paints for _, operator in operations):
                continue
        if not window.contains(annot.rect):
            uncertain = True
    require(all(math.isfinite(v) for v in window), "Invalid source geometry.")
    # Reset both boxes to the original PDF source window. Render at 72 dpi: one
    # source pixel per PDF point, without fitting the expanded page into the output.
    page.set_mediabox(fitz.Rect(0, 0, w, h))
    page.set_cropbox(page.mediabox)
    output = page.get_pixmap(alpha=False, annots=True)
    require((output.width, output.height) == (w, h), "Unexpected source-sized output.")
    output.save(root / "clipped.png")
    print(json.dumps({"width": w, "height": h, "outsidePixels": outside,
                      "requiresConfirmation": bool(outside or uncertain),
                      "uncertainPaintBounds": uncertain,
                      "exportDigest": hashlib.sha256((root / "annotated.pdf").read_bytes()).hexdigest()}))


try:
    main()
except Exception as error:
    print(str(error), file=sys.stderr)
    sys.exit(1)
