// Tracker and graph actions attach isolated agent sessions as a new pane or tab. The harness setting selects the agent.
import { run, focused, panes, spaces, closeOverlay } from "herdr";
import { query, discardSession } from "./data.js";
import { startAgent, stopAgent, waitForAgent, cancelAgentWait } from "./agents.js";

export function invalidateAction(view) {
  cancelAgentWait(view);
  view.actionGeneration = (view.actionGeneration ?? 0) + 1;
  view.actionBusy = false; view.actionError = "";
}

/**
 * Attach only while the target pane's tab belongs to the selected workspace.
 * Before attachment, this action owns the new terminal and prepared session.
 *
 * @param {{ actionBusy: boolean, actionError: string, preferencesReady?: boolean, preferences: { harness: string }, actionGeneration?: number, revision?: number, actionOpen?: object, context?: { repository: string }, selected?: { id: string, kind: string }, menuProps?: { cwd: string, id: string, kind: string } }} view
 * @param {{ cwd: string, machine?: string | null, space: string, id: string, kind: "ticket" | "initiative", action: string, prompt: string, destination: "pane" | "tab", overlay?: string }} given
 * @param {import("gpui-kit").Context} cx
 * @param {() => void} opened
 */
export function launchAction(view, given, cx, opened) {
  if (view.actionBusy) return;
  const target = focused(), revision = view.revision, open = view.actionOpen;
  const generation = view.actionGeneration = (view.actionGeneration ?? 0) + 1;
  const current = () => {
    const identity = view.menuProps ?? { cwd: view.context?.repository, ...view.selected };
    return generation === view.actionGeneration && revision === view.revision && open === view.actionOpen
      && identity.cwd === given.cwd && identity.id === given.id && identity.kind === given.kind;
  };
  view.actionBusy = true; view.actionError = ""; cx.notify();
  cx.spawn(async cx => {
    let prepared, address, attached = false;
    try {
      if (!target?.pane || target.space !== given.space) throw new Error("Select a pane in this repository's workspace before starting an action.");
      if (!view.preferencesReady) throw new Error("Shared Context settings are not loaded. Fix the settings error or wait, then try again.");
      prepared = await query("prepare", given, { id: given.id, kind: given.kind, action: given.action, prompt: given.prompt, harness: view.preferences.harness });
      if (!current()) return;
      if (!paneInSpace(target.pane, given.space)) throw new Error("The selected pane was closed or moved. Select another pane and try again.");
      address = await startAgent(given, prepared);
      if (!current()) return;
      await waitForAgent(view, address, cx);
      if (!current()) return;
      if (!paneInSpace(target.pane, given.space)) throw new Error("The selected pane was closed or moved while the agent started.");
      run("pane.focus", { pane: target.pane });
      run("terminal.keep", { terminal: address, place: given.destination === "tab" ? "tab" : "right" });
      attached = true;
      view.actionBusy = false;
      opened();
      if (given.overlay) closeOverlay(given.overlay);
      cx.notify();
    } catch (error) { if (current()) view.actionError = error instanceof Error ? error.message : String(error); }
    finally {
      if (!attached) {
        try { if (address) await stopAgent(address); if (prepared?.session) await discardSession(given, prepared.session); }
        catch (error) { view.actionError = `Agent cleanup failed: ${error instanceof Error ? error.message : String(error)}`; }
      }
      if (current()) { view.actionBusy = false; cx.notify(); }
    }
  });
}

function paneInSpace(paneId, spaceId) {
  const pane = panes().find(item => item.pane === paneId);
  // PaneInfo owns a tab, not a space. Check the tab's live owner after startup.
  return Boolean(pane && spaces().some(space => space.id === spaceId && space.tabs.some(tab => tab.id === pane.tab)));
}
