import type {
  ExtensionAPI,
  ExtensionCommandContext,
} from "@mariozechner/pi-coding-agent";
import type { TUI } from "@mariozechner/pi-tui";
import { executeAction } from "./actions.js";
import { loadFzfConfig, type ResolvedCommand } from "./config.js";
import { FuzzySelector, type SelectorTheme } from "./selector.js";

export default function (pi: ExtensionAPI) {
  let commands: ResolvedCommand[] = [];

  pi.on("session_start", async (_event, ctx) => {
    // Load config from global + project locations
    commands = loadFzfConfig(ctx.cwd);

    if (commands.length === 0) return;

    // Register a /fzf:<name> command and optional shortcut for each entry
    for (const cmd of commands) {
      registerFzfCommand(pi, cmd);

      if (cmd.shortcut) {
        registerFzfShortcut(pi, cmd);
      }
    }

    ctx.ui.notify(`fzf: ${commands.length} command(s) loaded`, "info");
  });
}

/**
 * Run the fzf flow: list candidates, open fuzzy selector, execute action.
 */
async function runFzfSelector(
  pi: ExtensionAPI,
  cmd: ResolvedCommand,
  ctx: ExtensionCommandContext,
): Promise<void> {
  if (!ctx.hasUI) {
    ctx.ui.notify("fzf commands require interactive mode", "error");
    return;
  }

  // 1. Run the list command to get candidates
  const result = await pi.exec("bash", ["-c", cmd.list], {
    timeout: 10000,
  });

  if (result.code !== 0) {
    ctx.ui.notify(
      `fzf:${cmd.name}: list command failed (exit ${result.code})`,
      "error",
    );
    return;
  }

  const candidates = result.stdout
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  if (candidates.length === 0) {
    ctx.ui.notify(`fzf:${cmd.name}: no candidates`, "warning");
    return;
  }

  // 2. Open the fuzzy selector overlay
  // Capture tui reference so we can request a render after the overlay closes
  let tuiRef: TUI | undefined;

  const selected = await ctx.ui.custom<string | null>(
    (tui, theme, _kb, done) => {
      tuiRef = tui;

      const selectorTheme: SelectorTheme = {
        accent: (t) => theme.fg("accent", t),
        muted: (t) => theme.fg("muted", t),
        dim: (t) => theme.fg("dim", t),
        match: (t) => theme.fg("warning", theme.bold(t)),
        border: (t) => theme.fg("border", t),
        bold: (t) => theme.bold(t),
      };

      const maxVisible = Math.min(candidates.length, 15);
      const selector = new FuzzySelector(
        candidates,
        `fzf:${cmd.name}`,
        maxVisible,
        selectorTheme,
      );

      selector.onSelect = (item) => done(item);
      selector.onCancel = () => done(null);

      return {
        render(width: number) {
          return selector.render(width);
        },
        invalidate() {
          selector.invalidate();
        },
        handleInput(data: string) {
          selector.handleInput(data);
          tui.requestRender();
        },
        // Focusable — propagate to selector for IME cursor support
        get focused() {
          return selector.focused;
        },
        set focused(value: boolean) {
          selector.focused = value;
        },
      };
    },
    { overlay: true },
  );

  // 3. If user selected something, execute the action
  if (selected !== null) {
    await executeAction(cmd.action, selected, pi, ctx);
    // Explicitly request render to ensure the editor shows
    // the new text after the overlay closed
    tuiRef?.requestRender();
  }
}

function registerFzfCommand(pi: ExtensionAPI, cmd: ResolvedCommand): void {
  pi.registerCommand(`fzf:${cmd.name}`, {
    description: `Fuzzy find: ${cmd.list}`,
    handler: async (_args, ctx) => {
      await runFzfSelector(pi, cmd, ctx);
    },
  });
}

function registerFzfShortcut(pi: ExtensionAPI, cmd: ResolvedCommand): void {
  if (!cmd.shortcut) return;

  pi.registerShortcut(cmd.shortcut, {
    description: `fzf:${cmd.name}`,
    handler: async (ctx) => {
      await runFzfSelector(pi, cmd, ctx);
    },
  });
}
