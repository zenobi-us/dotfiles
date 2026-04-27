---
name: moonrepo/optimise-tasks
description: Optimizes moonrepo task performance with measurement-first checks and cache/graph tactics, when local or CI runs are slow or inconsistent, resulting in targeted improvements without premature tuning.
---

# Moonrepo Optimise Tasks

## Overview
Use this skill to improve task performance safely: measure first, optimize second, verify impact third.

## When to Use
- CI or local runs are trending slower.
- Cache hit rate is low or unstable.
- Task graph execution does more work than expected.

## Optimization Workflow
1. **Measure baseline first**
   ```bash
   moon run :test --affected
   moon run :build --affected
   ```
   Capture elapsed time and scope.
2. **Check cache behavior**
   - Verify cache inputs/outputs in task configs.
   - Confirm environment-dependent inputs are explicit.
3. **Use graph-aware execution**
   - Prefer `--affected` and project selectors for incremental workflows.
   - Avoid broad all-project runs for PR validation unless required.
4. **Tune one variable at a time**
   - Change one task config dimension (inputs, outputs, deps, args).
   - Re-measure with same scope.

## Slow-Task Checklist
- [ ] Is the task running on too many projects?
- [ ] Are inputs too broad (invalidating cache constantly)?
- [ ] Are outputs missing (preventing cache reuse)?
- [ ] Are dependency edges causing unnecessary upstream runs?
- [ ] Is CI invoking non-affected full scans unnecessarily?

## Anti-Patterns
- Optimizing before collecting baseline metrics.
- Changing multiple task knobs at once.
- Clearing cache as first response to every issue.
- Treating local and CI data as interchangeable without evidence.

## Caveats
- Some speed regressions are toolchain/runtime regressions, not moon configuration.
- A faster run that skips required work is not an optimization; it is a correctness bug.

