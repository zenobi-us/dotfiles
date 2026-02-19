# Workflow for Creating Presenterm Decks

1. Define talk objective and audience in 3 bullets.
2. Draft slide outline in markdown sections.
3. Apply Presenterm-specific patterns from `examples/`:
   - code blocks from `code.md`
   - multi-column layouts from `columns.md`
   - presenter notes from `speaker-notes.md`
4. Add theme/config choices with reference to `config.sample.yaml`.
5. Run local Presenterm rendering and iterate for terminal readability.

Quality checks:
- Every slide has one message.
- No dense paragraphs; keep lines terminal-friendly.
- Speaker notes exist for non-obvious transitions.
- Demo/code slides have fallback static content.
