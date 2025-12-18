# LSP File Checker Skill - Test Cases

Test cases derived from baseline behavior observations to verify the skill prevents all identified gaps.

---

## Test Scenario Matrix

| ID | Scenario | Baseline Gap | Expected Outcome | Pass Criteria |
|----|----------|--------------|------------------|---------------|
| TC1 | Unknown file type (KDL) | Gap 2 | Detect language, no manual reading | Language identified, approach explained |
| TC2 | Multiple LSP options (Python) | Gap 1 | Compare and select, show reasoning | Comparison matrix shown, choice justified |
| TC3 | Missing prerequisites | Gap 4 | Detect, offer alternatives | Prerequisites verified before use |
| TC4 | No LSP available | Gap 3 | Systematic fallback | Fallback strategy applied, not "can't do it" |
| TC5 | Ambiguous extension | Gap 2 | Disambiguate via context | File type confirmed, not guessed |
| TC6 | Validation scope unclear | Gap 5 | Document what each LSP checks | Scope listed before validation |
| TC7 | Reproducibility | Gap 6 | Record tool, version, timestamp | Validation record created and stored |

---

## Detailed Test Cases

### TC1: Unknown File Type (config.kdl)

**Setup**:

- File: `/home/zenobius/Projects/dotfiles/shells/files/zellij/config.kdl`
- Skill invoked with no language hint
- Mise has no KDL language server

**Baseline behavior (WITHOUT skill)**:

```
Agent: "I'll read the file to see what's in it"
Action: Opens file, skims content
Reasoning: "Looks like config syntax, probably valid"
Result: No systematic validation
```

**Expected behavior (WITH skill)**:

```
Skill: "File extension .kdl → Language: Kdl (Zellij config)"
Skill: "Searching mise for Kdl LSPs..."
Skill: "No LSP found in mise"
Skill: "Fallback options:"
       1. Use zellij check (if available)
       2. Manual validation against Zellij kdl spec
Skill: Offer to validate with detected fallback approach
```

**Pass criteria**:

- ✓ Language auto-detected as "Kdl" (not guessed)
- ✓ No suggestion to read file manually
- ✓ Fallback options listed
- ✓ Approach explained before proceeding

**Test command**:

```bash
skill.checkFileWithLSP('/home/zenobius/Projects/dotfiles/shells/files/zellij/config.kdl')
```

---

### TC2: Multiple LSP Options (Python)

**Setup**:

- File: Any `.py` file
- Mise has: pylance, pyright, python-language-server
- Goal: Select best option

**Baseline behavior (WITHOUT skill)**:

```
Agent: "Python LSPs available: pylance, pyright, python-language-server"
Agent: [No decision process]
Agent: "Let's use pyright" [picked arbitrarily or by guess]
Result: No justification for choice
```

**Expected behavior (WITH skill)**:

```
Skill: Comparing Python LSPs:

┌─────────────────┬──────────┬────────────┬────────────┬────────────┐
│ LSP             │ Stability│ Features   │ Runtime    │ Maint.     │
├─────────────────┼──────────┼────────────┼────────────┼────────────┤
│ pyright         │ Stable   │ Full       │ Node.js ≥14│ Active     │
│ pylance         │ Stable   │ Full*      │ VSCode req │ Active     │
│ python-lsp      │ Legacy   │ Minimal    │ Python 3.5 │ Stale      │
└─────────────────┴──────────┴────────────┴────────────┴────────────┘

Recommendation: pyright
Reasoning: 
  - Open-source (vs pylance proprietary)
  - Well-maintained (vs python-lsp legacy)
  - Standalone runtime (vs pylance VSCode dependency)
```

**Pass criteria**:

- ✓ Comparison matrix shown
- ✓ Trade-offs explained
- ✓ Recommendation with specific justification
- ✓ No arbitrary choice

**Test command**:

```bash
skill.checkFileWithLSP('test.py', { selectLSP: 'recommended' })
```

---

### TC3: Missing Prerequisites

**Setup**:

- File: `test.py`
- Selected LSP: pyright (requires Node.js)
- Node.js not installed

**Baseline behavior (WITHOUT skill)**:

```
Agent: "Using pyright"
Action: Attempts to run pyright
Result: Command not found error, no recovery
```

**Expected behavior (WITH skill)**:

```
Skill: Selected LSP: pyright
Skill: Verifying prerequisites...
       Runtime: Node.js
       Required: ≥ 14
       Check: node --version
       Status: ✗ NOT FOUND

Skill: Prerequisites missing!
Skill: Options:
       1. Install Node.js: [instructions]
       2. Use alternative LSP: python-language-server (needs Python 3.5+)
       3. Continue without validation
Skill: Awaiting decision...
```

**Pass criteria**:

- ✓ Prerequisites detected as missing before attempt
- ✓ Alternatives listed with their requirements
- ✓ Installation path provided
- ✓ Agent must acknowledge before proceeding

**Test command**:

```bash
# Simulate Node.js missing, pyright selected
skill.checkFileWithLSP('test.py', { 
  selectLSP: 'first-available',
  validatePrerequisites: true 
})
```

---

### TC4: No LSP Available (Fallback Strategy)

**Setup**:

- File: `unknown.xyz` or similar rare file type
- No matching LSP in mise
- No obvious language detected

**Baseline behavior (WITHOUT skill)**:

```
Agent: "No LSP found for this language"
Result: Gives up, no validation attempted
```

**Expected behavior (WITH skill)**:

```
Skill: File type detection: .xyz
Skill: Language unknown or not recognized
Skill: Checking for language-specific tools...
Skill: No LSP found
Skill: Fallback strategy (in order):
       1. Syntax checkers/linters: [none found]
       2. Generic validators: [available options]
       3. Manual validation: kdl spec rules
       4. Inspect file content for obvious issues
       
Skill: Recommendation: Manual validation guidance
Skill: Would you like me to:
       a) Show common syntax rules for this file type
       b) Attempt generic structure validation
       c) Escalate to user for guidance
```

**Pass criteria**:

- ✓ Systematic fallback applied (not immediate surrender)
- ✓ Multiple strategies attempted in priority order
- ✓ User presented with options, not dead end

**Test command**:

```bash
skill.checkFileWithLSP('unknown.xyz', { fallbackAllowed: true })
```

---

### TC5: Ambiguous Extension (.config)

**Setup**:

- File: `.config` (could be many languages)
- Without context, language unclear

**Baseline behavior (WITHOUT skill)**:

```
Agent: "File is .config"
Agent: [Guesses it's INI or YAML]
Result: Wrong LSP chosen, validation fails
```

**Expected behavior (WITH skill)**:

```
Skill: File extension: .config
Skill: Confidence: LOW (ambiguous)
Skill: Possible languages:
       - INI
       - YAML
       - TOML
       - Generic config
Skill: Disambiguating via content inspection...
Skill: Content analysis suggests: YAML format
Skill: Or ask user: "What format is this .config file?"
Skill: Detected language: YAML (confidence: 85%)
Skill: Proceeding with YAML LSP...
```

**Pass criteria**:

- ✓ Ambiguity detected (not assumed)
- ✓ Multiple candidates listed
- ✓ Content used to disambiguate OR user asked
- ✓ Confidence score shown
- ✓ No silent guess

**Test command**:

```bash
skill.checkFileWithLSP('.config')
```

---

### TC6: Validation Scope Unclear

**Setup**:

- Selected LSP: pyright for Python file
- Question: What will it actually validate?

**Baseline behavior (WITHOUT skill)**:

```
Agent: "Running pyright"
Result: Errors reported, agent interprets without context
```

**Expected behavior (WITH skill)**:

```
Skill: LSP: pyright
Skill: Validation scope:
       ✓ Will check:
         - Syntax errors
         - Type mismatches (static analysis)
         - Undefined variables
         - Unused imports
       ✗ Will NOT check:
         - Style/formatting (use black, flake8)
         - Performance issues
         - Security vulnerabilities (use bandit)
         - Code complexity

Skill: Common false positives: [list]
Skill: Output interpretation:
       - Error: Code has issues
       - Warning: Potential problem
       - Info: Informational only

Skill: Running validation...
```

**Pass criteria**:

- ✓ Validation scope listed before running tool
- ✓ Clear what is and isn't checked
- ✓ False positives documented
- ✓ Output interpretation guidance provided

**Test command**:

```bash
skill.checkFileWithLSP('test.py', { selectLSP: 'recommended' })
# Should print scope before validation
```

---

### TC7: Reproducibility & Recording

**Setup**:

- Any validation performed
- Track: what was used, when, why

**Baseline behavior (WITHOUT skill)**:

```
Agent: "Validated file"
Result: No record of which tool, version, or reasoning
Reproducibility: Impossible
```

**Expected behavior (WITH skill)**:

```
Skill: Validation complete
Skill: Recording results...

ValidationRecord {
  timestamp: '2025-12-18T14:32:00Z',
  file: '/path/to/test.py',
  language: 'Python',
  tool: 'pyright',
  toolVersion: '1.1.257',
  prerequisitesVerified: true,
  isFallback: false,
  reasoning: 'Selected pyright: open-source, well-maintained, Node.js available',
  validation: {
    errors: [],
    warnings: [{issue}, {issue}],
    scope: ['syntax', 'types', 'undefined-vars']
  },
  recordPath: '/var/log/validation-2025-12-18.json'
}

Skill: Validation record saved for reproducibility
```

**Pass criteria**:

- ✓ Record created with all metadata
- ✓ Timestamp captured
- ✓ Tool and version logged
- ✓ Reasoning/decision path recorded
- ✓ Record can be retrieved later

**Test command**:

```bash
const result = await skill.checkFileWithLSP('test.py', { recordValidation: true })
console.log(result.record)  // Shows full validation record
```

---

## Integration Test: Full Workflow

**Combined test simulating real agent usage**:

```javascript
// Agent encounters KDL file, doesn't know language, picks LSP, validates
const result = await skill.checkFileWithLSP(
  '/home/zenobius/Projects/dotfiles/shells/files/zellij/config.kdl'
);

// Expected flow:
// 1. Detect: Language is Kdl ✓
// 2. Search: No Kdl LSP in mise ✓
// 3. Fallback: Offer zellij check or manual ✓
// 4. Validate: Use fallback (or skip with reasoning) ✓
// 5. Record: Save result with full reasoning ✓

console.log({
  language: result.language,           // 'Kdl'
  detectionConfidence: result.detectionConfidence,  // 0.95
  lsp: result.lsp.name,               // 'zellij-check' (fallback)
  isFallback: result.lsp.isFallback,   // true
  prerequisitesVerified: result.prerequisites.verified,  // true
  reasoning: result.reasoning,        // Full decision path
  record: result.record               // Saved for reproducibility
});
```

**Pass if all 7 baseline gaps are closed in this flow:**

- ✓ Gap 1: No random LSP selection
- ✓ Gap 2: No manual file reading
- ✓ Gap 3: Fallback applied
- ✓ Gap 4: Prerequisites verified
- ✓ Gap 5: Scope documented
- ✓ Gap 6: Record created

---

## Failure Modes to Test

**Negative test cases - skill should gracefully handle**:

| Case | Input | Expected Behavior |
|------|-------|-------------------|
| **File not found** | Non-existent path | Clear error, stop cleanly |
| **No language detected** | Binary file | Offer manual inspection or skip |
| **Broken LSP** | LSP installed but fails | Fallback to alternative or manual |
| **User cancels** | Agent stops mid-validation | Save partial record, exit cleanly |
| **Conflicting options** | `selectLSP: 'first-available'` but `validatePrerequisites: true` | Handle gracefully (prerequisites first) |

---

## Success Metrics

**Before skill deployed**:

- Baseline: Agents skip prerequisite checks 100% of time
- Baseline: Agents pick LSP randomly 90% of time
- Baseline: Agents give up when LSP missing 70% of time
- Baseline: No reproducibility records 0% saved

**After skill deployed** (target):

- **100%** of cases: Prerequisites verified before use
- **100%** of cases: LSP selection shown with reasoning
- **100%** of cases: Fallback attempted when needed
- **100%** of cases: Validation record created
- **95%+** of cases: Mismatches caught before tool runs
