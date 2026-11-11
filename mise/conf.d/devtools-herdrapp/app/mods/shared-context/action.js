// Tracker and graph actions start isolated OMP sessions beside the selected pane.
import { run, focused, panes, appHome, closeOverlay } from "herdr";
import { request } from "./client.js";

/**
 * @param {{ actionBusy: boolean, actionError: string }} view
 * @param {{ cwd: string, space: string, id: string, kind: "ticket" | "initiative", action: string, prompt: string, overlay?: string }} given
 * @param {import("gpui-kit").Context} cx
 * @param {() => void} opened
 */
export function launchAction(view, given, cx, opened) {
  if (view.actionBusy) return;
  const target = focused();
  view.actionBusy = true; view.actionError = ""; cx.notify();
  cx.spawn(async cx => {
    try {
      if (!target?.pane || target.space !== given.space) throw new Error("Select a pane in this repository's workspace before starting an action.");
      const prepared = await request("prepare", given.cwd, { id: given.id, kind: given.kind, action: given.action, prompt: given.prompt });
      if (!panes().some(item => item.pane === target.pane)) throw new Error("The selected pane was closed. Select another pane and try again.");
      // A separate session directory prevents auto-resume into an earlier chat.
      const session = `${appHome()}/data/shared-context-sessions/${Date.now()}-${Math.random().toString(16).slice(2)}`;
      run("pane.split", { pane: target.pane, direction: "right", argv: [prepared.binary, "--cwd", prepared.repository, "--session-dir", session, prepared.prompt] });
      opened();
      if (given.overlay) closeOverlay(given.overlay);
    } catch (error) { view.actionError = error instanceof Error ? error.message : String(error); }
    finally { view.actionBusy = false; cx.notify(); }
  });
}
