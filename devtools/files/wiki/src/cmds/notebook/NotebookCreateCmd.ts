

import { defineCommand } from "clerc";

export const NotebookListCommand = defineCommand({
  name: "notebook create",
  description: "Manage wiki notebooks",
  flags: {},
  alias: ["nb create"],
  parameters: [
    "[path]"
  ]
}, (ctx) => {
  console.log("Notebook command executed", ctx);
})
