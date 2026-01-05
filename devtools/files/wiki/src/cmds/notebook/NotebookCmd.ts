
import { defineCommand } from "clerc";
import { Logger } from "../../services/LoggerService";
import { requireNotebookMiddleware } from "../../middleware/requireNotebookMiddleware";

export const NotebookCommand = defineCommand({
  name: "notebook",
  description: "Manage wiki notebooks",
  flags: {},
  alias: ["nb"],
  parameters: []
}, async (ctx) => {
  Logger.debug("NotebookCmd called");

  const notebookPath = await requireNotebookMiddleware({
    notebookService: ctx.store.notebooKService,
    path: ctx.flags.notebook
  });

  Logger.debug("NotebookCmd: %s", notebookPath);

  if (!notebookPath) {
    return
  }


})
