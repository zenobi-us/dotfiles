// Herdr starts visible mods only; a one-pixel chrome slot keeps this worker mounted.
// Manual sizes survive until a split, close, or explicit equalize command.
import { View, div } from "gpui-kit";
import { appHome, checking, exec, nextCommand, notify, panes, spaces, theme } from "herdr";

export default class EqualizePanes extends View {
  init(_props, cx) {
    this.membership = null;
    this.pending = new Map();
    this.busy = false;
    this.helper = `${appHome()}/mods/equalise-panes/equalize.mjs`;
    if (checking()) return;
    cx.spawn(async (cx) => {
      for (; ;) {
        const command = await nextCommand();
        if (command === "equalize") this.equalizeFocused(cx);
      }
    });
  }

  equalizeFocused(cx) {
    if (this.activeTarget) this.enqueue(this.activeTarget.machine, this.activeTarget.tab, cx);
  }

  enqueue(machine, tab, cx) {
    this.pending.set(tab, { machine, tab: machine ? tab.slice(machine.length + 1) : tab });
    if (this.busy) return;
    this.busy = true;
    cx.spawn(async (cx) => {
      try {
        while (this.pending.size) {
          const targets = [...this.pending.values()];
          this.pending.clear();
          const launcher = 'export PATH="$HOME/.local/bin:$PATH"; if runtime=$(command -v bun); then :; elif manager=$(command -v mise) && runtime=$(MISE_AUTO_INSTALL=0 MISE_EXEC_AUTO_INSTALL=0 "$manager" which bun); then :; else printf "%s\\n" "Bun is unavailable. Install Bun through mise." >&2; exit 127; fi; exec "$runtime" "$@"';
          const result = await exec("sh", ["-c", launcher, "equalise-panes", this.helper, JSON.stringify(targets)]);
          if (result.code !== 0) throw new Error(result.stderr.trim() || "The core rejected pane equalization.");
        }
      } catch (error) {
        notify({ title: "Could not equalize panes", body: String(error.message ?? error), level: "error" });
      } finally {
        this.busy = false;
        cx.notify();
      }
    });
  }

  render(cx) {
    const membership = new Map();
    const allPanes = panes();
    // Async commands may resume under another mod's scope; capture our target here.
    this.activeTarget = null;
    for (const space of spaces()) {
      for (const tab of space.tabs) {
        if (space.active && tab.active) this.activeTarget = { machine: space.machine, tab: tab.id };
        const ids = allPanes.filter(pane => pane.tab === tab.id).map(pane => pane.pane).sort();
        const signature = JSON.stringify(ids);
        membership.set(tab.id, signature);
        if (!checking() && this.membership && ids.length > 1 && this.membership.get(tab.id) !== signature) {
          this.enqueue(space.machine, tab.id, cx);
        }
      }
    }
    this.membership = membership;
    return div().size_full().bg(theme().chrome);
  }
}
