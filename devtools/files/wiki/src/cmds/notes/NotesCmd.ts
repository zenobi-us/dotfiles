
import { defineCommand } from "clerc";

export const NotesCommand = defineCommand({
  name: "notes",
  description: "Manage wiki notes for a project",
  flags: {
    notebook: {
      description: "Specify the notebook to use for notes",
      type: String,
      default: () => {
        ProjectService.discoverCurrentProject();
      }
    }
  },
  alias: [],
  parameters: []
}, (ctx) => {
  console.log("Notes command executed");
})
