# Task: Research AI Harness Agent Formats

**Phase:** [Research & Discovery](phase-ab3b84bd-research-discovery.md)
**Epic:** [Multi-Harness Agent Loader Extension](epic-4dd87a16-multi-harness-agent-loader.md)
**Status:** Ready
**Priority:** High
**Created:** 2026-01-12

## Objective

Research and document how various AI coding harnesses define agents, commands, and system prompts. Create a comprehensive comparison that will guide the extension architecture.

## Acceptance Criteria

- [ ] Claude Code agent format documented
- [ ] Aider agent/persona format documented
- [ ] Continue agent format documented
- [ ] At least 2 additional harnesses surveyed
- [ ] Comparison matrix created
- [ ] Feasibility notes for Pi translation

## Research Approach

### Step 1: Primary Research (Deep Dive)

Research these harnesses thoroughly:

1. **Claude Code** (Anthropic)
   - How are custom instructions defined?
   - Where is CLAUDE.md or similar stored?
   - What project config files exist?

2. **Aider**
   - `.aider.conf.yml` format
   - Custom prompt/persona definitions
   - Model configuration patterns

3. **Continue** (VS Code extension)
   - `config.json` structure
   - Custom slash command definitions
   - Context provider configurations

### Step 2: Secondary Research (Survey)

Survey these for patterns:
- Cursor rules/prompts
- Cody configuration
- OpenCode settings
- GitHub Copilot customization

### Step 3: Analysis

Create comparison document addressing:
- Common patterns across harnesses
- Unique features per harness
- Translation complexity assessment
- Recommended priority order for implementation

## Resources

- Use brave-search skill for documentation lookup
- Check GitHub repos for config schemas
- Look for community examples and templates

## Expected Output

1. **Research file**: `.memory/research-XXXXXXXX-harness-agent-formats.md`
2. **Update phase file** with findings summary
3. **Update epic** with feasibility notes

## Notes

This is a research-heavy task that may require delegation to Deep Researcher subagent. Focus on official documentation and widely-used patterns.
