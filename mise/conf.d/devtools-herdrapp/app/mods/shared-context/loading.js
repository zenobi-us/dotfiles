// Counts describe one measured phase. The footer keeps query activity visible
// outside scrolling content; only measured phases show a completion percentage.
import { div } from "gpui-kit";
import { h_flex, v_flex, Progress, ProgressTrack, ProgressIndicator } from "gpui-base";
import { theme } from "herdr";
import { icon } from "./ui.js";

const PHASES = {
  settings: ["Loading panel settings", "Read panel preferences."],
  context: ["Resolving repository context", "Resolve paths on the selected machine."],
  discover: ["Discovering tracker records", "Count files before reading their contents."],
  read: ["Reading tracker files", ""],
  parse: ["Parsing tracker files", ""],
  records: ["Checking tracker records", "Check fields, links and membership."],
  validate: ["Validating tracker files", "Check that files did not change during the read."],
  workflows: ["Checking workflow state", "Inspect each ticket's workflow and Git state."],
};

export function beginLoading(view, cx) {
  stopLoading(view);
  view.loadStartedAt = view.loadNow = view.loadUpdatedAt = Date.now();
  view.loadProgress = { phase: "context", completed: 0, total: null };
  view.loadClock = cx.timer.every(1000, cx => { view.loadNow = Date.now(); notifyStatus(view, cx); });
  notifyStatus(view, cx);
}

export function updateLoading(view, progress, cx) {
  view.loadProgress = progress;
  view.loadNow = view.loadUpdatedAt = Date.now();
  notifyStatus(view, cx);
}

export function stopLoading(view) {
  view.loadClock?.cancel();
  view.loadClock = null;
}

export function loadingView(view) {
  const t = theme(), progress = view.loadProgress ?? { phase: "settings", completed: 0, total: null };
  const [title, hint] = PHASES[progress.phase] ?? [progress.phase, "Waiting for a measured progress update."];
  const known = progress.total != null;
  const percent = known ? progress.total === 0 ? 100 : Math.max(0, Math.min(100, progress.completed / progress.total * 100)) : null;
  const unit = progress.phase === "workflows" ? "tickets" : "files";
  const count = known ? `${progress.completed} of ${progress.total} ${unit}` : hint;
  const elapsed = duration((view.loadNow ?? Date.now()) - (view.loadStartedAt ?? Date.now()));
  const quiet = (view.loadNow ?? 0) - (view.loadUpdatedAt ?? 0);
  const clock = quiet >= 15000 ? `${elapsed} elapsed · No progress update for ${duration(quiet)}` : `${elapsed} elapsed`;
  const spinner = icon("spinner", 28).text_color(t.accent).when(view.preferences?.motion !== false, el => el.spin(900));
  const meter = Progress.new("tracker-load-progress").w_full().min_w(0)
    .accessibility_label(`${title}. ${count}`).indeterminate(!known)
    .when(known, el => el.value(percent).child(ProgressTrack.new().w_full().h(3).bg(t.border).overflow_hidden()
      .child(ProgressIndicator.new().h_full().w(`${percent}%`).bg(t.accent).transition("width", { duration: view.preferences?.motion === false ? 0 : 160 }))));
  return v_flex().flex_1().min_h(0).w_full().p(24).items_center().justify_center()
    .child(v_flex().w_full().max_w(360).min_w(0).items_center().gap(12)
      .child(spinner)
      .child(div().font_semibold().text_size(14).text_color(t.foreground).text_center().child(title))
      .child(div().w_full().child(meter))
      .child(div().text_size(12).text_color(t.muted).text_center().whitespace_normal().child(count))
      .when(Boolean(progress.current), el => el.child(div().w_full().truncate().text_center().text_size(11).text_color(t.dim).tooltip(progress.current).child(progress.current.split("/").pop())))
      .child(div().text_size(10).text_color(quiet >= 15000 ? t.ansi3 : t.dim).text_center().whitespace_normal().child(clock)));
}

/**
 * Persistent status for Files and Tracker, including detail and directory queries.
 * Counts and percentages belong to the current phase, not the whole query.
 * Hover reveals the full query target, current file, or failure message.
 */
export function queryFooter(view) {
  const t = theme(), pending = [...view.pendingQueries];
  const request = pending[pending.length - 1] ?? view.lastQuery;
  const active = pending.length > 0, progress = request?.progress;
  const error = view.error || (active ? "" : request?.error);
  const title = request ? `${request.operation}${request.target ? ` · ${request.target}` : ""}` : view.preferencesReady ? "No query" : "settings";
  const phase = active && progress ? PHASES[progress.phase]?.[0] ?? progress.phase : "";
  const known = active && progress?.total != null;
  const percent = known ? progress.total === 0 ? 100 : Math.min(100, progress.completed / progress.total * 100) : null;
  const status = error ? view.stale ? "Stale · failed" : "Failed" : active ? known ? `${progress.completed}/${progress.total} · ${Math.round(percent)}%` : "Running…" : view.stale ? "Stale" : request ? "Complete" : view.preferencesReady ? "Idle" : "Loading…";
  const label = `${title}${phase ? ` · ${phase}` : ""}`;
  const detail = [label, view.stale ? "Showing the last successful snapshot." : "", progress?.current, error, pending.length > 1 ? `${pending.length} queries running` : ""].filter(Boolean).join("\n");
  return h_flex().id("shared-context-status").w_full().h(30).min_w(0).flex_none().px(10).gap(8).items_center()
    .border_t(1).border_color(t.border).bg(t.chrome).text_size(10).text_color(t.muted)
    .accessibility_label(`Query: ${label}. ${status}${error ? `. ${error}` : ""}`).tooltip(detail)
    .child(active ? icon("spinner", 12).flex_none().text_color(t.accent).when(view.preferences?.motion !== false, el => el.spin(900))
      : div().flex_none().text_color(error ? t.blocked : t.dim).child(error ? "!" : "·"))
    .child(div().flex_1().min_w(0).truncate().child(label))
    .when(known, el => el.child(Progress.new("shared-context-query-progress").w(48).flex_none().value(percent)
      .accessibility_label(`${phase}: ${status}`)
      .child(ProgressTrack.new().w_full().h(3).bg(t.border).overflow_hidden()
        .child(ProgressIndicator.new().h_full().w(`${percent}%`).bg(t.accent)))))
    .child(div().flex_none().text_color(error ? t.blocked : active ? t.accent : t.dim).child(status));
}

function notifyStatus(view, _cx) {
  if (view.closed) return;
  view.surfaceSignals?.status?.();
  view.surfaceSignals?.loading?.();
}

function duration(milliseconds) {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000));
  return seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${String(seconds % 60).padStart(2, "0")}s`;
}
