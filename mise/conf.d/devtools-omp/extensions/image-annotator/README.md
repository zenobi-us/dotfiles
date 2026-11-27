# Interactive image annotator

<!-- Add a real screenshot with descriptive alt text and a caption, or a redacted terminal capture/diagram for this headless capability. -->

Draw or annotate images manually and return the completed PNG to OMP.

For Dotfiles users. Updated 2026-11-27.

This extension registers image_editor, /image, /annotate add-device, and annotate:-prefixed image input. /image new opens a blank canvas; /image annotate accepts a path or the latest attachment. Done returns a PNG; Cancel returns no image. This is manual drawing, not model-generated imagery. Static assets are served from dist and must already be built.

## Complete a task

[Annotate a non-sensitive image](HOWTO.md)

## Source files

- **Source:** [extensions/image-annotator/index.ts](index.ts)
- **Source:** [extensions/image-annotator/package.json](package.json)

[Module overview](../../README.md)
