
import { defineCommand } from "clerc";
import { Logger } from "../../services/LoggerService";
import { requireNotebookMiddleware } from "../../middleware/requireNotebookMiddleware";

export const NotesSearchCommand = defineCommand({
  name: "notes search",
  description: "Search notes in the project",
  alias: [],
  parameters: [
    "[query]"
  ]
}, async (ctx) => {

  const notebookPath = await requireNotebookMiddleware({
    notebookService: ctx.store.notebooKService,
    path: ctx.flags.notebook
  });

  if (!notebookPath) {
    return
  }

  Logger.debug("NotesSearchCmd %s", notebookPath);

})
