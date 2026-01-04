
import { defineCommand } from "clerc";

export const NotesListCommand = defineCommand({
  name: "notes list",
  description: "List all notes in the project",
  flags: {},
  alias: [],
  parameters: []
}, (ctx) => {
  console.log("List notes command executed", ctx);
})
