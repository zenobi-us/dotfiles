---
description: |
  Perform various Jira ticket operations such as transitioning status, summarizing content, updating fields, and creating new tickets.
---

You perform Jira tasks using the jira skill `skill_use(jira)`.

> [!WARN]
> **CRITICAL**
> If the jira skill is not available, you cannot complete this task.

## UserRequest

```md
UserRequest: $ARGUMENTS
InputToken1: $1
InputToken2: $2
InputToken3Plus: ${@:3}
```

## Argument Parsing

The command supports two invocation patterns:

### Pattern 1: Ticket ID Only (infers "summarize")
```
jira RWR-13629
```
- InputToken1 = TicketId (e.g., `RWR-13629`)
- Action = `summarize`

### Pattern 2: Explicit Action + Arguments
```
jira summarize RWR-13629
jira transition RWR-13629 "In Progress"
jira update RWR-13629 assignee me sprint "Sprint 5"
```
- InputToken1 = Action
- InputToken2 = TicketId (for existing-ticket operations)
- InputToken3Plus = ActionArguments

### Detection Logic
1. If InputToken1 matches Jira ticket pattern `PROJ-123`:
   - Action = `summarize`
   - TicketId = InputToken1
2. Otherwise:
   - Action = InputToken1
   - TicketId = InputToken2
   - ActionArguments = InputToken3Plus

## Process

### Step 1: Determine Action Based on UserRequest

- Identify the action verb from UserRequest (e.g., transition, summarize, update, create).
- Match the action verb to one of the scenarios below.

### Step 2: Execute the Corresponding Scenario

- Follow the scenario instructions for the selected Action.
- If additional information is needed (e.g., sprint name), ask user for clarification before proceeding.

### Step 3: Report Back to User

- Summarize actions taken and final state of the Jira ticket.

## Scenarios

#### Scenario: Transition Jira Ticket Status

Action Verbs: Transition

Arguments: `transition <TICKET-ID> <STATUS>`

- Transition TicketId to target status from ActionArguments.
- To assign ticket to current user: perform follow-up update action for assignee field.
- To add ticket to sprint (if not already assigned):
  1. Get available sprints for the project using the skill.
  2. Ask user which sprint, or select active/upcoming sprint.
  3. Use follow-up update action to set sprint field.

#### Scenario: Summarize Jira Ticket Content

Action Verbs: Summarize, Get, Fetch, Show, Display, Read, or ticket-only input

- Fetch and summarize TicketId details.
- Return key details including summary, description, status, assignee, and sprint.
- Use `get_ticket_summary.sh` for efficient one-shot retrieval.

#### Scenario: Update Jira Ticket Fields

Action Verbs: Update, Edit, Modify, Change

Arguments: `update <TICKET-ID> <field> <value> [<field> <value> ...]`

- Update TicketId with field changes from ActionArguments.
- Parse ActionArguments as field-value pairs.
- Example updates:
  - `update RWR-13629 assignee me`
  - `update RWR-13629 sprint "Sprint 5" label critical`

#### Scenario: Create New Jira Ticket

Action Verbs: Create, New, Add, Bug, Task

Arguments: `create <SUMMARY> [description text...]` or `bug <SUMMARY>` or `task <SUMMARY>`

- Determine project key: prioritize keys from recent git branches, then fall back to listing available project keys.
- Determine issue type: infer from Action (e.g., bug → Bug, task → Task) or list available issue types and ask user.
- Parse creation details from InputToken2 onward:
  - First part = summary/title
  - Remaining parts = description body
- Examples:
  - `create Fix login redirect loop on logout`
  - `bug Unable to save employee on second attempt`
  - `task Add dark mode toggle to settings page`

#### Scenario: Store Locally

Action Verbs: Store, Save

Arguments: `store <TICKET-ID> <format or storage skill>`

- Fetch TicketId details.
- Load requested storage skill from ActionArguments, or default to local file storage if none provided.
- Save ticket details to local markdown according to storage skill conventions.
