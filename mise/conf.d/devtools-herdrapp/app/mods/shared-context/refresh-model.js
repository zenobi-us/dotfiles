// Target and visibility decisions stay independent of rendering and filesystem queries.
export function targetKey(where) {
  return JSON.stringify([where?.machine ?? null, where?.cwd ?? null]);
}

export function resolveLocation(given = {}, space, pane, focus, terminalList = []) {
  const address = focus?.shown ?? focus?.terminal ?? pane?.terminal;
  const terminal = terminalList.find(item => item.address === address);
  const machine = address ? address.includes("/") ? address.slice(0, address.indexOf("/")) : null : space?.machine ?? null;
  return {
    cwd: given.cwd ?? focus?.cwd ?? terminal?.cwd ?? pane?.cwd ?? space?.folder,
    machine: Object.hasOwn(given, "machine") ? given.machine ?? null : given.cwd != null ? null : machine,
    space: given.space ?? space?.id,
  };
}

// Hidden layout copies keep running. Ambiguous duplicate slots must not both poll.
export function copyIsShown(given, mode, tree, paneList, spaceList) {
  if (given.overlay) return true;
  if (given.pane) {
    const pane = paneList.find(item => item.pane === given.pane);
    const tab = spaceList.find(item => item.active)?.tabs?.find(item => item.active);
    if (!pane || pane.tab !== tab?.id) return false;
    return !paneList.some(item => item.tab === pane.tab && item.zoomed && item.pane !== pane.pane);
  }
  let matches = 0, visible = 0;
  const visit = (node, shown) => {
    if (!node || typeof node !== "object") return;
    shown = shown && node.hidden !== true;
    const content = node.content ?? node;
    const nodeProps = content.props ?? {};
    if (content.mod === "shared-context" && (nodeProps.mode ?? "tracker") === mode
      && (nodeProps.cwd ?? null) === (given.cwd ?? null)
      && (nodeProps.machine ?? null) === (given.machine ?? null)) {
      matches++; if (shown) visible++;
    }
    const children = node.children ?? [];
    const active = node.active ?? children[0]?.id;
    for (const child of children) visit(child, shown && (node.type !== "stack" || child.id === active));
  };
  visit(tree, true);
  if (matches === 0) {
    const modPanes = paneList.filter(item => item.mod === "shared-context");
    if (modPanes.length === 1) return copyIsShown({ ...given, pane: modPanes[0].pane }, mode, tree, paneList, spaceList);
  }
  return matches === 1 && visible === 1;
}

export function localWatchPaths(where, context, mode) {
  if (where?.machine != null) return [];
  const collections = context?.collections ?? [];
  const paths = context?.watchPaths ?? [];
  const useful = mode === "context" ? paths : paths.filter(path =>
    !collections.some(item => item.path === path && !["tickets", "initiatives"].includes(item.id)));
  return [...new Set(useful.filter(path => typeof path === "string" && path.startsWith("/")))];
}

export function localWatchFallback(where, context, mode) {
  return where?.machine == null && (context?.watchMissing ?? []).some(kind =>
    mode === "context" || ["tickets", "initiatives", "workflow"].includes(kind));
}

export function completedAgentWork(previous, current) {
  for (const [address, status] of current) {
    if ((status === "done" || status === "idle") && ["working", "blocked"].includes(previous.get(address))) return true;
  }
  return false;
}

// A burst during one refresh schedules one trailing refresh, never overlapping work.
export class RefreshQueue {
  constructor() { this.running = false; this.queued = false; }
  request() {
    if (this.running) { this.queued = true; return false; }
    this.running = true; return true;
  }
  finish() {
    this.running = false;
    const queued = this.queued; this.queued = false;
    return queued;
  }
}
