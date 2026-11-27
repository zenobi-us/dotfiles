# Browser automation

Browser automation clients and DevTools MCP servers.

## Notable items

- **[Playwright CLI](docs/playwright-cli/README.md):** Control browser sessions from command-line automation.

- **[Agent Browser](docs/agent-browser/README.md):** Automate browser interactions for agent workflows.

- **[Chrome DevTools MCP](docs/chrome-devtools-mcp/README.md):** Expose Chrome debugging and automation through an MCP server.

- **[Firefox DevTools MCP](docs/firefox-devtools-mcp/README.md):** Expose Firefox debugging and automation through an MCP server.

- **[Surf CLI](docs/surf/README.md):** Automate browser interactions from the command line.


## Scope

[mise.toml](mise.toml) is the source of truth for versions and backend options. These declarations install tools; they do not activate editor clients, provision accounts, or start services. `latest` is a moving request, not a fixed version.

Choose an item above for its configuration and installation guide. Module inclusion in your active mise configuration is separate from the explicit installation commands in these guides.

