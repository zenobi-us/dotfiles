
import { defineCommand } from "clerc";
import { Logger } from "../../services/LoggerService";
import { requireNotebookMiddleware } from "../../middleware/requireNotebookMiddleware";

export const NotesRemoveCommand = defineCommand({
  name: "notes remove",
  description: "Remove a note from the project",
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


  Logger.debug("NotesRemoveCmd %s", notebookPath);

})
