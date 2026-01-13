# Task: Create Extension Architecture Document

**Phase:** [Architecture Design](phase-d0309796-architecture-design.md)
**Epic:** [Multi-Harness Agent Loader](epic-4dd87a16-multi-harness-agent-loader.md)
**Status:** ⏳ Ready to Start
**Priority:** High
**Estimated Duration:** 1 day

## Objective

Create a comprehensive architecture document that defines the overall design, components, interfaces, and data flows for the harness-bridge Pi extension.

## Deliverable

**Document:** `architecture.md` in design phase output
- Overall system design and component architecture
- Component interaction diagrams (text-based)
- Data flow through the system
- Error handling strategy
- Configuration discovery algorithm
- Extension initialization flow

## Acceptance Criteria

- [ ] System architecture clearly described with component breakdown
- [ ] Each component has defined responsibilities
- [ ] Data transformation pipeline is visualized
- [ ] Import/discovery mechanism is documented step-by-step
- [ ] Error handling and edge cases are addressed
- [ ] Technology stack decisions are justified
- [ ] Design supports both Claude Code and OpenCode adapters
- [ ] Extensibility for future adapters is addressed

## Components to Document

### 1. Discovery Engine
- Scans standard file locations for external configs
- Identifies which harnesses are present
- Returns list of discovered configurations

### 2. Adapter System
- Abstract base adapter interface
- Claude Code adapter
- OpenCode adapter
- Aider adapter (future)
- Continue adapter (future)

### 3. Parser Layer
- File reading and format detection
- JSON/YAML parsing
- Markdown frontmatter extraction
- Schema validation

### 4. Transformer Pipeline
- Normalize external configs to internal format
- Map tool permissions to Pi's model
- Handle missing/incompatible fields
- Conflict resolution for duplicate names

### 5. Integration Layer
- Register transformed commands as Pi custom commands
- Add transformed prompts as Pi skills
- Handle naming conflicts
- Error reporting and user feedback

## Reference Materials

- [Research - AI Harness Formats](research-8c4d2b1f-ai-harness-formats.md)
- [Pi Extensions Guide](learning-76e583ca-pi-extensions-guide.md)
- [Extension Command Patterns](learning-d8d1c166-extension-command-patterns.md)

## Implementation Notes

- Design should be technology-agnostic where possible
- Use ASCII diagrams for architecture visualization
- Include concrete examples from Claude Code and OpenCode
- Consider performance implications of discovery process
- Plan for lazy-loading of adapters

## Success Metrics

✅ Architecture document is clear, comprehensive, and implementable
✅ All components are well-defined with clear responsibilities
✅ Data flow is understandable and testable
✅ Design team agrees design supports project goals
