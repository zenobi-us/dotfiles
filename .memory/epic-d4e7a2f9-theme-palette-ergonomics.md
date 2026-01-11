# Epic: Theme Palette Tool Ergonomics Enhancement

**Status:** Active 🔄  
**Timeline:** Q1 2026  
**Owner:** Development Team  
**Created:** 2026-01-12  
**Activated:** 2026-01-12  
**Parent:** Split from [Theme Development Tools](epic-c2b8f4e6-theme-development-tools.md)

## Vision

Enhance the ergonomics and user experience of the theme palette tool by creating a proper modal-based application component structure. Transform the current widget-based display into a more polished, user-friendly modal application with clear escape affordances and better component composition.

## Success Criteria

- [ ] Create a new `ThemeApp` parent component that serves as the modal container
- [ ] Compose existing `Modal.ts` and `Palette.ts` components in a parent-child relationship
- [ ] Add visual escape affordance (top-right `[ esc ]` button indicator)
- [ ] Maintain all existing functionality (47 colors, 8 categories, responsive layout)
- [ ] Ensure proper theme integration and invalidation
- [ ] Update extension entry point to use new `ThemeApp` component
- [ ] Document the new component architecture
- [ ] Test modal behavior (show/hide, escape key, visual feedback)

## Phases

### Phase 1: Component Architecture Design ⏳
**Status:** Ready to Start  
**Started:** 2026-01-12

Design the new `ThemeApp` component architecture and define component responsibilities.

**Key Deliverables:**
- [ ] Design `ThemeApp` component structure
- [ ] Define Modal component responsibilities and API
- [ ] Plan component composition (ThemeApp → Modal → Palette)
- [ ] Determine escape affordance placement and styling
- [ ] Document component hierarchy and data flow

### Phase 2: Modal Component Implementation ⏳
**Status:** Planned

Implement the `Modal` component that serves as the container for the palette display.

**Key Deliverables:**
- [ ] Implement `Modal.ts` component (currently empty)
- [ ] Add border and title bar rendering
- [ ] Implement escape affordance (`[ esc ]` indicator top-right)
- [ ] Support child component rendering
- [ ] Handle theme integration and styling
- [ ] Add proper sizing and positioning

### Phase 3: ThemeApp Component Implementation ⏳
**Status:** Planned

Create the `ThemeApp` parent component that composes Modal and Palette.

**Key Deliverables:**
- [ ] Create `ThemeApp.ts` component
- [ ] Compose Modal and Palette components
- [ ] Wire up keyboard event handling (Escape key)
- [ ] Implement show/hide logic
- [ ] Add state management for visibility
- [ ] Ensure proper theme invalidation
- [ ] Handle component lifecycle

### Phase 4: Integration & Testing ⏳
**Status:** Planned

Integrate the new component architecture into the extension and test thoroughly.

**Key Deliverables:**
- [ ] Update `index.ts` to use `ThemeApp` instead of direct `Palette`
- [ ] Test modal visibility toggle
- [ ] Test escape key functionality
- [ ] Verify escape affordance visibility
- [ ] Test responsive layout within modal
- [ ] Verify all 47 colors display correctly
- [ ] Test theme switching compatibility
- [ ] Update documentation

### Phase 5: Documentation & Learning ⏳
**Status:** Planned

Document the new architecture and extract learnings about modal patterns.

**Key Deliverables:**
- [ ] Update ARCHITECTURE.md with modal patterns
- [ ] Document ThemeApp component usage
- [ ] Update QUICKREF.md with new structure
- [ ] Create examples for modal usage
- [ ] Extract modal component patterns to learning file
- [ ] Update README with ergonomic improvements

## Dependencies

### External
- Pi coding agent (@mariozechner/pi-coding-agent)
- Pi TUI library (@mariozechner/pi-tui)
- Existing theme palette extension codebase

### Internal
- Existing Palette component (components/Palette.ts)
- Existing component system (Chip, Group, Flex, Grid, Sized)
- Theme system understanding (from completed epic)
- Modal.ts component file (currently empty, needs implementation)

## Technical Context

This epic builds upon the completed Theme Development Tools epic. The current implementation uses a direct widget approach where the `Palette` component is rendered directly. The enhancement will introduce a proper application architecture with:

1. **ThemeApp** - Top-level application component
   - Manages modal visibility state
   - Handles keyboard events (Escape key)
   - Composes Modal component

2. **Modal** - Container component (currently empty file)
   - Renders border and title bar
   - Shows escape affordance (`[ esc ]` indicator)
   - Contains Palette as child

3. **Palette** - Content component (existing)
   - Displays theme colors in responsive layout
   - Maintains current functionality

**Key Technical Goals:**
- Clean component composition pattern
- Clear separation of concerns (app logic, modal container, content display)
- Enhanced user experience with visual affordances
- Maintain backward compatibility with existing color data

## Timeline

- **Phase 1 (Design):** 0.5 day
- **Phase 2 (Modal):** 1 day
- **Phase 3 (ThemeApp):** 1 day
- **Phase 4 (Integration):** 0.5 day
- **Phase 5 (Documentation):** 0.5 day
- **Total Epic Duration:** 3-4 days

## Next Steps

1. **Critical First Step:** Design component architecture
   - Define ThemeApp component interface
   - Plan Modal component API
   - Determine escape affordance styling
   - Document component hierarchy

2. After design complete:
   - Implement Modal component
   - Create ThemeApp component
   - Integrate into extension
   - Test and document

## Related Files

### Parent Epic
- [epic-c2b8f4e6-theme-development-tools.md](epic-c2b8f4e6-theme-development-tools.md) - Completed parent epic

### Existing Implementation
- `devtools/files/pi/agent/extensions/theme-palette/index.ts` - Current extension entry point
- `devtools/files/pi/agent/extensions/theme-palette/components/Palette.ts` - Existing palette component
- `devtools/files/pi/agent/extensions/theme-palette/components/Modal.ts` - Empty file, needs implementation
- `devtools/files/pi/agent/extensions/theme-palette/components/*.ts` - Supporting components

### Learning (from previous work)
- [learning-extension-widget-rendering.md](learning-extension-widget-rendering.md) - Widget rendering patterns
- [learning-theme-widget-patterns.md](learning-theme-widget-patterns.md) - Theme integration patterns
- [learning-62c593ff-component-architecture-patterns.md](learning-62c593ff-component-architecture-patterns.md) - Component architecture
- [learning-96aa4357-layout-systems.md](learning-96aa4357-layout-systems.md) - Layout systems

## Notes

This epic represents a natural evolution of the theme palette extension from MVP to polished application. The split from the parent epic is appropriate because:

1. **Scope:** Original epic focused on getting the tool functional; this epic focuses on UX refinement
2. **Completeness:** Original epic achieved all success criteria; this adds new requirements
3. **Architecture:** Introduces new component layer (modal + app) not planned in original scope
4. **Focus:** Ergonomics and polish vs. initial functionality

The enhancement maintains backward compatibility with the existing palette data structure and component system while introducing a better user experience through modal architecture and visual affordances.

## Key Learning Opportunities

- Modal component patterns in TUI applications
- Application-level component composition
- Visual affordance design in terminal UIs
- Escape key handling and state management
- Progressive enhancement of existing components

---

## Rationale for Split from Parent Epic

The original **Theme Development Tools** epic (epic-c2b8f4e6) successfully delivered:
- ✅ Functional theme palette extension
- ✅ 47 colors across 8 categories
- ✅ Responsive layout system
- ✅ Component architecture (V1 → V2)
- ✅ Comprehensive documentation

**Why a new epic?**

1. **Original scope complete:** All success criteria met, including documentation and learning extraction
2. **New requirements:** Modal architecture, escape affordances, and app-level composition not in original vision
3. **Different focus:** Original focused on "getting it working"; this focuses on "making it polished"
4. **Architectural change:** Introduces new component layers (ThemeApp, Modal) requiring separate planning
5. **Timing:** Original epic took 1 day; enhancement is additional 3-4 days of focused work

This approach follows miniproject guidelines:
- Each epic has clear, focused scope
- Success criteria are specific and measurable
- Related work is linked but not artificially combined
- Completed epics are properly closed before new work begins

