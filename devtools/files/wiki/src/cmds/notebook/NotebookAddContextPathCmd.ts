

import { type } from "arktype";
import { defineCommand } from "clerc";

export const NotebookAddContextPathCommand = defineCommand({
  name: "notebook add-context-path",
  description: "Add context path to a notebook. The context paths are used to automatically associate a notebook with your current working directory.",
  flags: {
    notebookPath: {
      type: String,
      description: "Path to the notebook",
      required: true,
    },
  },
  alias: ["nb add-context"],
  parameters: [
    "[path]"
  ],
}, (ctx) => {
  console.log("Notebook command executed", ctx);
})
