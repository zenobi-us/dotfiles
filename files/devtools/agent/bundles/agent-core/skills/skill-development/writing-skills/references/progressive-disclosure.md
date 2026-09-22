# Progressive Disclosure for Skills

Use progressive disclosure to keep the main skill focused and the detailed guidance available on demand.

## Information hierarchy

Keep content at the highest level that supports reliable execution:

1. **Router:** topic, use cases, core workflow, and routes to references.
2. **Inline guidance:** rules that every invocation needs.
3. **Disclosed reference:** branch-specific rules, examples, tables, and checklists.
4. **Tools and assets:** scripts, fixtures, diagrams, and other files.

Move content down the hierarchy when it applies only to one branch or phase.

## Split criteria

Create a separate reference when one or more conditions apply:

- The content applies to only one use case.
- The content is a large table, checklist, example set, or lookup guide.
- The content has a separate validation method.
- The content has a different audience or lifecycle phase.
- The content makes the router harder to scan.

Keep content inline when every invocation needs it and it is short enough to scan.

## Pointer rules

Each pointer MUST state when to read its target.

Use this form:

```markdown
Read `references/<file>.md` when [specific condition].
```

A useful pointer names both the topic and the branch trigger. Do not use vague pointers such as “see the reference for more information”.

## Reference rules

Each reference MUST:

- Have one clear purpose.
- Start with a descriptive heading.
- Explain when to use it if the trigger is not obvious.
- Own its detailed rules and examples.
- Avoid repeating the router or another reference.
- Link to a deeper reference when it has a real branch.

Use names that describe the topic, not the order in which files were created.

## Router review

Before deployment, check:

- Can a reader find the correct reference from the current decision?
- Does the router work without loading every reference?
- Does each reference support a real branch or phase?
- Does any rule have more than one authoritative location?
- Is the router short enough to scan in one pass?
- Does each disclosed file contain material that is worth loading on demand?

## Common failures

### The second skill file

Do not put a large second instruction file beside `SKILL.md` without a pointer. It is hidden from retrieval and increases cognitive load.

### The index without a route

Do not list references without saying when to read them. A file list is not a router.

### The thin router with no workflow

Do not move the core workflow into references. The router must contain enough steps to start the work and select the next reference.

### Duplicated rules

Do not copy a rule into both the router and a reference. Keep the short trigger in the router and the detailed rule in one reference.
