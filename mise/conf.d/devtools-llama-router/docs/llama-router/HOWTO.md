# Review model-root configuration

For Dotfiles users. Updated 2026-11-27.

## Result

Generate local model presets from a template before launching the server.

## Prerequisites

Bash, Python 3, llama-server installed separately, local model files, and reviewed firewall policy.

## Steps

1. Review llama-router.sh and models.ini.in locally.
2. Set LLAMA_ROOT to your model directory rather than relying on the author’s machine path.
3. Check the server invocation and listening address before running llama-router.

## Verification

Generated model paths resolve to existing model files, and server exposure matches your intended interface.

## Recovery

Stop the server if paths or exposure are wrong. Change the template rather than hand-editing generated models.ini.

[Capability overview](README.md)
