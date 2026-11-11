// Shared status composition for initiative tree rows and compact detail headers.
import { div } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";

const CATEGORIES = ["done", "active", "blocked", "ready"];
const LABELS = { done: "Done", active: "Active", blocked: "Blocked", ready: "Ready" };

export function initiativeProgressRow(progress, t) {
  if (!progress || progress.unavailable) return div().text_size(10).text_color(t.muted).child("Progress unavailable");
  if (!progress.total) return div().text_size(10).text_color(t.muted).child("No tickets yet");
  return v_flex().w_full().min_w(0).gap(5).tooltip(description(progress))
    .child(h_flex().w_full().min_w(0).gap(8).items_center()
      .child(div().flex_1().min_w(0).text_size(10).text_color(t.ansi2).child(`${progress.done}/${progress.total} done`))
      .child(div().flex_none().text_size(10).text_color(progress.blocked ? t.blocked : t.muted).child(progress.blocked ? `! ${progress.blocked} blocked` : `${progress.percent}%`)))
    .child(compositionBar(progress, t, 4));
}

export function initiativeProgressHeader(progress, t) {
  const root = v_flex().w_full().min_w(0).flex_none().gap(10);
  if (!progress || progress.unavailable) return root.text_size(11).text_color(t.muted)
    .child("Progress unavailable")
    .child(div().text_size(10).child("Read every member ticket and its workflow state before estimating completion."));
  if (!progress.total) return root.text_size(11).text_color(t.muted).child("No executable tickets yet.");
  return root
    .child(h_flex().w_full().flex_wrap().gap(8).items_center()
      .child(div().flex_1().min_w(140).text_size(12).text_color(t.foreground).child(`${progress.done} of ${progress.total} tickets complete`))
      .child(div().flex_none().text_size(16).text_color(t.ansi2).child(`${progress.percent}%`)))
    .child(compositionBar(progress, t, 7))
    .child(h_flex().w_full().flex_wrap().gap(12).children(CATEGORIES.map(category => h_flex().min_w(64).gap(5).items_center()
      .tooltip(category === "ready" ? "Actionable tickets, including recommended review, fix, finish and submit actions. Recommendations are not active work." : `${LABELS[category]} member tickets`)
      .child(div().size(7).flex_none().rounded(1).bg(color(category, t)))
      .child(div().text_size(10).text_color(t.muted).child(`${progress[category]} ${LABELS[category]}`)))))
    .when(progress.blocked > 0, element => element.child(div().text_size(10).text_color(t.blocked).whitespace_normal()
      .child(`! ${progress.blocked} ${progress.blocked === 1 ? "ticket is" : "tickets are"} blocked. Blocked work remains in the total.`)))
    .when(progress.done === progress.total, element => element.child(div().text_size(10).text_color(t.muted).whitespace_normal()
      .child("All member tickets complete. This is not a separate initiative approval.")));
}

function compositionBar(progress, t, height) {
  return h_flex().w_full().h(height).flex_none().min_w(0).gap(1).rounded(2).overflow_hidden().bg(t.border)
    .role("progress_indicator").accessibility_label(description(progress))
    .children(CATEGORIES.filter(category => progress[category] > 0).map(category => div().flex_basis(0).flex_grow(progress[category]).min_w(0).h_full().bg(color(category, t))));
}

function color(category, t) {
  return { done: t.ansi2, active: t.ansi4, blocked: t.blocked, ready: t.dim }[category];
}

function description(progress) {
  return `${progress.done} of ${progress.total} tickets complete (${progress.percent}%). ${progress.active} active, ${progress.blocked} blocked, ${progress.ready} ready. Ready includes recommended next actions, not active work.`;
}
