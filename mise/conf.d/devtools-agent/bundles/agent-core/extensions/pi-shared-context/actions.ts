// Pi/OMP session delivery stays separate from shared action policy.
import type { ExtensionAPI, ExtensionCommandContext } from "@earendil-works/pi-coding-agent";
import { actionChoices, buildSessionPrompt, type SessionRequest } from "../../../developer/skills/git/worktree/scripts/session-actions";

/** The caller waits for idle, then revalidates the confirmed inputs before opening the session. */
export async function launchExplorerSession(pi: ExtensionAPI, ctx: ExtensionCommandContext, request: SessionRequest): Promise<boolean> {
  const choice = actionChoices(request.target, request.snapshot, request.workflow, pi.getCommands()).find(item => item.action === request.action);
  if (!choice) throw new Error("This action is not available for the selected target.");
  if (choice.disabledReason) throw new Error(choice.disabledReason);
  const message = buildSessionPrompt(request);
  const parentSession = ctx.sessionManager.getSessionFile();
  let opened = false;
  try {
    const result = await ctx.newSession({
      parentSession,
      withSession: async next => {
        opened = true;
        await next.sendUserMessage(message);
      },
    });
    if (result.cancelled) return false;
    // Pi replaces the API through withSession; OMP keeps it live and ignores that callback.
    if (!opened) {
      opened = true;
      pi.sendUserMessage(message);
    }
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${opened ? "New session opened, but prompt delivery failed" : "Could not open a new session"}: ${message}`, { cause: error });
  }
}
