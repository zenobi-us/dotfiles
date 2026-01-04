# @dotfiles/wiki-cli

To install dependencies:

```bash
mise setup
```

To run local dev build

```bash
bun run ./src/index.ts
```

To build binary for production

```bash
mise build
```

Then run production:

```bash
./dist/wiki
```

This project was created using `bun init` in bun v1.3.4. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
