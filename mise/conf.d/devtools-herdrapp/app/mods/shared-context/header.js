// The compact header owns record metadata; document tabs keep their reading space.
import { div } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { theme } from "herdr";
import { button, typeColor, typeIcon } from "./ui.js";
import { itemType } from "./tree.js";
import { workflowBadge, badgePalette } from "./header-model.js";
import { initiativeProgressHeader } from "./progress.js";
import { actionDropdown } from "./action-menu.js";

export function compactHeader(view, record) {
  const t = theme(), kind = view.selected.kind;
  const type = kind === "initiative" ? "initiative" : itemType(record);
  const state = kind === "ticket" ? view.snapshot.states?.[record.id] : null;
  const recommendation = workflowBadge(state, view.detail?.workflow, type === "ticket");
  const recordedStatus = type === "ticket" && record.status ? record.status.trim().toLowerCase() : null;
  const badge = recordedStatus ? { label: "recorded", value: recordedStatus, tone: ["completed", "done", "closed", "resolved", "complete"].includes(recordedStatus) ? "complete" : "neutral" } : recommendation;
  const activity = view.activity;
  const collection = view.context.collections.find(item => item.id === (kind === "ticket" ? "tickets" : "initiatives"));
  const store = collection?.store ?? collection?.adapter ?? view.context.mode;
  const copied = view.copiedReference === record.ref;
  const tint = ({ next: t.ansi3, current: t.ansi4, blocked: t.blocked, complete: t.ansi2, neutral: t.muted })[badge?.tone] ?? t.muted;
  const metadataPalette = badgePalette(t.muted, t.background, true), workflowPalette = badgePalette(tint, t.background);
  const columns = view.preferences.layout === "C2" && view.bodySize.width >= 600;
  const availableHeight = view.readerHeight ?? (columns || view.drawer === "expanded" ? view.bodySize.height : Math.max(0, view.bodySize.height / 2 - 44));
  const maximumHeight = Math.max(0, Math.min(availableHeight * .6, availableHeight - 96));
  const content = v_flex().id(`record-header-content:${record.ref}`).flex_none().min_w(0).px(16).pt(14).pb(10).gap(10)
    .on_size_change((size, cx) => { if (Math.abs(size.height - (view.headerContentHeight ?? 0)) > 1) { view.headerContentHeight = size.height; cx.notify(); } })
    .child(h_flex().flex_wrap().gap(8).items_center().min_w(0)
      .child(div().flex_none().text_size(11).text_color(typeColor(type, t)).child(`${typeIcon(type)} ${type}`))
      .child(div().flex_1().min_w(120).whitespace_normal().text_size(10).text_color(t.muted).tooltip(record.id).child(record.id))
      .when(Boolean(badge), el => el.child(segmentedBadge(`record-workflow:${record.ref}`, `${badge.label}:`, badge.value, workflowPalette).flex_none()))
      .when(Boolean(recordedStatus && recommendation && recommendation.label !== "status" && !activity?.needsReview), el => el.child(segmentedBadge(`record-recommendation:${record.ref}`, `${recommendation.label}:`, recommendation.value, metadataPalette).flex_none())))
    .child(div().text_size(13).font_weight(500).whitespace_normal().child(record.title))
    .when(kind === "initiative", el => el.child(initiativeProgressHeader(view.progress.get(record.id), t)))
    .child(h_flex().flex_wrap().gap(6).items_center()
      .children((view.detail?.actions ?? []).map(choice => actionDropdown(view, choice, { cwd: view.context.repository, space: view.where.space, id: record.id, kind })))
      .child(div().flex_1())
      .child(button("copy-record-ref", copied ? "Copied reference" : "Copy reference", (_event, cx) => copyRecordReference(view, record, cx)).bg("#00000000")))
    .child(h_flex().flex_wrap().gap(8).min_w(0).pt(10).border_t(1).border_color(t.border)
      .child(segmentedBadge(`record-store:${record.ref}`, "store", store, metadataPalette).flex_none())
      .child(segmentedBadge(`record-reference:${record.ref}`, copied ? "copied" : "reference", record.ref, metadataPalette, (_event, cx) => copyRecordReference(view, record, cx), copied ? `Reference copied: ${record.ref}. Activate to copy again.` : `Copy reference: ${record.ref}`)
        .flex_1().flex_basis(280).min_w(0).tooltip("Copy the full canonical reference")))
    .when(Boolean(activity?.needsReview), el => el.child(h_flex().flex_wrap().gap(8).p(10).border_l(2).border_color(t.blocked)
      .child(div().flex_1().min_w(160).whitespace_normal().text_size(12).text_color(t.blocked).child(activity.summary))
      .child(button("inspect-workflow-activity", "View in Activity", (_event, cx) => view.inspectActivity(cx)))))
    .when(Boolean(state?.reason && !activity?.needsReview), el => el.child(h_flex().flex_wrap().gap(8).p(10).border_l(2).border_color(workflowPalette.border).bg(workflowPalette.label)
      .child(div().text_size(10).text_color(workflowPalette.labelText).child("Reason"))
      .child(div().flex_1().min_w(160).whitespace_normal().text_size(11).text_color(t.foreground).child(state.reason))))
    .when(Boolean(record.blockedBy?.length), el => el.child(h_flex().flex_wrap().gap(6).items_center()
      .child(div().text_size(10).text_color(t.muted).child("Direct prerequisites"))
      .children(record.blockedBy.map(id => {
        const prerequisite = view.snapshot.tickets.find(item => item.id === id);
        return button(`prerequisite:${record.ref}:${id}`, `↗ ${id}`, (_event, cx) => view.choose(prerequisite, "ticket", cx), { disabled: !prerequisite, label: prerequisite ? `Open prerequisite ${id}: ${prerequisite.title}` : `Missing prerequisite ${id}` })
          .text_size(10).text_color(t.accent).bg("#00000000").tooltip(prerequisite?.title ?? "This prerequisite is missing. Refresh or correct the canonical record.");
      }))));
  return v_flex().id(`record-header:${record.ref}`).flex_none().min_h(0).h(Math.min(view.headerContentHeight ?? maximumHeight, maximumHeight)).overflow_y_scrollbar().child(content);
}

export function copyRecordReference(view, record, cx) {
  cx.write_to_clipboard(record.ref);
  view.copiedReference = record.ref;
  const sequence = view.copySequence = (view.copySequence ?? 0) + 1;
  cx.notify();
  cx.timer.after(1800, cx => {
    if (view.copySequence !== sequence) return;
    view.copiedReference = null;
    cx.notify();
  });
}

function segmentedBadge(id, label, value, palette, action, accessibleLabel) {
  const badge = action ? button(id, "", action, { label: accessibleLabel }).h("auto").px(0).py(0) : h_flex().id(id).role("label").accessibility_label(`${label} ${value}`);
  return badge.min_w(0).max_w("100%").rounded(0).overflow_hidden().border_1().border_color(palette.border).bg(palette.value)
    .child(h_flex().min_w(0).flex_1()
      .child(div().flex_none().px(8).py(4).bg(palette.label).border_r(1).border_color(palette.border).text_color(palette.labelText).text_size(10).child(label))
      .child(div().flex_1().min_w(0).px(8).py(4).whitespace_normal().bg(palette.value).text_color(palette.valueText).text_size(10).child(value)));
}
