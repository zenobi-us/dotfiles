// Header disclosure keeps reasons and canonical references out of the reading area.
import { div } from "gpui-kit";
import { h_flex, v_flex, Popup, TextView } from "gpui-base";
import { theme } from "herdr";
import { button } from "./ui.js";
import { recordReferences } from "./header-model.js";
import { invalidateAction } from "./action.js";

export function initHeaderControls(view, cx) {
  view.headerReason = null;
  view.referenceOpen = null;
  view.referenceCopied = null;
  view.referenceError = "";
  view.referenceSequence = 0;
  view.referenceTriggerFocus = cx.focus_handle();
  view.referenceFocus = cx.focus_handle();
  view.referenceCloseFocus = cx.focus_handle();
  view.referenceRowFocus = Array.from({ length: 3 }, () => cx.focus_handle());
  view.reasonTriggerFocus = cx.focus_handle();
  view.reasonCloseFocus = cx.focus_handle();
  view.reasonActivityFocus = cx.focus_handle();
}

export function clearHeaderControls(view) {
  view.headerReason = null;
  view.referenceOpen = null;
  view.referenceCopied = null;
  view.referenceError = "";
  view.referenceSequence = (view.referenceSequence ?? 0) + 1;
}

export function recordBreadcrumb(view, record, kind) {
  const t = theme(), shown = view.referenceOpen === record.ref;
  const close = cx => { view.referenceOpen = null; view.referenceTriggerFocus.focus(); cx.notify(); };
  const trigger = button(`record-breadcrumb:${record.ref}`, "", (_event, cx) => {
    if (shown) { close(cx); return; }
    if (view.actionOpen) { invalidateAction(view); view.actionOpen = null; }
    view.recordActionsOpen = null;
    view.referenceOpen = record.ref; view.referenceCopied = null; view.referenceError = "";
    view.referenceRowFocus[0].focus(); cx.notify();
  }, { disabled: view.actionBusy, label: `Copy references for ${record.id}`, height: "auto" })
    .track_focus(view.referenceTriggerFocus).tab_index(0).min_h(28).min_w(0).max_w("100%").px(0).py(4)
    .bg("#00000000").text_color(t.muted).text_size(10).tooltip("Copy ID, canonical reference, or Markdown link")
    .child(div().flex_1().min_w(0).whitespace_normal().child(`${kind === "initiative" ? "Initiatives" : "Tickets"} / ${record.id} ▾`));
  const references = recordReferences(record, kind);
  const handles = [...view.referenceRowFocus, view.referenceCloseFocus];
  const content = () => v_flex().id("record-reference-dialog").role("dialog").accessibility_label(`Copy a reference for ${record.id}`)
    .w(440).max_w("100%").max_h(520).overflow_y_scrollbar().p(14).gap(10).border_1().border_color(t.border).bg(t.popover)
    .track_focus(view.referenceFocus).tab_index(0)
    .on_mouse_down_out((_event, cx) => close(cx))
    .on_key_down((event, cx) => {
      if (event.key === "escape") { cx.stop_propagation(); close(cx); return; }
      if (event.key !== "tab") return;
      cx.stop_propagation();
      const index = handles.findIndex(handle => handle.is_focused());
      handles[(index + (event.modifiers.shift ? handles.length - 1 : 1)) % handles.length].focus();
    })
    .child(h_flex().gap(12).items_center()
      .child(div().flex_1().font_semibold().child("Copy a reference"))
      .child(button("close-record-reference", "Close · Esc", (_event, cx) => close(cx)).track_focus(view.referenceCloseFocus).tab_index(0)))
    .children(references.map((reference, index) => button(`copy-record-reference:${reference.id}`, "", (_event, cx) => {
      try {
        cx.write_to_clipboard(reference.value);
        view.referenceCopied = reference.id; view.referenceError = "";
        const sequence = ++view.referenceSequence;
        cx.timer.after(1800, cx => { if (view.referenceSequence === sequence) { view.referenceCopied = null; cx.notify(); } });
      } catch (error) { view.referenceError = `Could not copy the reference: ${String(error.message ?? error)}`; }
      cx.notify();
    }, { label: `Copy ${reference.label}: ${reference.value}`, height: "auto" })
      .track_focus(view.referenceRowFocus[index]).tab_index(0).w_full().min_w(0).py(10).px(10).bg(t.raised)
      .child(v_flex().min_w(0).flex_1().gap(4)
        .child(h_flex().gap(12).child(div().flex_1().text_size(11).child(reference.label))
          .child(div().text_size(10).text_color(t.accent).child(view.referenceCopied === reference.id ? "Copied" : "Copy")))
        .child(div().whitespace_normal().text_size(10).text_color(t.muted).child(reference.value)))))
    .when(Boolean(view.referenceCopied || view.referenceError), el => el.child(div().role("status").whitespace_normal().text_size(10)
      .text_color(view.referenceError ? t.blocked : t.accent).child(view.referenceError || "Reference copied.")));
  return Popup.new(`record-reference-popup:${record.ref}`, trigger).when(shown, el => el.content(content()));
}

export function recordReasonButton(view, reason, label, palette) {
  return button("record-next-reason", "?", (_event, cx) => {
    if (view.actionOpen) { invalidateAction(view); view.actionOpen = null; }
    view.recordActionsOpen = null; view.referenceOpen = null;
    view.headerReason = { reason, label };
    view.reasonCloseFocus.focus(); cx.notify();
  }, { disabled: view.actionBusy || !reason, label: reason ? `Why ${label}` : "No next-action reason is available" })
    .track_focus(view.reasonTriggerFocus).tab_index(0).w(30).min_h(34).h("auto").px(0)
    .bg(palette.label).text_color(palette.labelText).border_r(1).border_color(palette.border).tooltip("Why this next action?");
}

export function renderHeaderReason(view) {
  const t = theme(), reason = view.headerReason;
  const close = (_event, cx) => { view.headerReason = null; view.reasonTriggerFocus.focus(); cx.notify(); };
  return v_flex().id("record-reason-backdrop").absolute().inset_0().items_center().justify_center()
    .on_mouse_down("left", (event, cx) => { cx.stop_propagation(); close(event, cx); })
    .child(div().absolute().inset_0().bg(t.background).opacity(.65))
    .child(v_flex().id("record-reason-dialog").relative().w("92%").max_w(540).max_h("85%").min_h(0)
      .role("dialog").accessibility_label(`Why ${reason.label}`).p(20).gap(16).bg(t.popover).border_1().border_color(t.border)
      .on_mouse_down("left", (_event, cx) => cx.stop_propagation())
      .on_key_down((event, cx) => {
        if (event.key === "escape") { cx.stop_propagation(); close(event, cx); }
        if (event.key === "tab") {
          cx.stop_propagation();
          (view.activity?.needsReview && !view.reasonActivityFocus.is_focused() ? view.reasonActivityFocus : view.reasonCloseFocus).focus();
        }
      })
      .child(div().text_size(10).text_color(t.muted).child("Next-action reason"))
      .child(div().text_size(16).font_semibold().whitespace_normal().child(reason.label))
      .child(TextView.markdown("record-next-reason-text", reason.reason).w_full().h(120).selectable(true).scrollable(true))
      .when(Boolean(view.activity?.needsReview), el => el.child(button("inspect-workflow-activity", "View in Activity", (_event, cx) => {
        view.headerReason = null; view.inspectActivity(cx);
      }).track_focus(view.reasonActivityFocus).tab_index(0)))
      .child(button("close-record-reason", "Close · Esc", close).track_focus(view.reasonCloseFocus).tab_index(0)));
}
