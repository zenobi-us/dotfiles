Explore the code at `{{ path }}`.

Produce a JSON object with:
- `files`: array of { path, type, language, lines, exports, imports }
- `types`: array of { name, file, line, kind, definition }
- `dependencies`: array of { from, to, type }
- `entryPoints`: array of file paths that serve as entry points

Write your findings as valid JSON.
