# Ask tool contract

`ask_user` is a pi-native clarification tool for cases where implementation depends on user preference or missing requirements.

This document defines the stable external behavior. It does not explain internal helper-by-helper implementation.

## Input

```ts
{
  title?: string;
  questions: Array<{
    id: string;
    label?: string;
    prompt: string;
    type?: "single" | "multi" | "preview";
    required?: boolean;
    options: Array<{
      value: string;
      label: string;
      description?: string;
      preview?: string;
    }>;
  }>;
}
```

## Input rules

- at least one question is required
- every question must have non-empty trimmed `id` and `prompt`
- every question must have at least one option
- question ids must be unique within one tool call
- option `value`s must be unique within a question
- optional `label`, `description`, and `preview` fields must not be blank when provided
- `label` falls back to `Q1`, `Q2`, ...
- `type` defaults to `single`
- `required` defaults to `false`
- `required` is metadata only; it never blocks submission
- preview questions require preview text for every declared option; option descriptions do not satisfy this requirement, and invalid preview payloads report a fix hint to add preview text or switch to `type: "single"`
- all questions get an internal `Type your own` option

## Output

```ts
{
  content: [{ type: "text"; text: string }];
  details: {
    title?: string;
    cancelled: boolean;
    error?: {
      kind: "invalid_input";
      issues: Array<{
        path: string;
        message: string;
      }>;
    };
    mode: "submit" | "elaborate";
    questions: Array<{
      id: string;
      label: string;
      prompt: string;
      type: "single" | "multi" | "preview";
      presentedType?: "single" | "multi" | "preview";
    }>;
    answers: Record<
      string,
      {
        values: string[];
        labels: string[];
        indices: number[];
        customText?: string;
        note?: string;
        optionNotes?: Record<string, string>;
      }
    >;
    continuation?: {
      strategy: "refine_only" | "resume";
      affectedQuestionIds: string[];
      preservedAnswers: Record<string, {
        values: string[];
        labels: string[];
        indices: number[];
        customText?: string;
        note?: string;
        optionNotes?: Record<string, string>;
      }>;
      questionStates: Record<string, {
        status: "answered" | "needs_clarification" | "unanswered";
      }>;
    };
    elaboration?: {
      instruction: string;
      nextAction: "clarify" | "clarify_then_reask";
      items: Array<
        | {
            target: { kind: "question" };
            question: {
              id: string;
              label: string;
              prompt: string;
              type: "single" | "multi" | "preview";
              presentedType?: "single" | "multi" | "preview";
              options: Array<{
                value: string;
                label: string;
                description?: string;
                preview?: string;
              }>;
            };
            answered: boolean;
            answer?: {
              values: string[];
              labels: string[];
              indices: number[];
              customText?: string;
              note?: string;
              optionNotes?: Record<string, string>;
            };
            note: string;
          }
        | {
            target: { kind: "option"; optionValue: string };
            question: {
              id: string;
              label: string;
              prompt: string;
              type: "single" | "multi" | "preview";
              presentedType?: "single" | "multi" | "preview";
              options: Array<{
                value: string;
                label: string;
                description?: string;
                preview?: string;
              }>;
            };
            option: {
              value: string;
              label: string;
              description?: string;
              preview?: string;
            };
            selected: boolean;
            answered: boolean;
            answer?: {
              values: string[];
              labels: string[];
              indices: number[];
              customText?: string;
              note?: string;
              optionNotes?: Record<string, string>;
            };
            note: string;
          }
      >;
    };
  };
}
```

## Output rules

- `cancelled: true` means the user dismissed the flow, UI was unavailable, or the payload was invalid before UI opened
- invalid payloads return `error.kind === "invalid_input"` with structured `issues` and a transcript-friendly `Invalid ask_user payload:` message
- `mode: "submit"` is normal completion; `mode: "elaborate"` means the user asked the agent to continue with follow-up clarification based on notes
- unanswered questions are omitted from `answers`
- in `mode: "elaborate"`, `answers` contains only committed answers; note-only entries move to `elaboration.items`
- `continuation.strategy === "refine_only"` means the next ask should refine the current flow rather than restart it
- `continuation.preservedAnswers` contains previously committed answers that should be kept as context and not re-asked
- `continuation.affectedQuestionIds` lists the only questions that should be revisited
- `continuation.questionStates` marks each question as `answered`, `needs_clarification`, or `unanswered`
- single-select answers still use arrays
- when `behaviour.presentSingleAsMulti` is enabled, requested single-select questions are presented and handled as multi-select in future/replayed ask flows; result question metadata keeps the requested `type`, adds `presentedType` when final presentation differs, and result text uses one compact note when any answered questions were presented differently
- `indices` are 1-based rendered option positions
- `customText` stores the free-form answer
- on single-select questions, saving free-form text clears selected options for that question
- on multi-select questions, `values` and `labels` include both selected options and `customText` when both are present
- on multi-select questions, selected options keep their original order and `customText` is appended last
- submitting free-form text on a multi-select question stays on the same question tab and marks the custom row selected
- on multi-select questions, toggling an empty custom row opens the free-form editor, while toggling a custom row with saved free-form text selects or deselects it without opening the editor or clearing the text
- saving or clearing free-form text on a multi-select question does not clear other selected options
- `note` stores a question-level note
- `optionNotes` includes only notes for selected options
- question notes may exist without a selected answer
- `elaboration.items` includes all question notes and all option notes, even for unselected options
- every elaboration item includes the full normalized question and option list for that question so referential notes like `above` remain understandable to the agent
- option-targeted elaboration items include the specific noted option plus whether it is currently selected
- question-targeted elaboration items include whether the question already has a committed answer
- `elaboration.instruction` tells the agent to answer the clarification directly first, then re-ask only the affected questions if a choice is still needed
- after clarification, agents should prefer another structured follow-up over plain-text multiple choice when a decision is still unresolved
- once prior answers narrow the branch, agents should bundle the next 2-3 related unresolved questions into one follow-up ask when possible, instead of using a long sequence of single-question asks
- `elaboration` is only present when `mode === "elaborate"`
- elaborate `content` text and transcript rendering describe each note directly using the full question prompt and option label, and include the current committed answer text when available, instead of a generic elaboration banner
- when the user selects `Elaborate` without adding notes, elaborate `content` text and transcript rendering still include the committed answer text so the agent can elaborate on that answer directly

## Supported UX

- tabbed multi-question flow
- single-select, multi-select, and preview questions
- active question type changes via configurable `main.changeQuestionType` hotkey, default `t`; non-preview questions toggle `single <-> multi`; preview questions toggle `preview <-> multi`
- inline free-form answers for all question types
- native pi-style `@` file path autocomplete inside free-form answer and note editors
- question notes via `Shift+N`
- option notes via `n`
- number-key quick selection
- submit/elaborate/cancel review tab
- on the review tab, `Submit` and `Cancel` preview notes only for answered questions
- on the review tab, `Elaborate` preview expands to all question notes and all option notes, including notes on unselected options
- transcript-friendly call and result rendering
- `/answer` command to extract a raw-JSON `AskParams` form from the latest completed assistant message and open the ask UI
- `/answer` extraction may use an internal `freeform: true` option for open-ended questions with no explicit choices; these render as user-input-only questions with the label `Type your answer:`, no numbered option row, and no selection caret; this marker is not part of the public `ask_user` tool contract
- `/answer:again` command to replay the latest `/answer`-extracted form on the current branch
- `/ask:replay` command to replay the latest real `ask_user` form on the current branch
- ask settings list with binary behaviour/notification toggles and a guarded reset-to-defaults action
- `?` in the ask flow and `/ask-settings` in pi open the same lightweight ask settings overlay
- settings attempt to persist immediately when changed: `Auto-submit when answered without notes`, `Confirm dismiss when dirty`, `Double-press review shortcuts`, `Notifications`, and `Show footer hints`; `Present single-select as multi-select` persists immediately when saving succeeds but applies only to new/replayed ask flows; save failures revert the setting and show a manual-edit message; resetting config to defaults requires pressing the reset action twice within a short confirmation window
- `Keymaps` is a persisted, context-aware config section for global, main-flow, editor, note-editor, and settings-modal actions
- the settings list shows the absolute config file path for customizing keymaps, notifications, and extraction settings
- if the flow is already on the review tab, all questions are answered, and no notes exist, enabling auto-submit can complete the current ask flow immediately
- elaborate results are phrased as direct follow-up instructions, for example: `User asked to elaborate on question "Which option would you like to select?" option "Option A" with note "why this one?"`

## Keyboard behavior

Main flow:

- `global.settings` opens ask settings; default: `?`
- `global.dismiss` dismisses the active ask surface; default: `Ctrl+C`
- `main.nextTab` / `main.previousTab` move between tabs; defaults: `Tab`/`Right`, `Shift+Tab`/`Left`
- `main.nextOption` / `main.previousOption` move between options or review actions; defaults: `Down`, `Up`
- `main.confirm`, `main.cancel`, and `main.toggle` confirm, cancel, or toggle; defaults: `Enter`, `Esc`, `Space`
- `main.changeQuestionType` changes the active question type (non-preview: `single <-> multi`; preview: `preview <-> multi`); default: `t`; destructive `multi -> single` changes require pressing the type hotkey again, with no timeout, and the pending confirmation clears on other navigation/actions
- `main.optionNote` and `main.questionNote` open option/question notes; defaults: `n`, `Shift+N`
- `1..9` is fixed and selects or toggles the matching option; on the review tab, `1`, `2`, and `3` trigger `Submit`, `Elaborate`, and `Cancel`
- when `Double-press review shortcuts` is enabled, review-tab `1`, `2`, and `3` require the same key twice without a timeout, and the review screen shows an inline hint for the pending action

Editing flow:

- `editor.submit` submits the current custom-answer editor input and closes the editor; default: `Enter`
- `noteEditor.save` saves the current note editor and keeps the ask flow open; default: `Enter`
- `editor.close` / `noteEditor.close` save draft and close the editor; default: `Esc`
- `global.dismiss` dismisses the entire flow immediately without saving the current editor draft when no dirty-dismiss confirmation is pending
- `global.settings` opens ask settings when the editor is empty; otherwise the key is delegated to the editor as text/input
- when editor has text, arrow keys and `Tab` stay in the editor so the cursor can move while typing
- when editor is empty, editor-context `*WhenEmpty` navigation actions move options or tabs without requiring the editor close binding first
- `@` remains a fixed file-reference affordance in editors

Settings modal:

- `settingsModal.close` closes settings; defaults: `Esc`, `Ctrl+C`, `?`
- `settingsModal.nextOption` / `settingsModal.previousOption` move between settings; defaults: `Down`, `Up`
- `settingsModal.toggle` toggles the highlighted setting and attempts to save immediately; if saving fails, the setting reverts and an error is shown; on the reset action, the same binding must be pressed twice within a short confirmation window; defaults: `Enter`, `Space`

Dirty dismiss:

- when `Confirm dismiss when dirty` is enabled, cancelling or dismissing a dirty ask flow requires the same action a second time
- the dirty-dismiss warning stays visible until the user changes tabs in the ask flow

## Non-TUI and non-interactive modes

The rich ask flow uses `ctx.ui.custom()` and opens only in TUI mode. In print, JSON, RPC, or any other non-TUI mode, the tool returns a `Needs user input: ask_user requires interactive TUI mode.` message in `content` and a cancelled result in `details` instead of opening custom UI.

Validation is handled inside the tool so malformed calls produce the same structured error shape as other invalid payloads instead of relying on pre-execution schema failures.

The ask flow subscribes to runtime settings updates while open. In practice, this means changing `Auto-submit when answered without notes`, `Confirm dismiss when dirty`, `Double-press review shortcuts`, `Notifications`, `Show footer hints`, resetting config to defaults, or reloading config-backed keymaps can affect the in-progress ask flow immediately instead of only future asks when the change is saved or otherwise applied in memory. Load-time migrations and invalid config handling do not rewrite, rename, or back up the config file; invalid files load defaults for the session and show a notice. `Present single-select as multi-select` is applied when an ask flow is created and does not rewrite question semantics for an already-open flow; use `main.changeQuestionType` for live per-question changes.

## Notifications

When enabled, pi-ask emits one best-effort external notification per ask session after the ask UI opens and waits for input. The default title is `pi ask`; the message is `Question waiting: <label or prompt>`. Channels run in configured order and failures never fail or cancel the ask flow.

## Remote inter-extension events

pi-ask exposes a local `pi.events` contract for trusted Pi extensions. It does not expose a network API and does not automate terminal keystrokes. RPC or headless integrations should use a trusted in-process bridge extension that consumes these events rather than expecting the TUI-only custom surface to open.

Channels:

- `@eko24ive/pi-ask:started`
- `@eko24ive/pi-ask:completed`
- `@eko24ive/pi-ask:submit`
- `@eko24ive/pi-ask:submit-result`

Remote submissions must be explicit `{ kind: "answer" }` or `{ kind: "cancel" }` responses. Remote answers use question ids and normalized option values from the started event. pi-ask validates ids and values, recomputes labels/indices, and does not infer approval semantics from labels.

See [`remote-events.md`](remote-events.md) for payload shapes, examples, and a local smoke test.

## Slash command replay/extraction

- valid `ask_user` payloads are persisted as branch custom entries before the UI opens, so `/ask:replay` can reopen them after cancel, `/resume`, or `/tree`
- `/answer` scans the current branch for the latest assistant message; if that message did not finish with `stop`, extraction is refused
- `/answer` expects the extractor to return raw JSON only; JSON parse failures are retried according to `answer.extractionRetries`, then reported to the user without opening the ask UI
- `{ "questions": [] }` from extraction means no questions were found and is not treated as an invalid ask payload
- command-flow cancellation closes with a notification and does not send a message to the agent
- submitted or elaborated command-flow results are sent back with user-message semantics
- replay commands scan only `ctx.sessionManager.getBranch()`, ignore sibling/future branch payloads, and revalidate stored payloads before opening the UI

The fallback message includes normalized pending questions and options so the caller can re-ask them manually. `details.questions` still contains normalized question metadata, while `details.answers` stays empty until a user responds.

## Skill alignment (advisory)

The auto-bundled skill profile at `skills/ask-user/SKILL.md` defines agent-side decision-gate guidance for when to call `ask_user`. It is enabled by default when the package is installed, but can be disabled via `pi config`.

It is advisory only. If there is any conflict, contract + tests win.

## Source of truth

Behavior should be verified against:

1. `src/types.ts` and exported state/result helpers
2. `tests/*.test.ts`
3. this contract
