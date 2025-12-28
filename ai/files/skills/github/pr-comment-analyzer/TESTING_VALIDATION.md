# PR Comment Analyzer - Testing & Validation

## Test Coverage

This document tracks the RED-GREEN-REFACTOR testing cycle for the PR Comment Analyzer skill.

### Skill Purpose (From SKILL.md)
> Analyze all review comments on a pull request to assess relevance, identify ambiguities, and generate a detailed report with suggested Q&A discussions. Unlike the PR resolver skill, this skill **only analyzes and reports** without making code changes.

---

## RED Phase: Baseline Testing (Without Skill)

**Objective**: Identify how agents naturally behave when asked to analyze PR comments without explicit skill guidance.

### Test Scenarios

#### Scenario 1: Time-Pressured Quick Analysis
**Setup**: 15 comments, 30 min until meeting, vague request
**Expected Natural Behavior Without Skill**:
- Skim instead of deep analysis
- Assume relevance without verification
- Miss ambiguities due to time pressure
- Provide informal summary, not structured report
- Skip Q&A discussion generation

**Documented Failures**: [To be filled after agent testing]

#### Scenario 2: Contradictory Comments
**Setup**: Same code, 2 different suggestions, no explicit conflict resolution guidance
**Expected Natural Behavior Without Skill**:
- Note separately, not identify as contradiction
- Possibly favor one opinion (authority bias)
- Don't flag for team discussion
- Leave ambiguity unresolved

**Documented Failures**: [To be filled after agent testing]

#### Scenario 3: Outdated Comment Status
**Setup**: File modified, thread unresolved, unclear if comment applies
**Expected Natural Behavior Without Skill**:
- Guess at outdated status
- Not verify against current code
- Miss need for clarification
- Leave uncertainty in report

**Documented Failures**: [To be filled after agent testing]

#### Scenario 4: Domain-Specific Feedback
**Setup**: Technical jargon without context explanation
**Expected Natural Behavior Without Skill**:
- Accept at face value
- Don't request clarification
- Not flag expertise barrier
- Assume they know what they mean

**Documented Failures**: [To be filled after agent testing]

#### Scenario 5: Report Quality Under Stakeholder Pressure
**Setup**: Manager asks for "actionable summary", 25 comments mixed clarity
**Expected Natural Behavior Without Skill**:
- Quick summary instead of comprehensive analysis
- Prioritize "actionability" over completeness
- Skip ambiguity sections
- Avoid Q&A discussions (seen as delay)

**Documented Failures**: [To be filled after agent testing]

---

## GREEN Phase: Testing With Skill (Make It Pass)

**Objective**: Verify that agents using the skill documentation comply with requirements.

### Compliance Requirements

#### Requirement 1: Complete Analysis
- [ ] Analyze ALL comments (not skip due to time)
- [ ] Document relevance assessment for each
- [ ] Classify type and intent
- [ ] Note clarity level

**Verification**: Report contains analysis of 100% of comments

#### Requirement 2: Relevance Verification
- [ ] Check file existence
- [ ] Verify line numbers
- [ ] Compare code context
- [ ] Mark outdated status

**Verification**: Each comment has explicit relevance determination with reasoning

#### Requirement 3: Ambiguity Identification
- [ ] Flag unclear intent
- [ ] Identify contradictions
- [ ] Note domain-specific language
- [ ] Call out outdated-but-unresolved items

**Verification**: Ambiguities section lists all flagged items with category and severity

#### Requirement 4: Structured Report
- [ ] Summary statistics
- [ ] Comments grouped by relevance
- [ ] Issues identified section
- [ ] Recommendations
- [ ] Q&A discussions

**Verification**: Report has all standard sections with proper formatting

#### Requirement 5: Q&A Discussion Generation
- [ ] Generate for each ambiguous item
- [ ] Include 3+ specific questions
- [ ] Provide alternative interpretations
- [ ] Suggest response approaches

**Verification**: Every flagged ambiguity has Q&A discussion

#### Requirement 6: No Code Changes
- [ ] Verify no files modified
- [ ] Confirm no commits made
- [ ] Check no threads resolved
- [ ] Ensure read-only operation

**Verification**: `git status` shows no changes after analysis

#### Requirement 7: Fresh Data
- [ ] Always refetch from GitHub
- [ ] Don't reuse cached context
- [ ] Handle pagination correctly
- [ ] Verify complete data collection

**Verification**: API calls fetch current data, pagination documented

### GREEN Phase Test Results

#### Test 1: Time-Pressured Analysis WITH Skill
**Expected Outcome**: 
- ✅ Completes full analysis despite time pressure
- ✅ Generates structured report
- ✅ Creates Q&A discussions
- ✅ Prioritizes completeness over speed

**Status**: [Pending agent testing]

#### Test 2: Contradictions WITH Skill
**Expected Outcome**:
- ✅ Explicitly identifies contradiction
- ✅ Flags in "Identified Issues"
- ✅ Generates Q&A to reconcile
- ✅ Documents both positions

**Status**: [Pending agent testing]

#### Test 3: Outdated Status WITH Skill
**Expected Outcome**:
- ✅ Clearly determines: outdated/potentially relevant/unclear
- ✅ Verifies against current code
- ✅ Generates Q&A if ambiguous
- ✅ Documents reasoning

**Status**: [Pending agent testing]

#### Test 4: Domain-Specific WITH Skill
**Expected Outcome**:
- ✅ Flags domain-specific terminology
- ✅ Notes in ambiguities section
- ✅ Generates Q&A to request context
- ✅ Documents expertise barrier

**Status**: [Pending agent testing]

#### Test 5: Stakeholder Pressure WITH Skill
**Expected Outcome**:
- ✅ Generates complete report despite pressure
- ✅ Includes all sections (summary, analysis, issues, Q&A)
- ✅ Maintains analysis rigor
- ✅ Acknowledges constraints but preserves process

**Status**: [Pending agent testing]

---

## REFACTOR Phase: Edge Cases & Pressure Testing

**Objective**: Verify skill prevents rationalizations and handles edge cases.

### Refactor Test 1: Extreme Time Pressure
**Scenario**: Production incident (unrelated), manager demands summary only, 2 minutes available

**Skill Requirement**: 
- [ ] Still fetch all comments
- [ ] Still analyze completely
- [ ] Still generate Q&A
- [ ] Can deliver async (save to file)

**Verification**: Report complete despite time constraint, saved for async review

**Status**: [Pending testing]

### Refactor Test 2: Pagination at Boundary
**Scenario**: PR with exactly 100 comments, pagination cursor needed

**Skill Requirement**:
- [ ] Recognize hasNextPage=true
- [ ] Fetch next page
- [ ] Combine results correctly
- [ ] Don't assume "probably got them all"

**Verification**: Report shows 100+ comments analyzed with page count documented

**Status**: [Pending testing]

### Refactor Test 3: API Failures & Retries
**Scenario**: Rate limit exceeded mid-pagination

**Skill Requirement**:
- [ ] Detect rate limit error
- [ ] Provide reset time
- [ ] Don't continue with partial data
- [ ] Recommend re-run after reset

**Verification**: Graceful failure with user guidance, no partial analysis

**Status**: [Pending testing]

### Refactor Test 4: Contradicting Instructions
**Scenario**: Someone says "Skip ambiguities, just focus on critical bugs"

**Skill Requirement**:
- [ ] Follow skill (analyze everything)
- [ ] Not rationalize away ambiguity analysis
- [ ] Include all sections
- [ ] Explain why ambiguities matter

**Verification**: Report includes ambiguities, with note on importance

**Status**: [Pending testing]

### Refactor Test 5: Missing Clear Guidance
**Scenario**: Comment is legitimately unclear - no amount of analysis clarifies it

**Skill Requirement**:
- [ ] Flag as "UNCLEAR"
- [ ] Generate Q&A
- [ ] Don't guess intent
- [ ] Request clarification from author

**Verification**: Ambiguity section documents uncertainty, suggests asking

**Status**: [Pending testing]

---

## Compliance Metrics

### Quantitative Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| **Comments Analyzed** | 100% | Count: analyzed / total |
| **Relevance Verified** | 100% | Have verification steps: yes/no per comment |
| **Ambiguities Detected** | 95%+ | Count: detected / actual ambiguities |
| **Report Sections** | 100% | All required sections present: yes/no |
| **Q&A Discussions** | 100% | Generated for all ambiguous items: yes/no |
| **File Modifications** | 0% | `git diff --name-only`: should be empty |
| **Pagination Correctness** | 100% | Large PR comments count accurate: yes/no |
| **Fresh API Calls** | 100% | No cached context reused: yes/no |

### Qualitative Metrics

- **Report Clarity**: Is analysis easy to understand?
- **Q&A Usefulness**: Do discussions enable team decision-making?
- **Ambiguity Severity**: Are impacts ranked appropriately?
- **Actionability**: Can reader understand next steps?
- **Comprehensiveness**: Does report cover all feedback aspects?

---

## Test Execution Plan

### Phase 1: RED (Baseline) - COMPLETE
- [x] Defined RED scenarios without skill
- [x] Documented expected natural behavior
- [x] Prepared test prompts

### Phase 2: GREEN (With Skill) - IN PROGRESS
- [ ] Run GREEN scenarios with skill loaded
- [ ] Verify each requirement compliance
- [ ] Document agent responses
- [ ] Identify any failures

### Phase 3: REFACTOR (Edge Cases) - PENDING
- [ ] Run edge case scenarios
- [ ] Verify pressure resistance
- [ ] Document loopholes if any
- [ ] Refine skill if needed

### Phase 4: VALIDATION - PENDING
- [ ] Calculate compliance metrics
- [ ] Document pass/fail for each test
- [ ] Generate final test report
- [ ] Mark skill ready (or needs work)

---

## Test Status Summary

| Phase | Status | Notes |
|-------|--------|-------|
| **RED** | ✅ Complete | Baseline scenarios defined |
| **GREEN** | ⏳ In Progress | Awaiting agent responses |
| **REFACTOR** | ⏳ Pending | Ready after GREEN |
| **VALIDATE** | ⏳ Pending | After all phases complete |

---

## Known Limitations

1. **Subagent Responsiveness**: Testing depends on subagent availability
2. **API Rate Limits**: Large test PRs may hit rate limits
3. **Mock Data**: Testing uses real GitHub API (no mocks)
4. **Manual Verification**: Some compliance checks require manual review

---

## Success Criteria

Skill is **READY** when:
- ✅ All RED scenarios captured without rationalization
- ✅ All GREEN scenarios pass with 100% compliance
- ✅ All REFACTOR edge cases handled appropriately
- ✅ All compliance metrics meet targets
- ✅ No critical loopholes identified
- ✅ Documentation complete and clear

Skill **NEEDS WORK** if:
- ❌ Agent rationalizes away key requirements
- ❌ Compliance metrics < 95%
- ❌ Edge cases expose loopholes
- ❌ Code changes detected after analysis
- ❌ Pagination issues with large PRs

---

## Revision History

- **v1.0** (2025-12-21): Initial skill creation and testing framework
  - SKILL.md: Core documentation
  - references: API guide, examples, quick reference, testing scenarios
  - README.md: User-facing documentation
  - TESTING_VALIDATION.md: This file

---

## Next Steps

1. **Run RED Phase Tests**: Execute baseline scenarios with build agent
2. **Document Baseline Failures**: Capture natural behavior without skill
3. **Run GREEN Phase Tests**: Verify compliance with skill guidance
4. **Run REFACTOR Tests**: Check edge cases and pressure resistance
5. **Calculate Metrics**: Measure compliance and success rates
6. **Final Validation**: Mark skill as production-ready or identify improvements
7. **Deploy**: Add skill to available skills directory
