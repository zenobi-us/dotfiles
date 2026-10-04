# Create a ticket

1. Check that the required title, intent, and acceptance criteria are present. Ask only for missing information that blocks creation.
2. Create the ticket through the selected store.
3. Resolve every requested blocker after the new ticket has an identifier.
4. Before adding dependency edges, verify that each blocker resolves uniquely, is not the ticket itself, creates no cycle, represents a real start-time dependency, and does not need to remain open after completion.
5. Read the created ticket back. Return its identifier and canonical `ref`.