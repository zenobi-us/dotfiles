
import { defineCommand } from "clerc";

export const NotesSearchCommand = defineCommand({
  name: "notes search",
  description: "Search notes in the project",
  flags: {},
  alias: [],
  parameters: [
    "[query]"
  ]
}, (ctx) => {
  console.log("Search notes command executed", ctx);
})
