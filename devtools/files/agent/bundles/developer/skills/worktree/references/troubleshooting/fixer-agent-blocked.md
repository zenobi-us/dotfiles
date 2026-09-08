# Troubleshooting: fixer agent reports blocked or times out

## Symptom

During the `fix` playbook, the fixer agent reaches `blocked`, fails its validation command, or its final response is missing the `WORKTREE_FIX_DONE` marker.

## Cause

The fixer could not resolve the blocking findings from the `review` playbook's artifact, or the fix broke validation.

## Fix

- Report the failure. Do not start a review.
- Do not close the fixer's pane — leave it open for inspection.
- Do not retry the same handoff silently. Read the fixer's actual output first (`references/muxers/<muxer>.md` gives the read command for the active muxer), understand why it stopped, then decide whether to hand it a narrower fix or escalate to the user.

Source: `references/playbooks/fix.md` step 8.
