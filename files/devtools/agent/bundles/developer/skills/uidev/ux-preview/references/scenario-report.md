# Scenario Report Contract

All scenario reports share the same shell:

1. Decision header: context, decision question, exact option count, fidelity, assumptions.
2. Comparison controls: grid or obvious tabs with every option reachable.
3. Option panels: primary difference, invariants, rendered UI, relevant states, trade-offs.
4. Interaction area: controls that actually change the prototype.
5. Coverage table: variation parameters mapped to options and decision criteria.
6. Recommendation: recommendation, confidence, unresolved questions, and selected option.

## Required honesty

- Mark static previews as static.
- Separate prototype observations from production measurements.
- Do not claim usability, performance, or accessibility testing that was not performed.
- For TUI previews, label browser simulation, framework compatibility, and target-runtime verification as separate statuses.
- If a parameter is not applicable, say so in the coverage table.

## Verification

1. Confirm rendered option count equals requested count.
2. Confirm every requested parameter is represented or explicitly marked not applicable.
3. Check semantic controls, labels, focus visibility, contrast, and responsive overflow.
4. For TUI previews, check terminal sizes, keyboard-only paths, no-color mode, ASCII fallback, alignment, and explicit narrow-layout behavior.
5. Exercise each declared interaction and state path when the preview is interactive.
6. Serve the final report with `serve -l <port> --no-port-switching <directory>`.
7. Verify the exact URL responds before returning it.

Return the report URL, server PID, scenario, option count, fidelity, prototype depth, validation performed, and known gaps.
