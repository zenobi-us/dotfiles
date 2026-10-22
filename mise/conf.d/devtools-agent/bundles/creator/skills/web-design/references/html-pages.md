# Create an HTML page

Read this file for a plain HTML page or static site.

## Build

1. Confirm whether the output is one standalone artifact or part of an existing site. Reuse the site's stylesheet and assets when present.
2. Use semantic HTML and native links, buttons, and disclosure controls. Keep the requested reading order in the DOM.
3. Map the selected visual rules to semantic CSS variables. Use local licensed fonts when available; bundled design documents do not include font binaries.
4. Keep JavaScript limited to requested interactions. A static landing page needs no framework, package installation, or client state.
5. Use relative asset and internal-page URLs that work below a GitHub Pages project prefix. Preserve explicit external-link targets and provide safe opener handling for new tabs.
6. Wrap long content. Keep intentional diagram or code overflow inside a labelled, keyboard-accessible region rather than widening the page.

If html-artifact owns packaging, follow its standalone-file contract. Otherwise use the target site's existing file structure. Do not add deployment workflows or enable hosting unless requested.

## Check

Serve the actual output and open it in a browser. Follow references/verification.md. Check the page at its intended base path, not only at the server root.
