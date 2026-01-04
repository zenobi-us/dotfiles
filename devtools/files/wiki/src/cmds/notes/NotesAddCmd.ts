
import { defineCommand } from "clerc";

export const NotesAddCommand = defineCommand({
  name: "notes add",
  description: "Add a new note to the project",
  flags: {},
  alias: [],
  parameters: []
}, (ctx) => {
  console.log("Add note command executed", ctx);
})
