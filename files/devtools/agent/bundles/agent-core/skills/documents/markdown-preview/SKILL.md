---
name: markdown-preview
description: Preview any local Markdown file in a browser, when an agent or user needs a quick rendered view, by running the bundled skill script on a free port and printing its URL
---

# Markdown Preview

Use the bundled `scripts/markdown-preview.js` skill script to serve one local Markdown file as HTML.

Resolve the script path relative to this `SKILL.md` file. Do not require a global `md-preview` command.

## Procedure

1. Run the skill script with the Markdown file path.
2. Open the URL that the script prints to standard output.
3. Keep the script process active while the preview is in use.
4. Stop the process with `Ctrl-C` when the preview is no longer necessary.

```sh
node <skill-directory>/scripts/markdown-preview.js path/to/file.md
```

The script MUST read the file without changing it.
The script MUST select a free local port.
The script MUST render the Markdown in the HTTP response.
The script MUST print one URL to standard output after the server starts.
The script MUST print failures to standard error and return a non-zero exit code.

## Input

The script accepts a file path as its only positional argument.
The path can be relative or absolute.
The file can have any name, but it MUST contain Markdown text.

## Output

The server listens on `127.0.0.1`.
The root URL serves the rendered document.
The response has `Content-Type: text/html; charset=utf-8`.
The script does not create an output file.

## Common Errors

- If the path is missing, read the usage text and pass a file path.
- If the file cannot be read, correct the path or file permissions.
- If the browser cannot connect, keep the script process active.
