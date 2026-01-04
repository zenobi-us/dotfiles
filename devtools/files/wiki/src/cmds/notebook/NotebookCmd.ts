
import { defineCommand } from "clerc";

export const NotebookCommand = defineCommand({
  name: "notebook",
  description: "Manage wiki notebooks",
  flags: {},
  alias: ["nb"],
  parameters: []
}, (ctx) => {
  console.log("Notebook command executed");
})
