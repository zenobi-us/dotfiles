## React

- Always use functional components.
- Define prop types as inline, like `function Foo(props: { title: string }){ return null }`.
  - Exception to this rule is when it makes sense to compose them or if an external file needs the types (like storybook).
- Prefer `function Foo() {}` over `const Foo = () => {}`.
- Component name should match the file name.
- Only one exported component per file.
- It's ok to have other components in the file as long as they are private and used.
- Never use `React.FC`
- Always use typescript. see `@~/.claude/docs/typescript.md`

