
import { defineCommand } from "clerc";
import { requireNotebookMiddleware } from "../../middleware/requireNotebookMiddleware";
import { Logger } from "../../services/LoggerService";

export const NotesAddCommand = defineCommand({
  name: "notes add",
  description: "Add a new note to the project",
  flags: {},
  alias: [],
  parameters: []
}, async (ctx) => {

  const notebookPath = await requireNotebookMiddleware({
    notebookService: ctx.store.notebooKService,
    path: ctx.flags.notebook
  });

  if (!notebookPath) {
    return
  }

  Logger.debug("NotesAddCmd: %s", notebookPath);

})
