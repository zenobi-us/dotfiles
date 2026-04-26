Analyse the requested files and produce a report of problems and suggestions for improvement.

## UserRequest

```md
UserRequest: $ARGUMENTS
```

## Context

- If UserRequest is empty, assume the current working directory.
- If UserRequest contains no scope, direction, or purpose, first infer file types, then ask for analysis purpose based on those file types (suggest options).

## Approach

- Identify files to analyze based on UserRequest. Determine whether the target is software code, documentation, configuration, a story, or something else.
- For each file, understand how it is used; draw an ASCII state machine diagram showing information flow through the file(s).
- Based on file type and purpose, use `find_skills` to identify appropriate `expert-*` skills to use. Pick one or more; more is better.

## Report Structure

- ASCII state machine diagram(s) for the file(s) analyzed.
- Problems identified in the file(s), grouped by severity (critical, high, medium, low).
- A table of suggestions for improvement, with columns for suggestion, rationale, and expected impact.

## Next Steps

Offer one of the following:
- Fix each suggestion in a separate subagent.
- Use the miniproject skill to plan an epic to fix all suggestions as separate tasks, and mark the epic as pending.
- Use the miniproject skill to record the analysis as an idea file.
