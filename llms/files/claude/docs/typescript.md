## Typescript

- always strict mode.
- only use `any` within a private context and only when we're doing appropriate type narrowing.
- avoid classes unless it super super super makes sense. hint: it almost never makes sense.
- never ever solve a type error with `// @ts-ignore `
- Prefer to create a zod schema so that we can validate shapes at runtime and provide inferred types from the schema.
