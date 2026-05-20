---
name: rfc2119-sop-authoring
description: Use when creating agent SOPs (Standard Operating Procedures) with RFC 2119 constraints, when structuring multi-step agent workflows, when converting processes into reusable parameterized templates, or when validating SOP format compliance
---

# RFC 2119 SOP Authoring

## Overview

Agent SOPs (Standard Operating Procedures) are markdown-based instruction sets that guide AI agents through sophisticated workflows using natural language, parameterized inputs, and RFC 2119 constraint-based execution.

**Core principle:** Precise control over agent behavior without rigid scripting—RFC 2119 keywords (MUST, SHOULD, MAY) provide graduated constraints that allow agents to adapt while maintaining boundaries.

## When to Use

- Creating new workflow automation SOPs
- Structuring multi-step agent workflows with constraints
- Converting processes into reusable parameterized templates
- Validating existing SOP format and structure
- Need graduated constraints (hard requirements vs recommendations vs options)

**When NOT to use:**
- Simple one-shot instructions (overkill)
- Process doesn't need parameterization (use plain documentation)
- Requirements are binary pass/fail (simpler formats suffice)

## RFC 2119 Keywords

You **MUST** use these keywords as defined in RFC 2119:

| Keyword | Meaning | When to Use |
|---------|---------|-------------|
| **MUST** / **REQUIRED** | Absolute requirement | Hard constraints that cannot be violated |
| **MUST NOT** / **SHALL NOT** | Absolute prohibition | Actions that would cause failure/harm |
| **SHOULD** / **RECOMMENDED** | Strong recommendation | Best practice with valid exceptions |
| **SHOULD NOT** / **NOT RECOMMENDED** | Strong discouragement | Usually bad but sometimes acceptable |
| **MAY** / **OPTIONAL** | Truly optional | Agent decides based on context |

## Required SOP Structure

Every Agent SOP **MUST** include these sections in order:

```markdown
# [SOP Name]

## Overview
[Concise description of what the SOP does and when to use it]

## Parameters

- **required_param** (required): Description
- **optional_param** (optional, default: "value"): Description

**Constraints for parameter acquisition:**
- If all required parameters are already provided, You MUST proceed to the Steps
- If any required parameters are missing, You MUST ask for them before proceeding
- When asking for parameters, You MUST request all parameters in a single prompt
- When asking for parameters, You MUST use the exact parameter names as defined

## Steps
### 1. [Step Name]
Description of what happens in this step.

**Constraints:**
- You MUST [specific requirement]
- You SHOULD [recommended behavior]
- You MAY [optional behavior]

## Examples
[Concrete usage examples]

## Troubleshooting
[Common issues and solutions]
```

## File Naming & Location

**Naming conventions:**
- File extension: `.sop.md`
- Filename: kebab-case (e.g., `code-assist.sop.md`, `idea-honing.sop.md`)
- Descriptive names indicating purpose

**Location:**
- If `agent-sops/` directory exists → write there
- Otherwise → current directory or ask user

## Parameter Section Rules

**Parameter format:**
```markdown
- **parameter_name** (required): Description of required input
- **optional_param** (optional): Description of optional input
- **with_default** (optional, default: "default_value"): Description
```

**Parameter naming:**
- Lowercase letters only
- Underscores for spaces (snake_case)
- Descriptive of purpose
- Required parameters listed before optional

**Required constraints block:**
```markdown
**Constraints for parameter acquisition:**
- If all required parameters are already provided, You MUST proceed to the Steps
- If any required parameters are missing, You MUST ask for them before proceeding
- When asking for parameters, You MUST request all parameters in a single prompt
- When asking for parameters, You MUST use the exact parameter names as defined
```

## Steps Section Rules

Each step **MUST** have:
1. Numbered heading: `### 1. Step Name`
2. Natural language description
3. `**Constraints:**` section with RFC 2119 keywords

**Example step:**
```markdown
### 1. Setup
Initialize the project environment and create necessary structures.

**Constraints:**
- You MUST validate directory structure exists
- You MUST create missing directories
- You MUST NOT proceed if directory creation fails
- You SHOULD log all setup actions
- You MAY skip validation if --force flag is provided
```

**Conditional logic:**
```markdown
### 3. Conditional Processing
If validation passes, proceed with processing. Otherwise, report errors.

**Constraints:**
- You MUST check validation status before proceeding
- If validation passes, You MUST process the data
- If validation fails, You MUST report specific errors
- You MUST NOT continue with invalid data
```

## Negative Constraints

**Always provide context for negative constraints:**

✅ **Good (with context):**
```markdown
- You MUST NOT use ellipses (...) because output will be read aloud by text-to-speech
- You SHOULD NOT delete Git history since this could corrupt the repository
- You MUST NOT run `git push` because this could publish unreviewed code
```

❌ **Bad (without context):**
```markdown
- You MUST NOT use ellipses
- You SHOULD NOT delete Git files
- You MUST NOT run git push
```

**Common contexts:**
- Technical limitations: "because the system cannot handle..."
- Security risks: "since this could expose sensitive data..."
- Data integrity: "as this could corrupt important information..."
- User experience: "because users will be confused by..."
- Performance: "as this could cause significant slowdowns..."

## Validation

**Run validation after EVERY change:**

```bash
# From this skill's directory:
./validate-sop.sh path/to/your-sop.sop.md
```

**You MUST fix all errors (❌) before proceeding.**
**You SHOULD address warnings (⚠️) when possible.**

## Examples Section

Include concrete examples showing:
- Input parameters
- Expected output/behavior
- Common usage patterns

```markdown
## Examples

### Example 1: Basic Usage
**Input:**
- task_description: "Create user authentication system"
- mode: "interactive"

**Expected Behavior:**
Agent will guide through workflow, creating tests first, then implementation.
```

## Troubleshooting Section

Include common issues and solutions:

```markdown
## Troubleshooting

### Parameter Validation Fails
If parameter validation fails, check that:
- All required parameters are provided
- Parameter names use snake_case
- Values match expected types
```

## Interactive SOPs

For SOPs requiring user interaction:

1. Clearly indicate when user interaction is expected
2. Specify how to handle user responses
3. Specify where to save interaction records

```markdown
### 2. Requirements Clarification
Guide the user through questions to refine their initial idea.

**Constraints:**
- You MUST ask one question at a time
- You MUST append each Q&A to "idea-honing.md"
- You SHOULD adapt follow-up questions based on previous answers
- You MUST continue until sufficient detail is gathered
```

## Quick Reference: Validation Checklist

| Check | Requirement |
|-------|-------------|
| File extension | `.sop.md` |
| Title | H1 heading present |
| Overview | `## Overview` section |
| Parameters | `## Parameters` with constraints block |
| Steps | `## Steps` with numbered headings (`### 1.`) |
| Constraints | `**Constraints:**` in each step |
| RFC 2119 | Uses MUST/SHOULD/MAY keywords |
| Negative constraints | Include "because/since/as" context |
| Examples | `## Examples` (recommended) |
| Troubleshooting | `## Troubleshooting` (recommended) |

## Common Mistakes

### Missing Parameter Constraints Block
Every Parameters section needs the acquisition constraints block—this ensures consistent behavior.

### Numbered Steps Missing
Steps must be numbered: `### 1. Step Name`, not `### Step Name`

### Negative Constraints Without Context
"You MUST NOT do X" leaves agents guessing why. Always explain the reason.

### Constraints Outside Steps
Don't put RFC 2119 constraints in Overview—they belong in the `**Constraints:**` section within each step.
