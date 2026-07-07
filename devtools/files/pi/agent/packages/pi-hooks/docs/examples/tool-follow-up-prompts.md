# Tool follow-up prompts

Use `tool:` when you want the current PI session to receive a follow-up instruction.

## Hook snippet

```yaml
hooks:
  - id: read-readme-after-write
    event: tool.after.write
    actions:
      - tool:
          name: read
          args:
            path: README.md
```

## What it does on PI

PI sends a follow-up message to the current session that says, in effect:

- use the `read` tool
- with the provided arguments

It does not directly execute the tool.

## Good use cases

- nudging the agent toward a next step
- asking for a follow-up read after a mutation
- attaching lightweight workflow guidance to an event

## Caveat

Do not treat `tool:` as a guaranteed imperative tool call. On PI it is prompt injection into the current session.
