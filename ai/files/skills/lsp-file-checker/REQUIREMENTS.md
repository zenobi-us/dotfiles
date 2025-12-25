# LSP File Checker Skill - Requirements Document

## Overview

This skill guides agents through systematically checking files using Language Server Protocol (LSP) tools, addressing baseline agent behavior gaps where they lack decision frameworks, skip prerequisite validation, and fail to explore fallback options.

## Executive Summary: Baseline Gaps

### Observed Problems

- **Gap 1**: Agents pick LSPs randomly when multiple options exist (no selection criteria)
- **Gap 2**: When file type is unknown, agents read files manually instead of detecting language
- **Gap 3**: When LSP unavailable in mise, agents give up instead of exploring alternatives
- **Gap 4**: Agents don't verify LSP prerequisites (runtime dependencies, system requirements)
- **Gap 5**: No systematic validation planning (what should we check?)
- **Gap 6**: No record of which LSP was used or why (reproducibility failure)

---

## Functional Requirements

### FR1: File Type Detection

**Goal**: Automatically map file to appropriate language/LSP without ambiguity

**Required capabilities**:

- Accept file path as input
- Detect language from file extension with confidence score
- Handle ambiguous extensions (`.config`, `.conf` → need additional context)
- Map language name to available LSPs in mise
- Fall back to content inspection if extension is ambiguous

**Acceptance criteria**:

- `config.kdl` → Language: "Kdl" → LSP: "Zellij config (Kdl language)"
- `setup.py` → Language: "Python" → Multiple LSPs available
- `unknown.xyz` → "Language unknown, need manual investigation"

**Rationalizations to prevent**:

- ❌ "I'll just read the file and guess"
- ✅ "File type is X, language is Y, looking for Z LSPs"

---

### FR2: LSP Selection Logic

**Goal**: Provide decision criteria when multiple LSPs are available

**Required inputs**:

- Language name (e.g., "Python")
- Available LSPs from mise search
- File being checked
- Agent's validation goals (optional)

**Required outputs**:

- Ranked list of LSPs with reasoning
- Trade-offs explained (performance, features, coverage)
- Recommended choice with justification
- Risk assessment for less common LSPs

**Selection criteria** (in order of application):

1. **Stability tier**: Mature → Experimental (prefer stable)
2. **Feature coverage**: What does each LSP validate?
3. **Performance**: Resource requirements
4. **Maintenance status**: Is it actively maintained?
5. **Integration**: Does it work with available runtime?

**Example decision tree**:

```
Python LSPs available: pylance, pyright, python-language-server

Step 1: Check feature coverage
  - pylance: Microsoft's proprietary, full-featured, requires VSCode integration
  - pyright: Open-source, comprehensive static analysis, lightweight
  - python-language-server: Legacy, minimal maintenance

Step 2: Check runtime requirements
  - pylance: Needs VSCode runtime
  - pyright: Needs Node.js
  - python-language-server: Needs Python 3.5+

Step 3: Recommend
  → "Use pyright: open-source, well-maintained, works standalone"
```

**Rationalizations to prevent**:

- ❌ "All language servers do the same thing, pick any"
- ❌ "pylance is most popular, let's use it"
- ✅ "Comparing: [feature matrix]. Recommendation: [LSP] because [reasoning]"

---

### FR3: Prerequisite Verification

**Goal**: Verify that chosen LSP can actually run in current environment

**Required checks**:

- Runtime dependency installed (Python, Node.js, Ruby, Go, etc.)
- Runtime version compatibility
- System library dependencies (glibc, openssl, etc.)
- PATH accessibility

**For each LSP, provide**:

- Required runtime + version
- How to verify installation: `command: <cmd>`
- Installation instructions if missing
- Fail-safe: suggest alternative LSP if prerequisites unmet

**Example**:

```
Selected LSP: pyright
  Runtime required: Node.js >= 14
  Verify with: node --version
  Status: ✗ NOT INSTALLED
  
  Alternatives available:
    - pyright (requires Node.js) [PRIMARY]
    - python-language-server (requires Python 3.5+) [FALLBACK]
  
  Action: Would you like to install Node.js or use python-language-server instead?
```

**Rationalizations to prevent**:

- ❌ "Install and use it" (without checking prerequisites)
- ✓ "Prerequisites verified: [runtime] [version] installed"

---

### FR4: Fallback Strategy

**Goal**: Provide systematic alternatives when primary LSP unavailable

**Fallback hierarchy**:

1. **LSP alternatives**: Other LSPs for same language
2. **Generic validators**: Syntax checkers, linters (shellcheck, eslint, etc.)
3. **Manual validation**: File type → validation rules → manual check
4. **No LSP path**: Read file + structured review based on language syntax rules

**Decision path**:

```
LSP for [Language] not found
  ↓
Check mise for alternatives
  ↓
Found [List of alternatives]?
  YES → Apply FR2 (LSP Selection Logic)
  NO → Check for language-specific linters
       Found? YES → Use linter
       NO → Offer manual validation guidance
```

**For KDL files (no LSP likely)**:

```
Language: Kdl (Zellij config)
LSP search: No LSP in mise
Alternatives:
  - Zellij has built-in config validation (zellij check)
  - Manual syntax validation against kdl spec
  - Validate against schema: [link to zellij docs]

Recommendation: Use zellij check if available, or manual validation
```

**Rationalizations to prevent**:

- ❌ "No LSP available, can't validate"
- ✓ "LSP not available. Fallback: [alternative approach] or [alternative LSP]"

---

### FR5: Validation Planning

**Goal**: Understand what each LSP validates before using it

**For each LSP, document**:

- Validation scope: syntax, types, style, performance, security
- What it DOES check
- What it DOESN'T check
- Common false positives
- Output format and interpretation

**Example for pyright (Python)**:

```
Validation Scope:
  ✓ Syntax errors
  ✓ Type mismatches
  ✓ Undefined variables
  ✓ Unused imports
  ✗ Style issues (use pylint/flake8)
  ✗ Performance analysis
  ✗ Security vulnerabilities (use bandit)

Common false positives:
  - Dynamic module imports
  - TypedDict with extra keys
  
Output interpretation:
  - Error: Code won't work
  - Warning: Potential issue
  - Information: Informational only
```

**Rationalizations to prevent**:

- ❌ "Run LSP and show all output"
- ✓ "LSP checks: [scope]. Will validate: [what]. Won't validate: [what]"

---

### FR6: Execution & Reproducibility

**Goal**: Check file with LSP and record what was done

**Execution flow**:

1. Verify file exists and is readable
2. Confirm LSP installed and accessible
3. Run LSP with appropriate flags for file type
4. Capture output
5. Record: timestamp, LSP version, LSP used, file path, results
6. Provide structured output format

**Recording format**:

```
Validation Record:
  Timestamp: 2025-12-18T14:32:00Z
  File: /path/to/file.kdl
  Language: Kdl
  Tool: zellij check
  Tool version: 0.40.0
  Status: ✓ Valid / ✗ Invalid / ⚠ Warnings
  Results: [structured output]
  Fallback used: yes/no
```

**Rationalizations to prevent**:

- ❌ "Ran the tool, here's output" (no record)
- ✓ "Validated [file] with [tool v.X], results: [structured output]"

---

## Non-Functional Requirements

### NR1: Decision Framework Clarity

**All decisions must show reasoning**:

- When choosing between LSPs: show comparison matrix
- When falling back: show why primary failed, why alternative chosen
- When skipping validation: explain the constraint

**Agents must not rationalize**:

- "This seems like the right choice" → Require evidence
- "This is common practice" → Show specific reasoning
- "Probably works" → Verify before proceeding

### NR2: Fail-Safe Defaults

**Never silently proceed without agent acknowledgment when**:

- Using experimental/unmaintained LSP
- Skipping prerequisite that's unverified
- Falling back to manual validation when automation available
- Runtime version is below recommended minimum

### NR3: Compatibility Matrix

**Maintain mapping**:

- File extension → Language
- Language → Available LSPs (from mise)
- LSP → Runtime dependencies
- LSP → Validation scope

### NR4: Graceful Degradation

**If LSP selection impossible, explicitly state**:

- What was attempted
- Why it failed
- What manual steps agent should take
- How to escalate (ask user for guidance)

---

## Success Metrics

### Baseline Behavior (Before Skill)

- Agents guess LSP: 90% of time
- Agents skip prerequisite checks: 100% of time
- Agents give up when LSP missing: 70% of time
- Agents record tool used: 0% of time

### Target Behavior (After Skill)

- Agents use selection criteria: 100% of cases
- Agents verify prerequisites: 100% of cases
- Agents explore fallbacks: 100% of cases
- Agents record tool + reasoning: 100% of cases
- Agents catch mismatches before tool runs: 95%+ of cases

---

## Skill Interface

### Primary Function Signature

```
checkFileWithLSP(filePath: string, options?: {
  forceLanguage?: string;           // Override language detection
  selectLSP?: 'recommended' | 'interactive' | 'first-available';
  validatePrerequisites?: boolean;  // Default: true
  recordValidation?: boolean;       // Default: true
  fallbackAllowed?: boolean;        // Default: true
}): Promise<ValidationResult>
```

### ValidationResult Structure

```typescript
{
  success: boolean;
  file: string;
  language: string;
  detectionConfidence: number;      // 0-1
  lsp: {
    name: string;
    version: string;
    isFallback: boolean;
  };
  prerequisites: {
    verified: boolean;
    issues: string[];
  };
  validation: {
    scope: string[];                 // What was checked
    errors: ValidationIssue[];
    warnings: ValidationIssue[];
  };
  record: ValidationRecord;
  reasoning: string;                 // Why these choices
}
```

---

## Out of Scope

- ❌ Fixing issues (only detection)
- ❌ Comparing code quality across multiple LSPs (only selection)
- ❌ Installing new language servers in mise (only discovering existing)
- ❌ Custom LSP configuration (only standard modes)
- ❌ Real-time file watching (one-shot validation only)

---

## Testing Strategy

**Test scenarios derived from baseline observations**:

| Scenario | Input | Expected Behavior | Gap Prevented |
|----------|-------|-------------------|---------------|
| **S1: Unknown file type** | config.kdl, no LSP installed | Detect language, offer alternatives, explain why no LSP | Gap 2 (manual reading) |
| **S2: Multiple LSPs** | Python file, 3 LSPs in mise | Show comparison, recommend one, explain trade-offs | Gap 1 (random selection) |
| **S3: Missing prerequisites** | pyright selected, Node not installed | Detect missing runtime, show alternatives or install path | Gap 4 (prerequisite skip) |
| **S4: No LSP available** | .xyz file, no matching LSP | Systematic fallback to linters/manual validation | Gap 3 (giving up) |
| **S5: Ambiguous extension** | .config file | Ask for context or inspect content to disambiguate | Gap 2 (random guess) |
| **S6: Reproducibility** | Any validation | Record tool used, version, timestamp, reasoning | Gap 6 (no record) |

---

## Acceptance Criteria - Skill Complete When

1. ✓ Agents never guess file type (always confirm or detect)
2. ✓ Agents always show LSP selection reasoning (comparison matrix)
3. ✓ Agents always verify prerequisites before using LSP
4. ✓ Agents always explore fallback when primary unavailable
5. ✓ Agents always explain what LSP validates and doesn't
6. ✓ Agents always record: tool, version, file, timestamp, results
7. ✓ All rationalizations listed in this doc are prevented
8. ✓ All test scenarios pass with expected behavior
