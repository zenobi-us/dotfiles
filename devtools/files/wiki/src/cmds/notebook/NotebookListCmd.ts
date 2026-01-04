

import { defineCommand } from "clerc";

export const NotebookListCommand = defineCommand({
  name: "notebook list",
  description: "Manage wiki notebooks",
  flags: {},
  alias: ["nb list"],
  parameters: []
}, (ctx) => {
  console.log("Notebook command executed", ctx);
})
