# Local llama router launcher

<!-- Add a real screenshot with descriptive alt text and a caption, or a redacted terminal capture/diagram for this headless capability. -->

Generate local model presets from a template before launching the server.

For Dotfiles users. Updated 2026-11-27.

The Unix wrapper resolves its own directory and rewrites models.ini from models.ini.in using Python. LLAMA_ROOT overrides the host-specific model directory. Review the final server invocation before starting; generated presets are not the source of truth. It launches llama-server on 0.0.0.0:2000 with model autoload and at most one loaded model. This exposes the listener beyond loopback unless host networking restricts it.

## Complete a task

[Review model-root configuration](HOWTO.md)

## Source files

- **Source:** [llama-router.sh](../../llama-router.sh)
- **Source:** [models.ini.in](../../models.ini.in)

[Module overview](../../README.md)
