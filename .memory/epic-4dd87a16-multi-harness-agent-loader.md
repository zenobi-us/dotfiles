# Epic: Multi-Harness Agent Loader Extension

**Status:** Research
**Timeline:** Q1 2026
**Owner:** Research Team
**Created:** 2026-01-12

## Vision

Create a Pi-mono extension that enables loading and using agents/commands from other AI coding harnesses (Claude Code, Aider, OpenCode, Cursor, Continue, etc.). This would allow Pi users to leverage agent definitions, prompts, and tool configurations from other popular AI development tools.

## Problem Statement

Currently, each AI coding assistant has its own format for:
- Agent/persona definitions
- System prompts and instructions
- Tool/command configurations
- Context management patterns

Users who work across multiple AI tools cannot easily share or reuse their agent configurations. A unified loader would:
1. Enable portability of agent definitions across tools
2. Reduce duplication of configuration effort
3. Allow experimentation with agents designed for other harnesses
4. Create an ecosystem for sharing agent configurations

## Success Criteria

- [ ] Research completed: Document agent/command formats for 3+ AI harnesses
- [ ] Feasibility assessment: Determine which harnesses have compatible patterns
- [ ] Architecture draft: Design extension structure for loading external formats
- [ ] Proof of concept: Load at least one external agent format into Pi
- [ ] Documentation: Comprehensive guide for using multi-harness agents

## Target Harnesses to Research

1. **Claude Code** (Anthropic) - Official CLI for Claude
2. **Aider** - Popular AI pair programming tool
3. **OpenCode** - Open-source coding agent
4. **Cursor** - AI-first code editor
5. **Continue** - Open-source AI code assistant
6. **Cody** (Sourcegraph) - AI coding assistant

## Research Questions

1. What format does each harness use for agent definitions?
2. Where are agent configurations stored (config files, environment, etc.)?
3. What capabilities can be translated to Pi's format?
4. What capabilities cannot be translated (harness-specific features)?
5. Are there existing standards or interoperability efforts?

## Phases

1. **[Phase 1: Research & Discovery](phase-ab3b84bd-research-discovery.md)** 🔄 IN PROGRESS
   - Document agent formats for each target harness
   - Identify common patterns and incompatibilities
   - Assess translation feasibility

2. **[Phase 2: Architecture Design](phase-TODO-architecture-design.md)** ⏳
   - Design loader extension structure
   - Define translation layer interfaces
   - Plan plugin architecture for new harness support

3. **[Phase 3: Implementation](phase-TODO-implementation.md)** ⏳
   - Build core loader extension
   - Implement translators for priority harnesses
   - Create user-facing commands

## Dependencies

- Understanding of Pi extension system ✅ (documented in learning-76e583ca)
- Understanding of Pi agent/subagent format ✅ (documented in research-6e3d737d)
- Access to documentation for target harnesses
- Possible need for brave-search skill for external research

## Related Learning

- [Pi Extensions Guide](learning-76e583ca-pi-extensions-guide.md)
- [Subagent Extension Structure](research-6e3d737d-subagent-extension-structure.md)
- [Command Patterns](learning-d8d1c166-extension-command-patterns.md)

## Notes

This epic requires significant external research to understand the agent definition formats of other AI harnesses. The research phase should be thorough before any implementation begins.
