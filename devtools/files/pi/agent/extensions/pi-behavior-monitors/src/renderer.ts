import { Box, Text } from "@mariozechner/pi-tui";

export function registerMonitorRenderer(pi) {
  // --- message renderer ---
  pi.registerMessageRenderer(
    "monitor-steer",
    (message, { expanded }, theme) => {
      const details = message.details;
      if (!details) {
        const box = new Box(1, 1, (t) => theme.bg("customMessageBg", t));
        box.addChild(new Text(String(message.content), 0, 0));
        return box;
      }
      const verdictColor = details.verdict === "new" ? "warning" : "error";
      const prefix = theme.fg(verdictColor, `[${details.monitorName}]`);
      const desc = ` ${details.description}`;
      const counter = theme.fg(
        "dim",
        ` (${details.whileCount}/${details.ceiling})`,
      );
      let text = `${prefix}${desc}${counter}`;
      if (details.verdict === "new") {
        text += theme.fg("dim", " — new pattern learned");
      }
      text += `\n${theme.fg("muted", details.steer)}`;
      if (expanded) {
        text += `\n${theme.fg("dim", `verdict: ${details.verdict}`)}`;
      }
      const box = new Box(1, 1, (t) => theme.bg("customMessageBg", t));
      box.addChild(new Text(text, 0, 0));
      return box;
    },
  );
}
