# Code intelligence

Syntax-aware inspection and language-server tools.

## Notable items

- **[Codemapper](docs/codemapper/README.md):** Inspect code structure with a source-code mapping tool.

- **[Markdown Oxide](docs/markdown-oxide/README.md):** Provide language-server support for Markdown knowledge bases.

- **[ast-grep](docs/ast-grep/README.md):** Search and transform source code with syntax-aware patterns.

- **[TypeScript Language Server](docs/typescript-language-server/README.md):** Provide TypeScript and JavaScript editor language services.

- **[Tree-sitter](docs/tree-sitter/README.md):** Work with incremental parsing grammars and syntax trees.

- **[LSP CLI](docs/lsp-cli/README.md):** Run language-server diagnostics from the command line.


## Scope

[mise.toml](mise.toml) is the source of truth for versions and backend options. These declarations install tools; they do not activate editor clients, provision accounts, or start services. `latest` is a moving request, not a fixed version.

Choose an item above for its configuration and installation guide. Module inclusion in your active mise configuration is separate from the explicit installation commands in these guides.

