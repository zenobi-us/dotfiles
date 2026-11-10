// Prepare and inspect a canonical handoff before a fresh OMP process receives it.
import { div } from "gpui-kit";
import { v_flex, h_flex, InputState, Input } from "gpui-base";
import { theme, props, run, closeOverlay, appHome } from "herdr";
import { request } from "./client.js";
import { button, note } from "./ui.js";

export function initAction(view, cx) {
  view.actionProps = props();
  view.input = InputState.new({ placeholder: "Additional request" });
  view.input.on("change", (_event, cx) => { view.prepared = null; cx.notify(); });
  view.actionBusy = false;
  view.actionError = "";
}

function prepareAction(view, confirm, cx) {
  if (view.actionBusy) return;
  const given = view.actionProps, prompt = view.input.value();
  const key = confirm ? view.prepared?.key : undefined;
  if (confirm && !key) return;
  view.actionBusy = true; view.actionError = ""; cx.notify();
  cx.spawn(async cx => {
    try {
      const prepared = await request("prepare", given.cwd, { id: given.id, kind: given.kind, action: given.action, prompt, ...(key ? { key } : {}) });
      if (view.input.value() !== prompt) { view.prepared = null; return; }
      view.prepared = prepared;
      if (confirm) {
        // A new session directory prevents OMP's auto-resume from reusing an earlier chat.
        const session = `${appHome()}/data/shared-context-sessions/${Date.now()}-${Math.random().toString(16).slice(2)}`;
        run("tab.new", { space: given.space, name: `${given.id} · ${given.action}`, folder: prepared.repository, argv: ["omp", "--cwd", prepared.repository, "--session-dir", session, prepared.prompt] });
        closeOverlay(given.overlay);
      }
    } catch (error) { view.actionError = String(error.message ?? error); view.prepared = null; }
    finally { view.actionBusy = false; cx.notify(); }
  });
}

export function renderAction(view) {
  const t = theme(), p = view.actionProps;
  return v_flex().size_full().min_h(0).p(18).gap(12).bg(t.popover).text_color(t.foreground).text_size(13)
    .child(div().font_semibold().text_size(16).child(`${p.action} · ${p.id}`))
    .child(div().text_color(t.muted).child("Inspect the prompt. Confirm to start a fresh OMP chat. Existing chats stay unchanged."))
    .child(Input.new(view.input).h(34).bg(t.input).border_1().border_color(t.border).rounded(6))
    .when(Boolean(view.actionError), el => el.child(note(view.actionError, true)))
    .child(div().flex_1().min_h(0).overflow_y_scrollbar().p(10).bg(t.background).text_size(12).text_color(t.muted).child(view.prepared?.prompt ?? "Prepare the prompt to read the current record, blockers, and workflow evidence."))
    .child(h_flex().justify_end().gap(8)
      .child(button("cancel-handoff", "Cancel", () => closeOverlay(p.overlay)))
      .child(button("prepare-handoff", view.actionBusy ? "Read current inputs…" : "Prepare prompt", (_event, cx) => prepareAction(view, false, cx), { disabled: view.actionBusy }))
      .child(button("confirm-handoff", "Open fresh chat", (_event, cx) => prepareAction(view, true, cx), { primary: true, disabled: view.actionBusy || !view.prepared })));
}
