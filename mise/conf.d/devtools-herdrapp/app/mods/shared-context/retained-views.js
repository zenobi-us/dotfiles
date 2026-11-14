// Retained surfaces isolate query progress from expensive tracker and Markdown rendering.
import { View, div } from "gpui-kit";
import { loadingView, queryFooter } from "./loading.js";

export function initRetainedViews(view, cx) {
  let wake;
  view.renderPending = false;
  view.requestRender = () => { view.renderPending = true; wake?.(); };
  // Existing controls mutate the supplied model. Their own context still owns inputs
  // and tasks; this proxy also requests parent layout updates for drawers/popups.
  const model = new Proxy(view, {
    set(target, key, value) {
      const changed = target[key] !== value;
      target[key] = value;
      if (changed && !STATUS_FIELDS.has(key)) view.requestRender();
      return true;
    },
  });
  view.retainedModel = model;
  view.surfaceSignals = {};
  view.parts = Object.fromEntries(["tree", "detail", "files", "loading", "status"].map(kind =>
    [kind, cx.new(RetainedSurface, { model, kind, signals: view.surfaceSignals })]));
  view.renderTask = cx.spawn(async cx => {
    while (!view.closed) {
      if (!view.renderPending) await new Promise(resolve => { wake = resolve; });
      wake = null;
      if (view.closed) return;
      view.renderPending = false;
      for (const signal of Object.values(view.surfaceSignals)) signal();
      cx.notify();
    }
  });
}

export function notifyQueryStatus(view, _cx) {
  if (view.closed) return;
  view.surfaceSignals?.status?.();
  view.surfaceSignals?.loading?.();
}

export function releaseRetainedViews(view) {
  view.renderTask?.cancel();
  for (const entity of Object.values(view.parts ?? {})) entity.release();
}

const STATUS_FIELDS = new Set([
  "loadStartedAt", "loadNow", "loadUpdatedAt", "loadProgress", "loadClock", "lastQuery",
]);

class RetainedSurface extends View {
  init({ model, kind, signals }, cx) {
    this.model = model; this.kind = kind; this.pending = false;
    let wake;
    signals[kind] = () => { this.pending = true; wake?.(); };
    // A promise can resume under another mod's scope. The child's own task
    // context redraws its owner without validating a foreign ambient Entity.
    cx.spawn(async cx => {
      while (!model.closed) {
        if (!this.pending) await new Promise(resolve => { wake = resolve; });
        wake = null;
        if (model.closed) return;
        this.pending = false;
        cx.notify();
      }
    });
  }
  render() {
    const view = this.model;
    if (this.kind === "status") return queryFooter(view);
    if (this.kind === "loading") return loadingView(view);
    if (this.kind === "files") return view.context?.ready ? view.filesView() : div();
    if (!view.snapshot) return div();
    if (this.kind === "detail") return view.recordView();
    const columns = view.preferences.layout === "C2" && view.bodySize.width >= 600;
    return view.treeView(!columns && view.selected && view.drawer === "peek" ? "50%" : "100%");
  }
}
