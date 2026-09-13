---
name: feature-request
description: Investigate and submit a repository feature request, when a user has a repository and feature idea, resulting in a feasibility report and a repository-compliant request only when the idea remains viable
---

# Prepare a Feature Request

Use this workflow when the user gives a repository and a feature or idea. Treat the repository as the source of truth. Separate evidence from assumptions. Always create a Markdown draft in the active shared context. Submit a request only after the idea passes the viability gate.

## Inputs

- **Repository**: `$REPO` — a cloneable Git URL, owner/name slug, or local repository path.
- **Feature idea**: `$IDEA` — the requested outcome, not only an implementation.

If either input is missing, ask for it before doing repository work. If `$IDEA` has an ambiguity that changes the feasibility result, use the `grilling` skill and ask one question at a time. Let repository evidence answer questions that do not require a user decision.

## Non-negotiable outputs

Create one Markdown file in the active shared-context root before the final decision. Keep it when the idea is not viable. Update the same file after each completed stage: workspace establishment, repository-rule discovery, outcome clarification, feasibility research, capability grouping, viability gate, and submission preparation. Include:

- repository and revision examined
- original feature idea and clarified user answers
- repository rules and request channel
- current capabilities and relevant code paths
- feasibility findings
- existing capability matches
- options grouped by compromise: exact fit, small compromise, major compromise, or not a match
- political or project-vision risks
- functional and technical risks
- recommendation and confidence
- final status: `viable`, `needs user decision`, or `not viable`
- submission link, command, or exact next step when submitted

Use a stable name such as `feature-requests/<repo-slug>-<date>-<short-slug>.md` unless the active shared context defines another convention. Do not place the draft only in the temporary clone.

## Workflow

### 1. Establish the workspace

1. Resolve `$REPO_SLUG` from the repository identity. Use the owner and repository name when available.
2. Create the clone directory with the requested pattern:

   ```sh
   TMP_DIR="$(mktmp -d "$REPO_SLUG.XXXXXX")"
   ```

   If `mktmp` is unavailable, select and run an equivalent command that creates a system temporary directory. Do not continue until the directory is temporary, writable, and unused. Do not clone into the current repository, a user project directory, or a permanent scratch directory. Record the command and resulting path.
3. Clone `$REPO` into that directory:

   ```sh
   git clone "$REPO" "$TMP_DIR/repository"
   ```

   Record the clone URL, path, branch, commit, and remote state.
4. Treat the user's request for this workflow as explicit authorisation to run shared-context `init` for the cloned repository. Invoke the shared-context skill with the clone as the repository context. Run `report` first and confirm that the origin and slug match `$REPO`. Run `init` only for that clone. Then run `report` and `files` again to identify the active shared root and its conventions. Stop if the origin, slug, or root does not match.
5. Create the feature-request Markdown draft in the reported active shared root. Confirm that the file exists before continuing. Update it after every completed stage.

**Completion criterion:** The repository is cloned in a temporary directory, the clone revision is recorded, shared context is initialised for the matching origin, and the draft exists in the active shared root.

### 2. Read repository instructions before analysis

Before forming any recommendation, recursively discover instruction and contribution files from the repository root. Include every applicable `AGENTS.md`, `CLAUDE.md`, equivalent agent file, `CONTRIBUTING*`, issue template, governance file, support policy, and directory-local instruction file. Do not limit discovery to directories that appear relevant. For every discovered file, record `read`, `not applicable`, or `blocked`, with the reason. For every source directory or file inspected later, resolve the most-specific applicable instructions first. Search for, at minimum:

- `AGENTS.md`, `CLAUDE.md`, and other agent instructions
- `CONTRIBUTING*`
- `README*`
- issue and feature-request templates under `.github/ISSUE_TEMPLATE/` or equivalent
- `CODE_OF_CONDUCT*`, `SECURITY*`, and support policies
- maintainer or governance documents
- `docs/`, design notes, roadmap, and architecture records
- repository metadata, package scripts, and test commands

Record the exact files read and the rules that affect a feature request. Follow the repository's stated channel, template, labels, title format, and evidence requirements. Treat a request to avoid feature requests, a project-scope statement, or a maintainer policy as a viability constraint.

**Completion criterion:** Every discovered instruction and contribution file is recorded as `read`, `not applicable`, or `blocked`; every later-inspected path has its most-specific rules applied; and the request channel is known or reported as unknown.

### 3. Clarify the outcome

Rewrite `$IDEA` as a user outcome and acceptance boundary. Identify:

- who needs it and what problem it solves
- the smallest useful behavior
- required inputs, outputs, and interaction
- compatibility, security, performance, and platform constraints
- what is explicitly out of scope

Invoke the `grilling` skill when any unresolved choice can change the research path, acceptance boundary, supported platform, security or compatibility constraint, compromise level, or recommendation. Ask one question per turn, state the recommended answer, and wait for the user's answer before continuing. Do not replace a user decision with an assumption. Record the user's answer, or a specific statement that repository evidence resolved the choice without user input, in the draft.

If the idea is sufficiently clear, continue without an interview. Do not ask questions that repository research can answer.

**Completion criterion:** The draft contains a testable outcome, a bounded scope, and either the user's answers or a record that no blocking ambiguity remained.

### 4. Research feasibility

Use the cloned repository and first-party materials as primary evidence. For each surface below, record the search performed, relevant paths or queries, and result in the draft:

- source code and call paths;
- tests and fixtures;
- configuration and package metadata;
- public commands, APIs, and extension points;
- user-facing documentation and examples;
- changelog, roadmap, and architecture records;
- open and closed issue or discussion history;
- first-party upstream documentation when the repository depends on an external system.

Mark each surface `inspected`, `not present`, or `blocked`. Omit a surface only when the repository does not contain it. Run focused read-only checks or tests when they provide evidence. Do not implement the feature.

Assess feasibility on three separate axes:

1. **Functional:** Can the current product or architecture express the behavior? Identify the required code paths, data flow, API surface, state, and tests.
2. **Technical:** What changes, dependencies, migrations, compatibility work, maintenance cost, and failure modes would it require?
3. **Political or vision:** Does it fit the stated project purpose, supported platforms, maintainer policy, governance, roadmap, and user audience? Treat maintainer statements and contribution policy as evidence, not as obstacles to bypass.

For each conclusion, cite a repository path, line range when useful, commit, issue, or official project statement. Label inference as inference. Record contradictory evidence.

**Completion criterion:** The draft contains a search record for every applicable research surface, evidence-based findings for functional, technical, and political or vision feasibility, source references, and recorded uncertainty.

### 5. Check whether the capability already exists

Search for the requested behavior under different names. Inspect user-facing documentation, commands, configuration, APIs, tests, examples, changelog entries, and open or closed issues. Classify the result:

- **Already possible:** The feature works now. Give exact steps and limits.
- **Partly possible:** Existing behavior covers part of the outcome. State the missing part and the smallest gap.
- **Possible with configuration or extension:** A supported option, plugin, hook, script, or integration provides it. Explain the supported route and trade-offs.
- **Possible with compromise:** The outcome is achievable only by changing scope, interface, platform, or guarantees.
- **Not currently possible:** The architecture, policy, or project scope blocks it with current evidence.
- **Unknown:** Evidence is insufficient. State what would resolve the uncertainty.

Group every materially different existing, configurable, extensible, proposed, rejected, and unknown approach by compromise level. Include approaches that are already possible or not a match. Use `Not a match` for approaches that fail the outcome or conflict with project constraints.

Group the approaches by compromise level:

| Level | Meaning |
| --- | --- |
| Exact fit | Meets the stated outcome and constraints without a material trade-off. |
| Small compromise | Needs a bounded trade-off that the user may accept. |
| Major compromise | Changes important scope, interface, platform, guarantees, or maintenance cost. |
| Not a match | Does not meet the outcome or conflicts with project constraints. |

If an existing supported capability meets the stated outcome, set the default recommendation to `do not submit a feature request`. Proceed only when the user identifies a specific supported-capability gap and the draft cites the current path, its exact limitation, affected users, and the improvement acceptance boundary. Recommend documentation, configuration, an extension request, a bug report, or a feature request according to the evidence and repository rules.

**Completion criterion:** The draft lists every materially different existing or proposed approach, records its classification and evidence, and places it in the compromise table.

### 6. Apply the viability gate

Mark the idea `viable` only when all of these are true:

- the user outcome is clear;
- no existing supported capability already solves it, unless the request is for a justified improvement;
- at least one approach fits the project vision and has a credible technical path;
- every remaining material compromise is explicitly approved by the user after its effect on scope, interface, platform, guarantees, or maintenance cost is clear; the agent's recommendation is not user approval;
- the repository's contribution policy permits this type of request;
- the request can state a focused problem, use case, and acceptance boundary.

If a compromise requires a user decision, set status to `needs user decision`, ask the focused question, update the draft, and re-run the gate. Do not mark the idea `viable` while any material condition is `unknown` or `pending`, or while contradictory evidence that could change the recommendation remains unresolved. If the idea fails the gate, set status to `not viable`, explain why, and give the best supported alternative. If an operation prevents the required research, set status to `blocked`. Still keep the draft when it exists.

**Completion criterion:** The draft records each gate condition as pass, fail, or pending, with evidence and a clear status.

### 7. Prepare and submit the request

Run this step only for `viable` ideas.

1. Read the repository's current feature-request template and submission instructions again.
2. Draft the request in the repository's required format. Use the project's terminology. Include the problem, users, proposed outcome, concrete use case, alternatives considered, compromise or trade-offs, implementation notes only when useful, and acceptance criteria.
3. Check that the request does not claim unsupported facts. Link the research draft only when the repository permits external links and the link is accessible to maintainers.
4. Show the final request to the user before an irreversible submission, unless the user explicitly authorised automatic submission in the original request.
5. Submit through the documented channel. Record the URL, identifier, or exact failure in the shared-context draft.

**Completion criterion:** The request matches the repository template and is either submitted with a recorded result or ready for the user with the exact next action.

## Safety and failure handling

- Keep all repository changes read-only. The feature-request draft belongs in shared context, not in the clone, unless the repository explicitly requires an issue file.
- Do not bypass contribution rules, maintainer policies, authentication, rate limits, or issue templates.
- If cloning fails after the draft exists, record the command and error in the draft, set status to `blocked`, and stop repository analysis.
- If shared-context initialisation fails, do not create a fallback draft outside shared context. Report `draft not created because shared-context initialisation failed`, with the failed command and error.
- If no request channel or template exists, record that fact. Ask the user whether to open the standard issue channel only if the repository provides one.
- If sources conflict, preserve both sources and lower confidence. Do not resolve the conflict by guessing.
- If the request is already possible, provide the exact supported path instead of submitting a duplicate feature request.

## Final response

Report:

- the temporary clone path and revision;
- the shared-context draft path, or `draft not created because shared-context initialisation failed`;
- the main evidence and feasibility result;
- existing capability and compromise levels;
- the final status: `viable`, `needs user decision`, `not viable`, or `blocked`;
- submission result or the exact user action still required.

Report the shared-context draft path whenever the draft exists. If shared-context initialisation fails, report the exact `draft not created because shared-context initialisation failed` state instead.
