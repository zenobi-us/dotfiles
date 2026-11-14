// Watches stay local. Remote targets refresh only while this copy is shown.
import { spaces, panes, focused, terminals, agents, machines, layout, watchFolder } from "herdr";
import { recordAgentActivity } from "./agent-model.js";
import { resolveLocation, copyIsShown, localWatchPaths, localWatchFallback, completedAgentWork } from "./refresh-model.js";
import { syncPreferences } from "./preferences.js";

export function currentLocation(given) {
  const focus = focused();
  return resolveLocation(given, spaces().find(item => item.active), panes().find(item => item.pane === focus?.pane), focus, terminals());
}

export function initObservation(view, cx) {
  let wake;
  view.observationPending = false;
  view.requestObservation = () => { view.observationPending = true; wake?.(); };
  view.observationTask = cx.spawn(async cx => {
    while (!view.closed) {
      if (!view.observationPending) await new Promise(resolve => { wake = resolve; });
      wake = null;
      if (view.closed) return;
      view.observationPending = false;
      syncPreferences(view, cx);
      view.follow(cx);
      if (view.renderedPreferences !== view.preferences) {
        view.renderedPreferences = view.preferences;
        view.requestRender();
      }
      observeRefresh(view, cx);
    }
  });
}

export function scheduleObservation(view) {
  // Wake an existing task: render must neither create retained state nor notify.
  if (!view.closed) view.requestObservation?.();
}

export function startRefreshResources(view, cx) {
  view.agentStates = new Map(); view.liveActivityKey = ""; view.machineState = null;
  view.targetDirty = false; view.lastRefreshAt = Date.now();
  const generation = view.revision;
  view.refreshTimer = cx.timer.every(1000, cx => {
    if (view.closed || generation !== view.revision) return;
    view.follow(cx);
    if (generation === view.revision) observeRefresh(view, cx);
  });
}

export function stopRefreshResources(view) {
  view.refreshTimer?.cancel(); view.refreshTimer = null;
  if (view.closed) view.observationTask?.cancel();
  view.watchDebounce?.cancel(); view.watchDebounce = null;
  for (const task of view.watchTasks ?? []) task.cancel();
  view.watchTasks = []; view.watchKey = ""; view.watchFallback = false;
}

export function updateLocalWatches(view, cx) {
  const paths = localWatchPaths(view.where, view.context, view.mode);
  const fallback = localWatchFallback(view.where, view.context, view.mode), key = JSON.stringify([paths, fallback]);
  if (key === view.watchKey) return;
  for (const task of view.watchTasks ?? []) task.cancel();
  view.watchTasks = []; view.watchKey = key; view.watchFallback = fallback;
  const generation = view.revision;
  for (const path of paths) view.watchTasks.push(cx.spawn(async cx => {
    try {
      while (!view.closed && generation === view.revision && key === view.watchKey) {
        await watchFolder(path);
        if (view.closed || generation !== view.revision || key !== view.watchKey) return;
        view.watchDebounce?.cancel();
        view.watchDebounce = cx.timer.after(400, cx => {
          if (view.closed || generation !== view.revision || key !== view.watchKey) return;
          view.targetDirty = true;
          observeRefresh(view, cx);
        });
      }
    } catch {
      if (!view.closed && generation === view.revision && key === view.watchKey) view.watchFallback = true;
    }
  }));
}

function observeRefresh(view, cx) {
  if (!view.where?.cwd || view.closed) return;
  const shown = copyIsShown(view.given, view.mode, layout(), panes(), spaces());
  const state = machines().find(item => item.name === (view.where.machine ?? null))?.layout;
  if (state === "ready" && view.machineState && view.machineState !== "ready") view.targetDirty = true;
  view.machineState = state;
  if (view.snapshot && view.context) {
    const agentList = agents(), terminalList = terminals();
    const activity = recordAgentActivity(view.snapshot, agentList, terminalList, view.context.repository, view.where.machine);
    const relevant = new Set([...activity.values()].flat().map(agent => agent.address));
    const states = new Map(agentList.filter(agent => relevant.has(agent.address) || view.agentStates.has(agent.address)).map(agent => [agent.address, agent.status]));
    if (completedAgentWork(view.agentStates, states)) view.targetDirty = true;
    view.agentStates = states;
    const activityKey = JSON.stringify([...activity].map(([ref, entries]) => [ref, entries.map(agent => [agent.address, agent.status])]));
    if (activityKey !== view.liveActivityKey) {
      view.liveActivityKey = activityKey; view.liveActivity = activity;
      view.requestRender();
    }
  }
  if (!shown || state === "unavailable" || state === "loading") return;
  const periodic = (view.where.machine != null || view.watchFallback) && !view.loading && Date.now() - view.lastRefreshAt >= 10000;
  if (view.targetDirty || periodic) {
    view.targetDirty = false;
    view.refresh(cx, true);
  }
}
