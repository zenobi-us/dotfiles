# Notify on idle

The smallest possible visible confirmation that hooks are working: a notification each time PI finishes a turn with no pending messages.

## Hook snippet

```yaml
hooks:
  - id: idle-notify
    event: session.idle
    actions:
      - notify: "Agent is idle"
```

## Where to put it

Usually:

```text
~/.pi/agent/hook/hooks.yaml
```

## What it does

When PI finishes a turn and has no pending messages, it shows a notification.

## Quick test

1. Start PI
2. Do one normal agent turn
3. Wait for the turn to finish
4. Confirm the notification appears

## Notes

- In headless PI, `notify` is skipped.
- If you want richer details, use the long form with a level:

```yaml
actions:
  - notify:
      text: "Idle"
      level: success
```
