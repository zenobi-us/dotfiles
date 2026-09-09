# annotate-last-message

A standalone pi extension that adds `/annotate-last-message`, a local browser page for annotating the latest completed assistant message on the current session branch.

## Install

```bash
pi install npm:@diegopetrucci/pi-annotate-last-message
```

Then reload pi:

```text
/reload
```

## Usage

Run `/annotate-last-message` from an interactive pi session. The annotation window lets you leave:

- overall guidance for the whole reply,

- inline notes tied to exact selected text, including multi-line selections.

When you submit, the extension sends a structured planning-oriented user message directly into the conversation and starts or queues the next assistant turn. It does not modify the previous assistant message in place.

## Requirements

- Interactive pi session.
- A completed assistant message with text on the active branch.
- Local desktop session with a default browser.

## Troubleshooting

- `annotate-last-message requires interactive mode.` → run it from the pi TUI.
- `No assistant messages found on the current session branch.` → wait for an assistant reply, then rerun.
- `Latest assistant message is incomplete (...)` → wait for the assistant turn to finish, then rerun.
- `Latest assistant message has no text to annotate.` → rerun after a normal text reply.
- `A last-message annotation page is already open.` → submit/cancel the existing page, or wait 30 minutes for its local server to expire.
- Browser does not open → ensure `xdg-open`, `open`, or Windows `start` works in the current desktop session.
