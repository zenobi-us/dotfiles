# Remote ask events

pi-ask exposes a local `pi.events` contract for trusted Pi extensions that run in the same Pi process.

Use this for local bridges: status cards, desktop helpers, or approval UIs. Do not use terminal keystroke automation. pi-ask does not expose a network API.

## Channels

Lifecycle:

- `@eko24ive/pi-ask:started`
- `@eko24ive/pi-ask:completed`

Remote submit:

- `@eko24ive/pi-ask:submit`
- `@eko24ive/pi-ask:submit-result`

## Started

Emitted after a validated ask UI flow opens.

```ts
type PiAskStartedEvent = {
  version: 1;
  flowId: string;
  toolCallId?: string;
  source: "tool" | "answer" | "answer:again" | "ask:replay";
  title?: string;
  questions: AskQuestion[];
  createdAt: number;
};
```

Use `flowId` for submit/correlation. Use `questions[].id` and `questions[].options[].value` for answers.

## Submit an answer

```ts
pi.events.emit("@eko24ive/pi-ask:submit", {
  version: 1,
  requestId: `bridge-${Date.now()}`,
  flowId,
  response: {
    kind: "answer",
    mode: "submit",
    answers: {
      questionId: { values: ["option-value"] },
    },
  },
});
```

Answer shape:

```ts
type PiAskRemoteAnswer = {
  values?: string[];
  customText?: string;
  note?: string;
  optionNotes?: Record<string, string>;
};
```

Rules:

- `values` must match option `value`s from the started event
- keys in `answers` must match question ids
- labels and indices are recomputed by pi-ask
- a remote `answer` replaces the current answer set; stale UI answers are not merged
- `mode` defaults to `"submit"`; use `"elaborate"` to complete as an elaboration request

## Cancel

```ts
pi.events.emit("@eko24ive/pi-ask:submit", {
  version: 1,
  requestId: `bridge-${Date.now()}`,
  flowId,
  response: { kind: "cancel" },
});
```

Cancel must be explicit. pi-ask does not infer cancel/approve/deny from labels or button names.

## Submit result

After a submit request, pi-ask emits:

```ts
type PiAskSubmitResultEvent =
  | { version: 1; requestId: string; flowId: string; ok: true }
  | {
      version: 1;
      requestId: string;
      flowId: string;
      ok: false;
      error: "flow_not_found" | "invalid_request" | "invalid_answer";
      message: string;
    };
```

Correlate by `requestId` and `flowId`. Do not depend on strict ordering between `submit-result` and `completed`.

## Completed

Emitted when the flow resolves.

```ts
type PiAskCompletedEvent = {
  version: 1;
  flowId: string;
  toolCallId?: string;
  source: "tool" | "answer" | "answer:again" | "ask:replay";
  result: AskResult;
  completedAt: number;
};
```

## Minimal bridge

```ts
export default function piAskBridge(pi: any) {
  pi.events.on("@eko24ive/pi-ask:started", (event: any) => {
    const question = event.questions[0];
    const option = question.options[0];

    pi.events.emit("@eko24ive/pi-ask:submit", {
      version: 1,
      requestId: `bridge-${Date.now()}`,
      flowId: event.flowId,
      response: {
        kind: "answer",
        answers: {
          [question.id]: { values: [option.value] },
        },
      },
    });
  });

  pi.events.on("@eko24ive/pi-ask:submit-result", (event: any) => {
    if (!event.ok) console.error(event.error, event.message);
  });
}
```

Third-party integrations own their own UI policy and mappings. For example, a bridge may map a button to `{ values: ["yes"] }`, but pi-ask will never guess that mapping from the label.

## Local smoke test

Create a temporary bridge and run pi with only this repo extension plus the bridge:

```bash
cat > /tmp/pi-ask-smoke.ts <<'EOF'
export default function smoke(pi: any) {
  pi.events.on("@eko24ive/pi-ask:started", (event: any) => {
    const q = event.questions[0];
    setTimeout(() => {
      pi.events.emit("@eko24ive/pi-ask:submit", {
        version: 1,
        requestId: `smoke-${Date.now()}`,
        flowId: event.flowId,
        response: { kind: "answer", answers: { [q.id]: { values: ["tool"] } } },
      });
    }, 2500);
  });
}
EOF

pi \
  --no-extensions \
  --no-skills \
  --no-prompt-templates \
  --no-themes \
  --no-context-files \
  -e "$PWD/src/index.ts" \
  -e /tmp/pi-ask-smoke.ts \
  --skill "$PWD/skills/ask-user"
```

Then ask Pi:

```txt
Use ask_user. Title: pi-ask smoke. Ask one single-select question id tool with options tool and nope.
```

The ask UI should open and auto-submit `tool` after about 2.5 seconds.
