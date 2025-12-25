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

Action: "$1"
Remaining: "${@:2}"

- The first argument `$1` indicates the action to perform (e.g., "transition", "summarise", "update", "create").
- The remaining arguments provide necessary details such as ticket ID, target status, or fields to update. What they are depends on the action. see ([Scenarios](#process)).

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

- Transition Jira ticket `$2` to status `$3`.
- To assign the ticket to the current user: use a follow-up update action to set the assignee field.
- To add to appropriate sprint (if not already in one):
  1. Get available sprints for the project using the skill
  2. Ask the user which sprint, or select the active/upcoming sprint
  3. Use a follow-up update action to set the sprint field.

#### Scenario: Summarize Jira Ticket Content

Action Verbs: Summarize, Summarize, Get, Fetch, Show, Display, Read

- Fetch and summarize the content of Jira ticket `$2`.
- Return key details including summary, description, status, assignee, and sprint.

#### Scenario: Update Jira Ticket Fields

Action Verbs: Update, Edit, Modify, Change

- Update Jira ticket `$2` with the following changes: `${@:3}`.
- The remaining arguments (`${@:3}`) are user-provided values describing which fields to update (e.g., "assignee to john", "sprint to Sprint 5", "add label critical").

#### Scenario: Create New Jira Ticket

Action Verbs: Create, New, Add, Bug, Task

- Determine project key: prioritize keys from recent git branches, fall back to listing available project keys.
- Determine issue type: use best guess based on action verb (e.g., "Bug" → bug, "Task" → task) or list available issue types and ask user.
- Use remaining arguments (`${@:2}`) as summary and description: parse as a title or body text provided by the user (e.g., "Fix login redirect" or "Add dark mode toggle to settings").
