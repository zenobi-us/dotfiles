import { evaluateWhen, collectUserText } from "./context";
import { renderClassifyPrompt, classifyPrompt } from "./classification";
import { learnPattern } from "./patterns";
import { executeWriteAction } from "./actions";

export async function activate(
  monitor,
  pi,
  ctx,
  branch,
  steeredThisTurn,
  updateStatus,
  pendingAgentEndSteers,
  monitorTemplateEnv,
  monitorsEnabled,
) {
  if (!monitorsEnabled()) return;
  if (monitor.dismissed) return;
  // check excludes
  for (const ex of monitor.classify.excludes) {
    if (steeredThisTurn.has(ex)) return;
  }
  if (!evaluateWhen(monitor, branch)) return;
  // dedup: skip if user text unchanged since last classification
  const currentUserText = collectUserText(branch);
  if (currentUserText && currentUserText === monitor.lastUserText) return;
  // ceiling check
  if (monitor.whileCount >= monitor.ceiling) {
    await escalate(monitor, pi, ctx);
    updateStatus();
    return;
  }
  const prompt = renderClassifyPrompt(monitor, branch, monitorTemplateEnv);
  if (!prompt) return;
  // create an abort controller so classification can be cancelled if the user aborts
  const abortController = new AbortController();
  const onAbort = () => abortController.abort();
  const unsubAbort = pi.events.on("monitors:abort", onAbort);
  let result;
  try {
    result = await classifyPrompt(ctx, monitor, prompt, abortController.signal);
  } catch (e) {
    if (abortController.signal.aborted) return;
    const message = e instanceof Error ? e.message : String(e);
    if (ctx.hasUI) {
      ctx.ui.notify(
        `[${monitor.name}] Classification failed: ${message}`,
        "error",
      );
    } else {
      console.error(`[${monitor.name}] Classification failed: ${message}`);
    }
    return;
  } finally {
    unsubAbort();
  }
  // mark this user text as classified
  monitor.lastUserText = currentUserText;
  if (result.verdict === "clean") {
    const cleanAction = monitor.actions.on_clean;
    if (cleanAction) {
      executeWriteAction(monitor, cleanAction, result);
    }
    monitor.whileCount = 0;
    updateStatus();
    return;
  }
  // Determine which action to execute
  const action =
    result.verdict === "new" ? monitor.actions.on_new : monitor.actions.on_flag;
  if (!action) return;
  // Learn new pattern
  if (result.verdict === "new" && result.newPattern && action.learn_pattern) {
    learnPattern(monitor, result.newPattern);
  }
  // Execute write action (findings to JSON file)
  executeWriteAction(monitor, action, result);
  // Steer (inject message into conversation) — only for main scope
  if (action.steer && monitor.scope.target === "main") {
    const description = result.description ?? "Issue detected";
    const annotation = result.verdict === "new" ? " — new pattern learned" : "";
    const details = {
      monitorName: monitor.name,
      verdict: result.verdict,
      description,
      steer: action.steer,
      whileCount: monitor.whileCount + 1,
      ceiling: monitor.ceiling,
    };
    const content = `[${monitor.name}] ${description}${annotation}. ${action.steer}`;
    if (monitor.event === "agent_end" || monitor.event === "command") {
      // Already post-loop or command context: deliver immediately
      pi.sendMessage(
        { customType: "monitor-steer", content, display: true, details },
        { deliverAs: "steer", triggerTurn: true },
      );
    } else {
      // message_end / turn_end: buffer for drain at agent_end
      // (pi's async event queue means these handlers run after the agent loop
      // has already checked getSteeringMessages — direct sendMessage misses
      // the window and the steer arrives one response late)
      pendingAgentEndSteers.push({ monitor, details, content });
    }
  }
  monitor.whileCount++;
  steeredThisTurn.add(monitor.name);
  updateStatus();
}

export async function escalate(monitor, pi, ctx) {
  if (monitor.escalate === "dismiss") {
    monitor.dismissed = true;
    monitor.whileCount = 0;
    return;
  }
  // In headless mode there is no way to prompt the user, so auto-dismiss
  // to avoid an infinite classify-reset cycle that can never be resolved.
  if (!ctx.hasUI) {
    monitor.dismissed = true;
    monitor.whileCount = 0;
    return;
  }
  if (ctx.hasUI) {
    const choice = await ctx.ui.confirm(
      `[${monitor.name}] Steered ${monitor.ceiling} times`,
      "Continue steering, or dismiss this monitor for the session?",
    );
    if (!choice) {
      monitor.dismissed = true;
      monitor.whileCount = 0;
      return;
    }
  }
  monitor.whileCount = 0;
}
