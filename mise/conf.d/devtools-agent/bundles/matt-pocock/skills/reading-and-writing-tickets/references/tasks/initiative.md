# Initiative publication

Read this for initiative/spec operations and child membership changes. An initiative is the specification, not an executable parent ticket. Use the configured backend's store procedure.

## Select and resolve

1. Retain the caller's initiative ID and canonical reference. For new work, choose a stable ID from the supplied title. Ask only when identity or intent is ambiguous.
2. Resolve the initiative through the store. For Local Markdown, invoke the installed shared-context CLI by absolute path from the target repository with `resolve initiative --id <id> --json`. Use its returned directory and store; `index.md` is the canonical specification inside that directory. Resolution creates nothing.
3. Read the existing record before writing. A proposed resolver path does not prove existence. An update requires an existing record. A create must not overwrite one; reconcile an existing identity as an update only when the user authorized that operation.
4. If the supplied specification is a legacy ticket or separate `spec.md`, follow [Check and migrate](migrate.md) to prepare a read-only plan. Preserve it and its children until the user explicitly approves that plan. Do not duplicate its specification into a new initiative or silently change its identity.

## Read and list

Read the full specification, recorded discussion, and canonical children through the backend. For Local Markdown, resolve the initiatives and tickets collections, read each initiative index, and compare its ticket links with child `parent` fields. Return canonical references and report inconsistent or incomplete membership. Do not infer membership from ID prefixes or sequence numbers.

## Create or update

1. Require a title and complete supplied specification intent. Preserve its problem, solution, user stories or success criteria, implementation/testing decisions, and scope limits. Do not invent missing product decisions.
2. For Local Markdown, use `schema: tracker-initiative/v1`, `id`, and `title` frontmatter in `index.md`. Follow [Tracker schemas](../schema.md) and validate before and after writes. Preserve existing metadata, specification sections, child links, and discussion except for explicitly requested changes. Keep `## Tickets` and `## Comments` separate from specification content. Use configured readiness metadata only. Do not add ticket `work_status`, `blocked_by`, claims, or synthetic execution receipts to initiatives.
3. An optional `plan.md` holds execution planning, not a second specification. Do not create a separate `spec.md` for new initiatives.
4. For GitHub or Jira, require the configured initiative/spec mapping, native parent relationship, and supported write operations before mutation. A normal issue is not a fallback for a missing mapping.
5. Apply the store's commit and publication rules. Read the record back through the normal tracker interface. Return the initiative in `initiatives`, with observed publication and validation results.

## Child membership

1. Resolve the initiative and every child ticket before writing. Verify unique IDs, existing parent records, and no hierarchy cycles. A child's direct `parent` must be the initiative ID, not a specification ticket. For existing hierarchical tickets, require explicit reparenting approval rather than flattening them.
2. For Local Markdown, child `parent` fields and ticket links under the initiative's `## Tickets` must agree. Read both before adding, removing, or reparenting a child. Reject unrelated pre-existing inconsistencies instead of guessing which side is authoritative.
3. Generate local Markdown links relative to the resolved initiative index and actual resolved ticket files, including when the collections use different local stores. Verify the resulting links through tracker discovery. Keep canonical shared-context references in operation results. Before publication, apply the shared-context access-boundary rules; do not expose private records through public URLs. If a cross-store link cannot remain valid at its publication destination, report that blocker rather than inventing a portable link or declaring success.
4. Update the affected indexes and parent fields together. Preserve all other children, specification text, and comments. On partial failure, report exact persisted changes and the inconsistent records; do not report success or dispatch implementation.
5. Read back every affected record. Verify membership through normal tracker discovery. Verify direct `blocked_by` edges separately; sequence numbers are display order, not execution prerequisites.

## Verification

Before reporting success, confirm the canonical identity and full saved specification, preserved discussion and children, correct membership, and observed publication. If normal tracker discovery cannot resolve a stored cross-store reference, report that coverage gap as a failed membership validation. Do not substitute file existence for successful discovery.

Existing legacy specification tickets remain readable. Publishing new work follows this contract; migrating existing records is a separate approved operation.
