# Define a design system

Read this file for reusable tokens, component contracts, or a design-system specification.

## Define the contract

1. Establish whether the user wants a specification, implementation, or both. Deliver a specification without creating components when implementation is not requested.
2. Select a style and primary source. Separate confirmed source rules, explicit user overrides, and new proposals.
3. Define semantic tokens before components: surfaces, text, actions, state, focus, typography, spacing, and geometry. Map them to the target project's existing token names.
4. Define only the requested component families. For each, state purpose, anatomy, variants, supported states, keyboard behavior, responsive rules, and composition boundaries.
5. Reuse existing primitives. Keep domain calculations, fetching, and persistence out of a visual component contract.
6. Include one representative composition that demonstrates the rules together. Use real project content or clearly labelled fixtures.

For a written specification, identify which parts are implemented and which are proposed. Source application features are examples, not a required component inventory. Do not invent measurements or present a source's contrast claim as a result for a new palette.

## Check

Validate every specified state against the component contract. For an implementation, render the representative composition and complete references/verification.md. For a specification-only deliverable, check token consistency, unresolved decisions, and coverage of the requested components; label visual verification as not performed.
