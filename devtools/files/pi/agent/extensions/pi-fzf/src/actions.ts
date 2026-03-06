import type {
  ExtensionAPI,
  ExtensionCommandContext,
} from "@mariozechner/pi-coding-agent";
import type { ResolvedAction } from "./config.js";
import { renderTemplate } from "./config.js";

/**
 * Execute an action with the selected candidate value.
 */
export async function executeAction(
  action: ResolvedAction,
  selected: string,
  pi: ExtensionAPI,
  ctx: ExtensionCommandContext,
): Promise<void> {
  const rendered = renderTemplate(action.template, selected);

  switch (action.type) {
    case "editor":
      ctx.ui.setEditorText(rendered);
      break;

    case "send":
      pi.sendUserMessage(rendered);
      break;

    case "bash": {
      const result = await pi.exec("bash", ["-c", rendered]);
      if (result.code !== 0) {
        const error = (result.stderr || result.stdout).trim();
        ctx.ui.notify(`✗ Exit ${result.code}: ${error.slice(0, 100)}`, "error");
        break;
      }

      const output = result.stdout.trim();

      switch (action.output) {
        case "editor":
          ctx.ui.setEditorText(output);
          break;
        case "send":
          if (output) {
            pi.sendUserMessage(output);
          }
          break;
        default:
          ctx.ui.notify(
            output ? `✓ ${output.slice(0, 100)}` : "✓ Done",
            "info",
          );
          break;
      }
      break;
    }
  }
}
