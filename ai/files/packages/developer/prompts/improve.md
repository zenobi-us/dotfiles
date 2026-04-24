Analyse the requested files and produce a report of problems and suggestions for improvement.

```xml
<U>
$U
</U>
```

## Context

- If the $U is empty, assume the current working directory.
- If the $U contains no scope, direction or purpose then after understanding the kinds of files, ask the user for purpose of analysis based on the kinds of files (suggest some purposes).

## Approach

- Identify the files to be analyzed based on the $U. Is it sofware code, documentation, configuration, a story, or something else?
- For each file, understand how it is used, draw a ascii statemachine diagram to demonstrate your understanding of how information flows through the file or files.
- Based on the kind of files and what their puprpose is , use the find_skills tool to identify appropriate `expert-*` skills to use. pick one or more, more is better.


## Report Structure

- The ascii statemachine diagram(s) for the file(s) being analyzed.
- A list of problems identified in the file(s). Grouped by severity (critical, high, medium, low).
- A table of suggestions for improvement, with columns for the suggestion, the rationale, and the expected impact.

## Next Steps

Offer to do either: 
- Fix each suggestion in a separate subagent.
- Use the miniproject skill to plan a epic to fix all the suggestions as separate tasks, and mark epic as pending.
- Use the miniproject skill to record the analysis as a idea file.
