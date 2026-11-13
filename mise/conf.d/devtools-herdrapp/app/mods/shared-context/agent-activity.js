// Ephemeral activity stays separate from record metadata and receipt history; inactive records add no UI.
import { div } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { theme } from "herdr";
import { agentActivitySummary } from "./agent-model.js";

export function agentDots(id, agents, motion, t = theme()) {
  const waiting = agents.every(agent => agent.status === "blocked");
  return h_flex().id(id).flex_none().w(15).h(12).gap(3).items_center()
    .accessibility_label(`Live agents: ${agentActivitySummary(agents)}`).tooltip(`Live agents: ${agentActivitySummary(agents)}`)
    .children([0, 1, 2].map(index => div().id(`${id}:${index}`).size(3).rounded(waiting ? 0 : 2).bg(waiting ? t.ansi3 : t.accent)
      .when(!waiting && motion, el => el.loop("opacity", { from: .25, to: 1, period: 1200 + index * 180 }))));
}

export function agentRoster(view, record, agents) {
  const t = theme();
  return v_flex().min_w(0).gap(8).accessibility_label(`Live agents: ${agentActivitySummary(agents)}`)
    .children(agents.map(agent => v_flex().id(`record-live-agent:${record.ref}:${agent.address}`).min_w(0).gap(4)
      .child(h_flex().min_w(0).items_center().gap(8)
        .child(div().min_w(0).whitespace_normal().text_size(11).text_color(t.foreground).child(`${agent.address} · ${agent.program?.name ?? agent.app ?? "Agent"}`))
        .child(agentDots(`record-live-agent-dots:${record.ref}:${agent.address}`, [agent], view.preferences.motion, t))
        .child(div().flex_none().text_size(10).text_color(agent.status === "blocked" ? t.ansi3 : t.accent).child(agent.status === "blocked" ? "Needs input" : "Working")))
      .when(Boolean(agent.title), row => row.child(div().whitespace_normal().text_size(10).text_color(t.muted).child(agent.title)))
      .when(agent.recordRef !== record.ref, row => row.child(div().whitespace_normal().text_size(10).text_color(t.muted).child(`Member: ${agent.recordRef}`)))
      .child(div().whitespace_normal().text_size(10).text_color(t.muted).child(`${agent.space_name} / ${agent.tab_name}`))));
}
