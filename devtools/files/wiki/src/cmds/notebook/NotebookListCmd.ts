

import { defineCommand } from "clerc";
import { Logger } from "../../services/LoggerService";
import { requireNotebookMiddleware } from "../../middleware/requireNotebookMiddleware";

export const NotebookListCommand = defineCommand({
  name: "notebook list",
  description: "Manage wiki notebooks",
  flags: {},
  alias: ["nb list"],
  parameters: []
}, async (ctx) => {


  const notebooks = await ctx.store.notebooKService?.discoverNotebooks()

  if (!notebooks) {
    return;
  }


  if (notebooks.length === 0) {
    Logger.debug("NotebookListCmd: found %d notebooks", notebooks.length);
    console.log("No notebooks found.");
    return;
  }

  for (const notebook of notebooks) {
    console.log(`- ${notebook.path} (${notebook.config.name})`);
  }


})


