# Inspect host registration

For Dotfiles users. Updated 2026-11-27.

## Result

Share bundle directories, hook registrations, and command entrypoints across agent hosts.

## Prerequisites

Unix and a normal Dotfiles installation.

## Steps

1. Review the destination paths in this module’s mise.unix.toml.
2. Check that ~/.pi/agent/AGENTS.md and ~/.claude/CLAUDE.md resolve to the intended shared instructions.
3. Check the bundle and hook links without copying their contents.

## Verification

The links resolve to this checkout; the marketplace lists the same seven bundles. A link alone does not prove host activation.

## Recovery

Restore previous link targets if a host uses the wrong checkout. Use the owning host module for dependency installation.

[Capability overview](README.md)
