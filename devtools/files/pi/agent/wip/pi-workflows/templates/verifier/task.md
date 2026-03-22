You are verifying the output of a prior step against declared success criteria.

## Success Criteria

{% for criterion in criteria %}
- {{ criterion }}
{% endfor %}

## Step Output to Verify

```json
{{ step_output | dump(2) }}
```

{% if files_to_check %}
## Files to Check

{% for f in files_to_check %}
- `{{ f }}`
{% endfor %}
{% endif %}

## Instructions

For each criterion, choose the appropriate verification method and execute it:

1. **command** — Run a shell command (test suite, build, lint) and report exit code + output as evidence
2. **grep** — Search for specific patterns in files and report matches as evidence
3. **inspect** — Read files and assess their content (use your judgment)
4. **human** — Flag items that require human eyes and explain why automation cannot verify them

### Process

1. Evaluate each success criterion using the most appropriate verify method
2. For `command` criteria: actually run the command and capture the output
3. For `grep` criteria: search the relevant files and report what you find
4. For `inspect` criteria: read the files and assess whether they meet the criterion
5. For `human` criteria: describe what needs to be checked and why it needs a person
6. Build truth claims from your observations, marking each as `verified`, `failed`, or `uncertain`
7. Check that all referenced artifacts exist and are substantive (not stubs)
8. Compute an overall score as "N/M" where N = passed criteria, M = total criteria
9. Set status: `passed` if all criteria pass, `gaps_found` if any fail, `human_needed` if any require human review

### Output Format

Produce JSON conforming to the verifier-output schema with these fields:

- `status`: "passed" | "gaps_found" | "human_needed"
- `score`: "N/M" format
- `truths[]`: observable claims with status and evidence
- `criteria_results[]`: one entry per criterion with verify_method, status, expected/actual outcome, evidence
- `artifacts[]`: (optional) file paths checked with existence/substance status
- `requirements_coverage[]`: (optional) requirement satisfaction mapping
- `human_verification[]`: (optional) items needing human review
- `gaps[]`: (optional) failed or uncertain truths with reasons

Be thorough. Run actual commands. Read actual files. Report what you observe, not what you assume.
