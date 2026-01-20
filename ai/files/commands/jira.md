---
description: |
  Perform various Jira ticket operations such as transitioning status, summarizing content, updating fields, and creating new tickets.
subtask: true
---

You perform Jira tasks using the jira skill `skill_use(jira)`.

> [!WARN]
> **CRITICAL**
> If the jira skill is not available, you cannot complete this task.

## User Request

<UserRequest>
$ARGUMENTS
</UserRequest>

## Argument Parsing

The command supports two invocation patterns:

### Pattern 1: Ticket ID Only (infers "summarize")
```
jira RWR-13629
```
- `$1` = Ticket ID (e.g., "RWR-13629")
- **Action**: Inferred as "summarize"

### Pattern 2: Explicit Action + Arguments
```
jira summarize RWR-13629
jira transition RWR-13629 "In Progress"
jira update RWR-13629 assignee me sprint "Sprint 5"
```
- `$1` = Action verb (e.g., "transition", "summarize", "update", "create")
- `$2` = Ticket ID (for existing ticket operations)
- `$3...` = Additional arguments (status, field updates, etc.)

### Detection Logic
1. If `$1` matches a Jira ticket pattern (e.g., `PROJ-123`):
   - Action = "summarize"
   - Ticket ID = `$1`
2. Otherwise:
   - Action = `$1`
   - Ticket ID = `$2`
   - Remaining args = `$3`, `$4`, etc. (or `${@:3}` for all remaining)

## Process

### Step 1: Determine Action Base on User Request

- Identify the action verb from the user request (e.g., "transition", "summarise", "update", "create").
- Match the action verb to one of the defined scenarios below.

### Step 2: Execute the Corresponding Scenario

- Based on the identified action, follow the steps outlined in the corresponding scenario to complete the task.
- If additional information is needed (e.g., sprint name), ask the user for clarification before proceeding.

### Step 3: Report Back to User

- Summarise the actions taken and the final state of the Jira ticket.

## Scenarios

#### Scenario: Transition Jira Ticket Status

Action Verbs: Transition

Arguments: `transition <TICKET-ID> <STATUS>`

- Transition Jira ticket (from `$2`) to status (from `$3`).
- To assign the ticket to the current user: use a follow-up update action to set the assignee field.
- To add to appropriate sprint (if not already in one):
  1. Get available sprints for the project using the skill
  2. Ask the user which sprint, or select the active/upcoming sprint
  3. Use a follow-up update action to set the sprint field.

#### Scenario: Summarize Jira Ticket Content

Action Verbs: Summarize, Get, Fetch, Show, Display, Read, or just a ticket ID

- Fetch and summarize the content of Jira ticket (ticket ID from `$1` if Pattern 1, or `$2` if Pattern 2).
- Return key details including summary, description, status, assignee, and sprint.
- Use the `get_ticket_summary.sh` script for efficient one-shot retrieval.

#### Scenario: Update Jira Ticket Fields

Action Verbs: Update, Edit, Modify, Change

Arguments: `update <TICKET-ID> <field> <value> [<field> <value> ...]`

- Update Jira ticket (from `$2`) with field changes from remaining arguments.
- Parse field-value pairs from `$3`, `$4`, `$5`, etc. (or use `${@:3}` to capture all remaining)
- Example field updates:
  - `update RWR-13629 assignee me` 
  - `update RWR-13629 sprint "Sprint 5" label critical`

#### Scenario: Create New Jira Ticket

Action Verbs: Create, New, Add, Bug, Task

Arguments: `create <SUMMARY> [description text...]` or `bug <SUMMARY>` or `task <SUMMARY>`

- Determine project key: prioritize keys from recent git branches, fall back to listing available project keys.
- Determine issue type: use best guess based on action verb (e.g., "bug" → Bug, "task" → Task) or list available issue types and ask user.
- Parse remaining arguments from `$2` onwards (use `${@:2}` to capture all) as:
  - First part = summary/title
  - Remaining parts = description body
- Examples:
  - `create Fix login redirect loop on logout`
  - `bug Unable to save employee on second attempt`
  - `task Add dark mode toggle to settings page`

#### Scnario: Store locally

Action Verbs: Store, Save

Arguments: `store <TICKET-ID> <format or storage skill>`

- Fetch Jira ticket (from `$2`) details.
- Load the specified storage skill (from `$3`), or default to local file storage if none specified.
- Save ticket details to a local file in markdown format according to the storage skill's conventions.
