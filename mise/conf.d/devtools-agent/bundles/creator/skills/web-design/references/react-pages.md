# Create a React page

Read this file for a React page or component composition.

## Build

1. Inspect the router, component library, styles, and data ownership. Use existing application conventions; a design source does not justify a new framework or a second UI library.
2. Apply the selected style through existing semantic tokens and reusable components. Add a component only when it represents a useful interface or repeated behavior.
3. Name each component's props parameter props. Read values through their full property paths. Keep defaults at the point of use. Use PropsWithChildren only when children are accepted. Hook tuples and derived calculations remain valid.
4. Preserve consumed-prop filtering when forwarding native props. Keep custom styling props off DOM elements. Use the project's existing omission utility when one exists.
5. Keep domain data, grouping, persistence, and mutation ownership outside presentation components unless the requested change concerns that behavior.
6. Implement the requested loading, empty, error, selected, and disabled states with the current data layer. Use fixture data only in a clearly labelled preview, not as a production fallback.

Load react-patterns for React details, tailwind for an existing Tailwind stack, and shadcn when that library is in use. The widget foundation's Radix, Tailwind, and editor references are not an instruction to install them into another project.

## Check

Exercise the changed route and its relevant transitions. Use existing contract tests when the component API changes. Complete references/verification.md; a successful build alone does not prove the rendered page.
