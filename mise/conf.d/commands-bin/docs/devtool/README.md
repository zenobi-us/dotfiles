# Browser debug bridge

<!-- Add a real screenshot with descriptive alt text and a caption, or a redacted terminal capture/diagram for this headless capability. -->

Pass the first local Chrome debug target to bdg.

For Dotfiles users. Updated 2026-11-27.

The wrapper queries `http://127.0.0.1:9222/json`, extracts the first target webSocketDebuggerUrl with jq, and forwards arguments to bdg. Debug endpoints give control over the browser.

## Complete a task

[Inspect a local browser bridge](HOWTO.md)

## Source files

- **Source:** [devtool](../../devtool)

[Module overview](../../README.md)
