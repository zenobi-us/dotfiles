# Epic: Subagent Footer Customization with pi-tui

**Status:** Planned (Approved - Waiting for Epic 3 Completion)
**Timeline:** Q1 2026
**Priority:** Medium
**Dependencies:** Active Epic 3 (Multi-Harness Agent Loader)

## Vision

Enable deep customization of the subagent extension footer display using pi-tui components, allowing users and extension developers to tailor the visual representation of subagent results, usage statistics, and status indicators to their specific needs and preferences.

## Business Context

The current subagent extension provides excellent functionality but has a fixed footer display format. As users increasingly rely on subagents for complex workflows, the ability to customize the visual representation becomes crucial for:

- **Enhanced readability** - Different users prefer different information density and layout
- **Workflow optimization** - Teams can standardize on specific footer formats
- **Accessibility** - Custom layouts can better support different screen sizes and visual needs
- **Developer experience** - Extension authors can create themed footer experiences
- **Information hierarchy** - Users can emphasize the metrics most important to their work

## Success Criteria

### Core Requirements
- [ ] **Footer API**: Create extensible footer customization API using pi-tui components
- [ ] **Default themes**: Provide 3-4 pre-built footer themes (compact, detailed, minimal, status-focused)
- [ ] **User configuration**: Allow users to select and configure footer themes through extension settings
- [ ] **Runtime switching**: Support dynamic footer theme switching without restart
- [ ] **Backward compatibility**: Maintain existing footer display as default theme

### Advanced Features  
- [ ] **Custom themes**: Enable users to create and register custom footer themes
- [ ] **Theme marketplace**: Framework for sharing footer themes across users
- [ ] **Responsive design**: Footer adapts to terminal width and content requirements
- [ ] **Interactive elements**: Support clickable footer elements for actions (expand, copy, etc.)
- [ ] **Status indicators**: Rich visual status indicators (progress bars, icons, color coding)

### Developer Experience
- [ ] **TypeScript API**: Full TypeScript support for footer theme development
- [ ] **Documentation**: Comprehensive guide for creating custom footer themes
- [ ] **Examples**: 5+ example footer themes with different use cases
- [ ] **Testing framework**: Unit tests for footer rendering and theme switching

## Phases

### Phase 1: Research & Analysis
**Duration:** 2-3 days
**Goals:**
- Deep analysis of current subagent footer implementation
- Review pi-tui component capabilities for footer design
- Study successful customization patterns in similar tools
- Design flexible footer API architecture

**Deliverables:**
- Current footer architecture analysis
- pi-tui component research findings
- Footer customization API design specification
- Theme system architecture proposal

### Phase 2: Core Footer API Development
**Duration:** 4-5 days
**Goals:**
- Implement extensible footer API using pi-tui components
- Create footer theme registry and selection system
- Build theme configuration management
- Develop core footer themes (compact, detailed, minimal)

**Deliverables:**
- Footer API implementation
- Theme registry system
- 3 core footer themes
- Configuration management system

### Phase 3: Advanced Features & Polish
**Duration:** 3-4 days
**Goals:**
- Implement responsive footer design
- Add interactive footer elements
- Create rich status indicators and animations
- Build theme development framework

**Deliverables:**
- Responsive footer system
- Interactive footer capabilities
- Rich status indicators
- Theme development toolkit

### Phase 4: Documentation & Examples
**Duration:** 2-3 days
**Goals:**
- Create comprehensive developer documentation
- Build example footer themes
- Write user configuration guide
- Develop testing framework

**Deliverables:**
- Developer documentation suite
- 5+ example footer themes
- User configuration guide
- Testing framework and test suite

## Dependencies

### Internal Dependencies
- **Epic 3 completion**: Multi-Harness Agent Loader epic should be completed first
- **Subagent extension stability**: Current subagent functionality must remain stable
- **pi-tui component library**: Requires deep understanding of pi-tui capabilities

### External Dependencies
- **pi-mono API stability**: Footer API depends on stable pi-tui component interfaces
- **Extension system**: Leverages extension configuration and theme systems
- **TypeScript ecosystem**: Requires TypeScript 4.9+ for advanced type patterns

## Technical Considerations

### Architecture Decisions
1. **Component-based design**: Use pi-tui components as building blocks for footer themes
2. **Plugin architecture**: Footer themes as lightweight plugins with registration API
3. **Configuration layers**: User preferences → theme defaults → system defaults
4. **Performance optimization**: Efficient rendering for high-frequency footer updates

### Integration Points
- **Theme system**: Integrate with existing pi-mono theme infrastructure
- **Extension settings**: Leverage extension configuration patterns
- **Event system**: Hook into subagent lifecycle events for footer updates
- **Component lifecycle**: Proper cleanup and memory management for theme switching

### Risk Mitigation
- **Breaking changes**: Extensive backward compatibility testing
- **Performance**: Benchmark footer rendering performance under load
- **User experience**: User testing with different terminal configurations
- **Maintenance**: Clear documentation for long-term maintainability

## Timeline

**Total Estimated Duration:** 11-15 days

- **Phase 1**: 2-3 days (Research & Analysis)
- **Phase 2**: 4-5 days (Core API Development)  
- **Phase 3**: 3-4 days (Advanced Features)
- **Phase 4**: 2-3 days (Documentation & Examples)

**Target Completion:** Early Q1 2026 (after Epic 3 completion)

## Notes

### Epic Conflicts
✅ **RESOLVED**: Human selected Option A - Epic 4 will wait for Epic 3 completion.

**Current Active Epic:** [Multi-Harness Agent Loader](epic-4dd87a16-multi-harness-agent-loader.md)

**Recommendation:** Epic 4 approved to start after Epic 3 completion, following miniproject guidelines for single active epic.

### Learning Opportunity
This epic builds on existing knowledge from:
- [learning-432b51be-subagent-extension-architecture.md](learning-432b51be-subagent-extension-architecture.md) - Deep understanding of subagent architecture
- [learning-62c593ff-component-architecture-patterns.md](learning-62c593ff-component-architecture-patterns.md) - Component design patterns
- [learning-96aa4357-layout-systems.md](learning-96aa4357-layout-systems.md) - Layout system expertise

### Innovation Focus
This epic represents a significant UX innovation opportunity:
- **First-class customization**: Moving beyond one-size-fits-all displays
- **Developer ecosystem**: Creating a framework for community contributions
- **User empowerment**: Giving users control over their development tool aesthetics
- **Accessibility**: Supporting diverse user needs and preferences

### Success Measurement
- **Adoption**: Number of users who customize their footer display
- **Community**: Number of custom themes created and shared
- **Performance**: No measurable impact on subagent execution performance
- **Stability**: Zero regression in existing subagent functionality