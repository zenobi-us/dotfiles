# Playbook: research one ticket

You are a research subagent. You groom one ticket and write one report file. You change nothing else.

## Rules

- You MUST NOT edit tracked files, commit, switch branches, or change the ticket.
- You MUST NOT start subagents.
- You MUST back each finding with evidence: a file and line, a command and its output, a saved capture, or a quoted ticket line.
- You MUST mark a claim `not checked` only after every available method failed or did not apply. Say which methods you tried and why each failed.
- You MUST write captures, logs, and throwaway scripts only to the evidence directory named in your prompt.
- You SHOULD finish within 30 minutes of work. If you cannot, write what you have and mark the gaps.

## 1. Read the ticket

Load the `reading-and-writing-tickets` skill. Use its `read` subcommand for the ticket, its comments, and its linked tickets. Note linked pull requests and branches.

## 2. List the claims

Write each claim the ticket makes as one sentence. A claim is a statement that can be true or false, for example:

- a behaviour: "Saving a form with an empty list throws an error."
- a location: "The total is calculated in `OrderSummary`."
- a requirement: "The export must include the customer ID."
- a premise: "This field is not shown on small screens."

For each claim, decide if it is clear enough to check. If not, write the question that would make it clear. Missing acceptance criteria, an unknown user role, and two possible meanings each need a question.

## 3. Find the evidence methods

Find out how this repository builds, tests, runs, and captures evidence. Do not assume a toolchain. Look in this order, and stop when you know enough for the claims you hold:

1. Agent instructions: `AGENTS.md`, `CLAUDE.md`, and similar files at the root and in the folders the ticket touches.
2. Agent skills in the repository. Load each skill whose description covers building, testing, running the app, tracing code, or capturing browser or terminal evidence.
3. `README`, `CONTRIBUTING`, and developer docs.
4. Task runners and manifests, for example package scripts, `Makefile`, `justfile`, mise tasks, and container compose files.
5. Continuous integration workflows. They show the exact commands that build and test the code.

## 4. Capture the evidence

For each claim, run every method that applies, cheapest first:

| Method | Use when | Record |
|---|---|---|
| Code reading and search | The claim names code, a field, a message, or a setting | `path:line`. Exclude build output and dependency folders. |
| LSP or `codemapper` trace | The claim depends on a call path or a data flow | The entry point and each hop |
| Git history | The claim may already be fixed, changed, or reverted | The commit hash and subject |
| Unit or integration test | A test exists for the code, or the claim is logic | The command and the result line. Run one file or one project, not the full suite. |
| Running app or service | The claim is about behaviour a user or a client sees | The start command, the steps, and the capture |
| End-to-end or browser test | The repository has these tests, or a browser skill can drive the app | The command, the steps, and screenshots or a trace |

You MAY start whatever the repository documents to capture evidence: a build, a dev server, containers, a test runner, or a browser driver. Follow these rules:

- Before you start a shared environment, check whether it already runs. Reuse a running one.
- Other research subagents run at the same time. If a start fails because a port or other resource is in use, wait one minute, then check for the other instance and reuse it.
- Use only setup steps the repository documents. Do not change machine-wide configuration.
- After you start an environment, append one line to the environment log named in your prompt: the ticket key, what you started, and the command that stops it. Leave it running; the parent stops it.
- Save each screenshot, log, trace, and test output in the evidence directory. Cite it in the report by its path relative to the run directory, for example `evidence/<KEY>/save-error.png`.
- Write throwaway scripts in the evidence directory, never in the repository. If a claim needs a new permanent test, say so under **Things to be aware of**.

## 5. Decide the verdict

| Verdict | Use when |
|---|---|
| `groomed` | Every claim is clear, the scope is known, and you can size it |
| `clarify` | One or more questions block sizing |
| `cancel` | The work is already done, the premise is false, or a duplicate exists. Cite the evidence. |
| `action` | Another step must come first: split, spike, merge, move, or reassign |

## 6. Size the work

Use story points from 1, 2, 3, 5, 8, 13. Base them on the files and components you found, the tests to change, and the unknowns. If the size is above 13, use the `action` verdict with `action: split`. Give the reason for the size in one to three sentences. Name the files, tests, and unknowns that set the size. The parent can post this reason as a proposal comment on the ticket, so write it for the team, not for the parent.

## 7. Propose ticket actions

List each change to the ticket that you recommend: a comment with the questions, an estimate, a label, a transition, a link, or a new ticket. The parent asks the user before it applies any of them.

## 8. Write the report

Read the [Report contract](../report-contract.md). Write the report file named in your prompt. Then run the report checker command from your prompt. It uses an absolute path, so run it as given.

Fix every error that names your ticket. Then stop.
