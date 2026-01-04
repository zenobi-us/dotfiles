
import { defineCommand } from "clerc";
import { Logger } from "../../services/LoggerService";

export const NotebookCommand = defineCommand({
  name: "notebook",
  description: "Manage wiki notebooks",
  flags: {},
  alias: ["nb"],
  parameters: []
}, (ctx) => {
  Logger.debug("Notebook command executed");
})
