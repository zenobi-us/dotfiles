---
meta:
  title: Agent bundles — dotfiles
  description: How each agent bundle is built, and how Claude Code, OMP, Pi and Zot load it.
skipLabel: Skip to agent bundles
eyebrow: Workstation field guide / agent bundles
title: Agent bundles
---

An agent bundle is one folder under `mise/conf.d/devtools-agent/bundles/`. It holds skills, and it can also hold agents, hooks and extensions. Each harness reads the same folder through its own manifest, so one change reaches every supported harness.

A bundle has three manifests. `.claude-plugin/plugin.json` is for Claude Code, `package.json` (the `pi` key) is for OMP and Pi, and `extension.json` is for Zot. mise installs or links the bundle for each harness. Claude Code installs a copy into its plugin cache. The other harnesses read the folder through a symlink, so they see a change at once.

Hooks use the Claude Code hook format everywhere. OMP reads them from `~/.agents/hooks/`, and Zot runs them through the `zot-claude-hooks` extension. A hook script must exit with code 0 and print nothing when it has nothing to say, so that it never blocks a session.

Skill scripts are relative to the installed skill folder, not to the repository. Each script is TypeScript, run by Bun through `mise exec`.
