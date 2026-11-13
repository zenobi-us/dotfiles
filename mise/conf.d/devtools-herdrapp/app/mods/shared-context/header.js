// Title-first record identity stays visible while reasons and references use disclosure.
import { div } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { theme } from "herdr";
import { button, typeColor, typeIcon } from "./ui.js";
import { itemType } from "./tree.js";
import { workflowBadge, badgePalette } from "./header-model.js";
import { initiativeProgressHeader } from "./progress.js";
import { recordActionControl } from "./action-menu.js";
import { agentRoster } from "./agent-activity.js";
import { recordBreadcrumb } from "./header-controls.js";

export function compactHeader(view, record) {
  const t = theme(), kind = view.selected.kind;
  const type = kind === "initiative" ? "initiative" : itemType(record);
  const state = kind === "ticket" ? view.snapshot.states?.[record.id] : null;
  const recommendation = workflowBadge(state, view.detail?.workflow, type === "ticket");
  const recordedStatus = type === "ticket" && record.status ? record.status.trim().toLowerCase() : null;
  const choices = view.detail?.actions ?? [];
  const primary = choices.find(choice => choice.action === view.detail?.nextAction);
  const liveAgents = view.liveActivity?.get(record.ref) ?? [];
  // Availability and Start share blue; green remains reserved for completed work.
  const tint = ({ ready: t.ansi4, next: t.ansi3, current: t.ansi4, blocked: t.blocked, complete: t.ansi2, neutral: t.muted })[recommendation?.tone] ?? t.muted;
  const workflowPalette = badgePalette(primary?.action === "start" ? t.ansi4 : primary ? t.ansi3 : tint, t.background);
  const reason = [view.activity?.needsReview ? view.activity.summary : null, state?.reason].filter(Boolean).join("\n\n");
  const columns = view.preferences.layout === "C2" && view.bodySize.width >= 600;
  const availableHeight = view.readerHeight ?? (columns || view.drawer === "expanded" ? view.bodySize.height : Math.max(0, view.bodySize.height / 2 - 44));
  const maximumHeight = Math.max(0, Math.min(availableHeight * .6, availableHeight - 96));
  const content = v_flex().id(`record-header-content:${record.ref}`).flex_none().min_w(0).p(16).gap(12)
    .on_size_change((size, cx) => { if (Math.abs(size.height - (view.headerContentHeight ?? 0)) > 1) { view.headerContentHeight = size.height; cx.notify(); } })
    .child(recordBreadcrumb(view, record, kind))
    .child(div().text_size(18).font_semibold().whitespace_normal().child(record.title))
    .child(h_flex().flex_wrap().gap(10).items_center().min_w(0)
      .child(div().flex_none().text_size(10).text_color(typeColor(type, t)).child(`${typeIcon(type)} ${type}`))
      .when(Boolean(recordedStatus), el => el.child(statusBadge(`record-recorded:${record.ref}`, `Recorded · ${recordedStatus}`, t.muted, t.border)))
      .when(Boolean(recommendation), el => el.child(statusBadge(`record-workflow:${record.ref}`, `${recommendation.label} · ${recommendation.value}`, tint, workflowPalette.border))))
    .when(kind === "initiative", el => el.child(initiativeProgressHeader(view.progress.get(record.id), t)))
    .child(h_flex().flex_wrap().gap(12).items_start().min_w(0).pt(12).border_t(1).border_color(t.border)
      .child(v_flex().flex_1().flex_basis(180).min_w(0)
        .when(liveAgents.length > 0, el => el.child(agentRoster(view, record, liveAgents))))
      .child(recordActionControl(view, choices, primary, { cwd: view.context.repository, machine: view.where.machine, space: view.where.space, id: record.id, kind }, recommendation, workflowPalette, reason)))
    .when(Boolean(record.blockedBy?.length), el => el.child(v_flex().min_w(0).gap(4)
      .child(div().text_size(10).text_color(t.muted).child("Blocked by"))
      .children(record.blockedBy.map(id => {
        const prerequisite = view.snapshot.tickets.find(item => item.id === id);
        return h_flex().min_w(0).gap(6).items_start()
          .child(div().flex_none().text_size(10).text_color(t.muted).child("•"))
          .child(button(`prerequisite:${record.ref}:${id}`, id, (_event, cx) => view.choose(prerequisite, "ticket", cx), { disabled: !prerequisite, height: "auto", label: prerequisite ? `Open blocking ticket ${id}: ${prerequisite.title}` : `Missing blocking ticket ${id}` })
            .min_w(0).max_w("100%").px(0).py(2).whitespace_normal().text_size(10).text_color(t.accent).bg("#00000000")
            .tooltip(prerequisite?.title ?? "This prerequisite is missing. Refresh or correct the canonical record."));
      }))));
  return v_flex().id(`record-header:${record.ref}`).flex_none().min_h(0).h(Math.min(view.headerContentHeight ?? maximumHeight, maximumHeight)).overflow_y_scrollbar().child(content);
}

function statusBadge(id, text, color, border) {
  return div().id(id).role("label").accessibility_label(text).px(6).py(3).text_size(10).text_color(color).border_1().border_color(border).child(text);
}
