import { Type } from "@mariozechner/pi-ai";
import type { ExtensionAPI, Theme } from "@mariozechner/pi-coding-agent";
import { Text, matchesKey, visibleWidth } from "@mariozechner/pi-tui";

type ActionItem = { label: string; value: string };

type AnswerToolParams = {
  actions: ActionItem[];
  title?: string;
};

const AnswerToolParamsSchema = Type.Object({
  actions: Type.Array(
    Type.Object({
      label: Type.String({ minLength: 1 }),
      value: Type.String({ minLength: 1 }),
    }),
    { minItems: 1 },
  ),
  title: Type.Optional(Type.String()),
});

const MOUSE_ON = "\x1b[?1000h\x1b[?1006h";
const MOUSE_OFF = "\x1b[?1000l\x1b[?1006l";
const ANSWER_TOOL_RULESET = `
When you need user input that is a selection, confirmation (including yes/no), prioritization, or next-step choice, you MUST call the tool "answer_actions" instead of asking a free-form question.

Rules:
- Prefer answer_actions whenever you can present discrete options, including yes/no prompts.
- Provide 2-7 options whenever possible.
- For yes/no questions, still use answer_actions with explicit options like {label:"Yes",value:"yes"} and {label:"No",value:"no"}.
- Each option must be JSON { label, value } with a short human-readable label and deterministic machine value.
- If no discrete options are possible, then ask a normal question.
`;

function padRight(s: string, len: number): string {
  const vis = visibleWidth(s);
  return s + " ".repeat(Math.max(0, len - vis));
}

function row(theme: Theme, content: string, innerW: number): string {
  return `${theme.fg("border", "│")}${padRight(content, innerW)}${theme.fg("border", "│")}`;
}

function parseMouseSgr(
  data: string,
): { button: number; x: number; y: number; released: boolean } | null {
  // SGR mouse: ESC [ < b ; x ; y M  (press)  or ... m (release)
  const m = data.match(/^\x1b\[<(\d+);(\d+);(\d+)([Mm])$/);
  if (!m) return null;
  return {
    button: Number(m[1]),
    x: Number(m[2]),
    y: Number(m[3]),
    released: m[4] === "m",
  };
}

export default function answerExtension(pi: ExtensionAPI) {
  pi.on("before_agent_start", async (event) => {
    if (
      event.systemPrompt.includes("answer_actions") &&
      event.systemPrompt.includes('MUST call the tool "answer_actions"')
    ) {
      return;
    }

    event.systemPrompt = `${event.systemPrompt}\n\n## Response Selection Tool Policy\n${ANSWER_TOOL_RULESET}`;
  });

  pi.registerTool({
    name: "answer_actions",
    label: "Answer Actions",
    description:
      "Present a list of response actions as JSON items { label, value }, then let user click or key-select one option.",
    promptSnippet:
      "Use answer_actions to present selectable response options ({label,value}) when user choice/confirmation is needed.",
    promptGuidelines: [
      "When requesting user selection, confirmation (including yes/no), or prioritization, call answer_actions instead of asking plain-text questions.",
      "Prefer 2-7 concise actions with deterministic values.",
      "Use short, readable labels and stable machine values.",
    ],
    parameters: AnswerToolParamsSchema,

    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      const p = params as AnswerToolParams;
      if (!ctx.hasUI) {
        return {
          content: [
            { type: "text", text: "answer_actions requires interactive UI." },
          ],
          isError: true,
          details: { selected: null },
        };
      }

      const actions = p.actions.slice(0, 9);
      const title = p.title?.trim() || "Choose a response action";

      if (actions.length === 0) {
        return {
          content: [{ type: "text", text: "No actions provided." }],
          isError: true,
          details: { selected: null },
        };
      }

      let mouseEnabled = false;

      try {
        const selected = await ctx.ui.custom<ActionItem | null>(
          (tui, theme, _kb, done) => {
            let cursor = 0;
            let lastWidth = 80;
            let lastHeight = 0;

            const enableMouse = () => {
              if (!mouseEnabled) {
                tui.terminal.write(MOUSE_ON);
                mouseEnabled = true;
              }
            };

            const disableMouse = () => {
              if (mouseEnabled) {
                tui.terminal.write(MOUSE_OFF);
                mouseEnabled = false;
              }
            };

            enableMouse();

            const component = {
              render(width: number): string[] {
                lastWidth = width;
                const outerW = Math.min(Math.max(40, width), width);
                const innerW = Math.max(10, outerW - 2);
                const lines: string[] = [];

                lines.push(theme.fg("border", `╭${"─".repeat(innerW)}╮`));
                lines.push(row(theme, ` ${theme.fg("accent", title)}`, innerW));
                lines.push(row(theme, "", innerW));

                for (let i = 0; i < actions.length; i++) {
                  const action = actions[i];
                  const selected = i === cursor;
                  const prefix = selected ? theme.fg("accent", "▸") : " ";
                  const label = selected
                    ? theme.fg("accent", action.label)
                    : action.label;
                  lines.push(
                    row(theme, ` ${prefix} ${i + 1}. ${label}`, innerW),
                  );
                }

                lines.push(row(theme, "", innerW));
                lines.push(
                  row(
                    theme,
                    ` ${theme.fg("dim", "Click an option • ↑↓ move • Enter choose • Esc cancel")}`,
                    innerW,
                  ),
                );
                lines.push(theme.fg("border", `╰${"─".repeat(innerW)}╯`));

                lastHeight = lines.length;
                return lines;
              },

              handleInput(data: string): void {
                if (matchesKey(data, "escape") || matchesKey(data, "ctrl+c")) {
                  disableMouse();
                  done(null);
                  return;
                }

                if (matchesKey(data, "up")) {
                  cursor = Math.max(0, cursor - 1);
                  tui.requestRender();
                  return;
                }

                if (matchesKey(data, "down")) {
                  cursor = Math.min(actions.length - 1, cursor + 1);
                  tui.requestRender();
                  return;
                }

                if (matchesKey(data, "return") || matchesKey(data, "enter")) {
                  disableMouse();
                  done(actions[cursor] ?? null);
                  return;
                }

                if (data.length === 1 && /[1-9]/.test(data)) {
                  const idx = Number(data) - 1;
                  if (idx >= 0 && idx < actions.length) {
                    disableMouse();
                    done(actions[idx]);
                    return;
                  }
                }

                const mouse = parseMouseSgr(data);
                if (!mouse || mouse.released) return;

                // Full-width, bottom-pinned assumption for this experiment.
                // Compute rendered top row in terminal coordinates (1-indexed).
                const termRows = tui.terminal.rows;
                const topRow = Math.max(1, termRows - lastHeight + 1);

                // Action lines start after: top border + title + blank => +3
                const actionStart = topRow + 3;
                const actionEnd = actionStart + actions.length - 1;

                if (mouse.y >= actionStart && mouse.y <= actionEnd) {
                  const idx = mouse.y - actionStart;
                  if (idx >= 0 && idx < actions.length) {
                    disableMouse();
                    done(actions[idx]);
                    return;
                  }
                }

                // Click inside box but not on action row: move cursor if possible
                const leftCol = 1;
                const rightCol = lastWidth;
                if (mouse.x >= leftCol && mouse.x <= rightCol) {
                  if (mouse.y >= actionStart && mouse.y <= actionEnd) {
                    cursor = Math.max(
                      0,
                      Math.min(actions.length - 1, mouse.y - actionStart),
                    );
                    tui.requestRender();
                  }
                }
              },

              invalidate(): void {},

              dispose(): void {
                disableMouse();
              },
            };

            return component;
          },
          {
            overlay: true,
            overlayOptions: {
              anchor: "bottom-center",
              width: "100%",
              maxHeight: "60%",
            },
          },
        );

        const payload = {
          selected,
        };

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(payload, null, 2),
            },
          ],
          details: payload,
        };
      } finally {
        // Hard safety: ensure mouse is disabled even on unexpected exits.
        if (mouseEnabled) {
          process.stdout.write(MOUSE_OFF);
          mouseEnabled = false;
        }
      }
    },

    renderCall(args, theme) {
      const p = args as AnswerToolParams;
      const count = Array.isArray(p.actions) ? p.actions.length : 0;
      return new Text(
        `${theme.fg("toolTitle", theme.bold("answer_actions "))}${theme.fg("muted", `${count} option(s)`)}`,
        0,
        0,
      );
    },

    renderResult(result, options, theme) {
      if (options.isPartial)
        return new Text(theme.fg("dim", "waiting for selection..."), 0, 0);
      const text =
        (result.content?.find((c: any) => c.type === "text") as any)?.text ??
        "{}";
      return new Text(theme.fg("toolOutput", text), 0, 0);
    },
  });
}
