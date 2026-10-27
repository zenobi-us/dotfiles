# Create a record

Select the record kind first. To publish a spec or create an initiative, follow [Initiative publication](initiative.md) instead of creating a ticket. For a child ticket, follow that procedure's membership contract as well as the ticket steps below.

1. Check that the required title, intent, and acceptance criteria are present. Ask only for missing information that blocks creation.
2. Create the ticket through the selected store.
3. Resolve every requested blocker after the new ticket has an identifier.
4. Before adding dependency edges, verify that each blocker resolves uniquely, is not the ticket itself, creates no cycle, represents a real start-time dependency, and does not need to remain open after completion.
5. Read the created ticket back. Return its identifier and canonical `ref`.