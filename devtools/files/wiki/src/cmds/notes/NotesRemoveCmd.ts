
import { defineCommand } from "clerc";

export const NotesRemoveCommand = defineCommand({
  name: "notes remove",
  description: "Remove a note from the project",
  flags: {},
  alias: [],
  parameters: []
}, (ctx) => {
  console.log("Remove note command executed", ctx);
})
