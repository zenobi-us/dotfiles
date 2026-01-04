
import { defineCommand } from "clerc";
import { Logger } from "../../services/LoggerService";
import { requireNotebookMiddleware } from "../../middleware/requireNotebookMiddleware";

export const NotesCommand = defineCommand({
  name: "notes",
  description: "Manage wiki notes for a project",
  flags: {
    notebook: {
      description: "Specify the notebook to use for notes",
      type: String,
    }
  },
  alias: [],
  parameters: [],
}, async (ctx) => {
  const notebookPath = await requireNotebookMiddleware({
    notebookService: ctx.store.notebooKService,
    path: ctx.flags.notebook
  });

  Logger.debug("NotesCmd: %s", notebookPath);

  if (!notebookPath) {
    return
  }

})
