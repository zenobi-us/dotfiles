---
schema: collect-feedback/v1
kind: changelog
---
# Changelog

## Unreleased
- **Preserve feedback Markdown:** Write and flush schema frontmatter, headings and notes as raw bytes. Cover both human-readable records through public init.

- **Keep controls readable:** Use the shared 13px control typography for Session and Cases navigation. Rebuild the distributed viewer.

- **Honour plain output:** Format init, validate and both serve entrypoints as labelled text with --plain. Preserve versioned --json output and --quiet suppression.

- **Restore asset focus:** Back and ArrowLeft return keyboard focus to the originating asset button while revealing the case column, including narrow viewports.

## 1.0.0

- **Import sealed evidence:** Create versioned sessions through the existing evidence route. Retain the complete source snapshot and immutable case media with original hashes and capture times.
- **Browse original media:** Open a prebuilt Base Nova inspector with independent session, case and asset columns. Keep horizontal drill-down on narrow screens.
- **Serve bounded reads:** Use one explicit-port loopback service for both entrypoints. Enforce registered paths, Host, Origin, request limits and an exclusive session writer lock.
- **Keep capability explicit:** Support init, validate and read-only serve. Annotation editing, draft recovery and export are not part of this release.


