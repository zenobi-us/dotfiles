---
description: Manage Confluence pages, create documentation, and add comments
agent: confluence
subtask: true
---

## UserRequest

Perform Confluence operations: create/update pages, manage page hierarchy, add comments, or search documentation.

## Parameters

- **Operation**: create, update, search, comment, or list
- **Space**: Confluence space key or name
- **Title**: Page title (for create/update operations)
- **Content**: Page body content in markdown (for create/update operations)
- **PageId**: Existing page ID (for update/comment operations)
- **Query**: Search terms or CQL expression (for search operations)

## Operating Steps

Follow the protocol defined in `agent/confluence.md`:

### Creating Pages

1. Identify the target space using `atlassian_getConfluenceSpaces`
2. Determine if this is a child page by getting potential parents
3. Create the page using `atlassian_createConfluencePage` with space ID, title, and body
4. Confirm the page was created with the correct hierarchy

### Updating Pages

1. Fetch the current page using `atlassian_getConfluencePage`
2. Prepare updated content
3. Update the page using `atlassian_updateConfluencePage` with a version message
4. Confirm the page was updated successfully

### Adding Comments

1. **Footer comments**: Use `atlassian_createConfluenceFooterComment` for general page feedback
2. **Inline comments**: Use `atlassian_createConfluenceInlineComment` for text-specific feedback
   - Specify exact text to highlight
   - Provide occurrence index and count for accurate targeting
3. Include context in comments (e.g., "This section needs clarification because...")

### Searching Pages

1. Use `atlassian_searchConfluenceUsingCql` for advanced queries with filters
2. Use `atlassian_search` for natural language searches
3. Use `atlassian_getPagesInConfluenceSpace` to browse a specific space
4. Report matching pages with relevant context

### Managing Spaces

1. List available spaces with `atlassian_getConfluenceSpaces`
2. Filter by type, status, or labels as needed
3. Discover space structure before creating/updating content

## Best Practices

- Always confirm the target space and page hierarchy before creating content
- Provide descriptive version messages when updating pages
- For inline comments, verify exact text matching to avoid ambiguity
- Use CQL for precise queries when searching by metadata
- Create child pages under logical parent pages to maintain hierarchy

Report the operation result, new/updated page location, and any relevant details.
