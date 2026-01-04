
import { defineCommand } from "clerc";
import { NotebookService } from "../../services/NotebookService";

export const NotesCommand = defineCommand({
  name: "notes",
  description: "Manage wiki notes for a project",
  flags: {
    notebook: {
      description: "Specify the notebook to use for notes",
      type: String,
      default: async () => {
        return await NotebookService.discoverNotebookPath();
      }
    }
  },
  alias: [],
  parameters: []
}, (ctx) => {
  console.log("Notes command executed");
})
